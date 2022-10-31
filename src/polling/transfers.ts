import { 
  ImmutableX, 
  ImmutableXConfiguration,
  ListTransfersResponse,
  Transfer,
  TransfersApiListTransfersRequest,
} from '@imtbl/core-sdk';
import { Client } from 'pg';
import { getCursorTimestampSQL, upsertCursorsTableSQL } from '../database/cursors';
import { dbParams } from '../database/setup';
import { delay } from '../utils';
import {
  transferDataStructure
} from '../database/types';
import { 
  CONFIG, 
  MAX_PAGE_SIZE,
} from '../constants';
import moment from 'moment';
import { upsertTransfersTableSQL } from '../database/transfers';

export const nearRealTimeTransferSync = async(minTimestamp?:string) => {

  const client = new Client(dbParams);
  await client.connect();

  let initialCursor = "";
  let latestTimestamp = moment().toISOString();

  // closes db connection at keyboard interrupt
  process.on('SIGINT', () => {
    client.end()
    .then(() => console.log("closed the client"))
    .catch(console.error)
  });

  // start from minTimestamp if designated, else start from present
  if (minTimestamp) {
    latestTimestamp = minTimestamp;
  }

  while (true) {
    // check cursors table for previous queries
    const [statement, params] = getCursorTimestampSQL("transfers", "real-time");
    let res = await client.query(statement, params);
    console.log(res.rows[0])

    // if minTimestamp is older than previous queries, continue from where left off
    // else; start from present with empty cursor
    if (moment(res.rows[0].latest_timestamp) > moment(latestTimestamp)) {
      latestTimestamp = res.rows[0].latest_timestamp
      initialCursor = res.rows[0].cursor
    }

    let { result, cursor: newCursor}  = await getTransferData(CONFIG, MAX_PAGE_SIZE, initialCursor, latestTimestamp);
    console.log(`[TRANSFERS] Inserted ${result.length} entries. Last entry at ${latestTimestamp}...`);

    // insert each record individually into table
    for (let transferIndex = 0; transferIndex < result.length; transferIndex++) {
      try {
        const [statement, params] = upsertTransfersTableSQL(transformTransferData(result[transferIndex]));
        await client.query(statement, params);
      } catch (err) {
        console.log(result[transferIndex])
          console.error(err);
          continue;
      }
    }

    // update latestTimestamp if there are results, else use previously stored one
    if (result.length) {
      latestTimestamp = result[result.length - 1].timestamp
    } else {
      await delay(5000) // 5 second delay if result is empty (i.e. no new data)
    }
    try {
      const [statement, params] = upsertCursorsTableSQL("transfers", "real-time", newCursor, latestTimestamp);
      await client.query(statement, params);
    } catch (err) {
      console.error(err)
      continue;
    }
    await delay(500); // 0.5 second delay between requests if there is more data coming
  }

  await client.end()
}

export const historicalTransferSync = async(minTimestamp: string, maxTimestamp: string) => {

  const client = new Client(dbParams);
  await client.connect();

  // initial query
  const [statement, params] = getCursorTimestampSQL("transfers", "historical");
  const initialCursor = await client.query(statement, params);
  console.log(initialCursor.rows[0])
  let transferResponse = await getTransferData(CONFIG, MAX_PAGE_SIZE, initialCursor.rows[0].cursor, minTimestamp, maxTimestamp);

  while (transferResponse.result.length) {
      console.log(`[TRANSFERS] Obtained ${transferResponse.result.length} entries between ${minTimestamp.toLocaleString()} and ${maxTimestamp.toLocaleString()}...`);
      console.log(`Latest timestamp is ${transferResponse.result[transferResponse.result.length - 1].timestamp}`)
      
      // insert each record individually into table
      for (let transferIndex = 0; transferIndex < transferResponse.result.length; transferIndex++) {
        try {
          const [statement, params] = upsertTransfersTableSQL(transformTransferData(transferResponse.result[transferIndex]));
          await client.query(statement, params);
        } catch (err) {
            console.error(err);
        }
      }
      // upserting cursor in table
      try {
        const [statement, params] = upsertCursorsTableSQL("transfers", "historical", transferResponse.cursor, transferResponse.result[transferResponse.result.length - 1].timestamp);
        await client.query(statement, params);
      } catch (err){
        console.error(err);
      }
      await delay(500); // assuming 5 RPS with buffer
      
      transferResponse  = await getTransferData(CONFIG, MAX_PAGE_SIZE, transferResponse.cursor, minTimestamp, maxTimestamp);
  }
  // upsert cursor table once query is finished. Upserting so cursor will return to empty string
  try {
    const [statement, params] = upsertCursorsTableSQL("transfers", "historical", "", "");
    await client.query(statement, params);
  } catch (err) {
    console.error(err);
  }
  await client.end()
}

export const getTransferData = async (
  config: ImmutableXConfiguration, 
  pageSize: number,
  cursor: string,
  minTimestamp: string, 
  maxTimestamp?: string 
  ): Promise<ListTransfersResponse> => {
  
  let client = new ImmutableX(config)

  try {
    const transfersRequest: TransfersApiListTransfersRequest = {
      minTimestamp: minTimestamp,
      maxTimestamp: maxTimestamp,
      cursor: cursor,
      orderBy: 'created_at',
      direction: 'asc',
      pageSize: pageSize
    };

    return client.listTransfers(transfersRequest);;
  } catch (err) {
    console.error(err);
  }
}

export function transformTransferData(transferData: Transfer): transferDataStructure {
  return {
    transaction_id: transferData.transaction_id,
    status: transferData.status,
    user_address: transferData.user,
    receiver: transferData.receiver,
    token_type: transferData.token.type,
    token_id: transferData.token.data.token_id,
    id: transferData.token.data.id,
    token_address: transferData.token.data.token_address,
    decimals: transferData.token.data.decimals,
    quantity: transferData.token.data.quantity,
    quantity_with_fees: transferData.token.data.quantity_with_fees,
    timestamp: transferData.timestamp
  }
}


