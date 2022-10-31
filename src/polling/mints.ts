import { 
  ImmutableX, 
  ImmutableXConfiguration,
  Mint,
  MintsApiListMintsRequest,
  ListMintsResponse,
} from '@imtbl/core-sdk';
import { Client } from 'pg';
import { getCursorTimestampSQL, upsertCursorsTableSQL } from '../database/cursors';
import { dbParams } from '../database/setup';
import { delay } from '../utils';
import {
  mintDataStructure
} from '../database/types';
import { 
  CONFIG, 
  MAX_PAGE_SIZE,
} from '../constants';
import moment from 'moment';
import { upsertMintsTableSQL } from '../database/mints';

export const nearRealTimeMintSync = async(minTimestamp?:string) => {

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
    const [statement, params] = getCursorTimestampSQL("mints", "real-time");
    let res = await client.query(statement, params);
    console.log(res.rows[0])

    // if minTimestamp is older than previous queries, continue from where left off
    // else; start from present with empty cursor
    if (moment(res.rows[0].latest_timestamp) > moment(latestTimestamp)) {
      latestTimestamp = res.rows[0].latest_timestamp
      initialCursor = res.rows[0].cursor
    }

    let { result, cursor: newCursor}  = await getMintData(CONFIG, MAX_PAGE_SIZE, initialCursor, latestTimestamp);
    console.log(`[MINTS] Inserted ${result.length} entries. Last entry at ${latestTimestamp}...`);

    // insert each record individually into table
    for (let mintIndex = 0; mintIndex < result.length; mintIndex++) {
      try {
        const [statement, params] = upsertMintsTableSQL(transformMintData(result[mintIndex]));
        await client.query(statement, params);
      } catch (err) {
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
      const [statement, params] = upsertCursorsTableSQL("mints", "real-time", newCursor, latestTimestamp);
      await client.query(statement, params);
    } catch (err) {
      console.error(err)
      continue;
    }
    await delay(500); // 0.5 second delay between requests if there is more data coming
  }

  await client.end()
}

export const historicalMintSync = async(minTimestamp: string, maxTimestamp: string) => {

  const client = new Client(dbParams);
  await client.connect();

  // initial query
  const [statement, params] = getCursorTimestampSQL("mints", "historical");
  const initialCursor = await client.query(statement, params);
  console.log(initialCursor.rows[0])
  let mintResponse = await getMintData(CONFIG, MAX_PAGE_SIZE, initialCursor.rows[0].cursor, minTimestamp, maxTimestamp);

  while (mintResponse.result.length) {
      console.log(`[MINTS] Obtained ${mintResponse.result.length} entries between ${minTimestamp.toLocaleString()} and ${maxTimestamp.toLocaleString()}...`);
      console.log(`Latest timestamp is ${mintResponse.result[mintResponse.result.length - 1].timestamp}`)
      
      // insert each record individually into table
      for (let mintIndex = 0; mintIndex < mintResponse.result.length; mintIndex++) {
        try {
          const [statement, params] = upsertMintsTableSQL(transformMintData(mintResponse.result[mintIndex])); // do bulk insert?
          await client.query(statement, params);
        } catch (err) {
            console.error(err);
        }
      }
      // upserting cursor in table
      try {
        const [statement, params] = upsertCursorsTableSQL("mints", "historical", mintResponse.cursor, mintResponse.result[mintResponse.result.length - 1].timestamp);
        await client.query(statement, params);
      } catch (err){
        console.error(err);
      }
      await delay(500); // assuming 5 RPS with buffer
      
      mintResponse  = await getMintData(CONFIG, MAX_PAGE_SIZE, mintResponse.cursor, minTimestamp, maxTimestamp);
  }
  // upsert cursor table once query is finished. Upserting so cursor will return to empty string
  try {
    const [statement, params] = upsertCursorsTableSQL("mints", "historical", "", "");
    await client.query(statement, params);
  } catch (err) {
    console.error(err);
  }
  await client.end()
}

export const getMintData = async (
  config: ImmutableXConfiguration, 
  pageSize: number,
  cursor: string,
  minTimestamp: string, 
  maxTimestamp?: string 
  ): Promise<ListMintsResponse> => {
  
  let client = new ImmutableX(config)

  try {
    const mintsRequest: MintsApiListMintsRequest = {
      minTimestamp: minTimestamp,
      maxTimestamp: maxTimestamp,
      cursor: cursor,
      orderBy: 'created_at',
      direction: 'asc',
      pageSize: pageSize
    };

    return client.listMints(mintsRequest);;
  } catch (err) {
    console.error(err);
  }
}

export function transformMintData(mintData: Mint): mintDataStructure {
  return {
    transaction_id: mintData.transaction_id,
    status: mintData.status,
    user_address: mintData.user,
    token_type: mintData.token.type,
    id: mintData.token.data.id,
    token_address: mintData.token.data.token_address,
    token_id: mintData.token.data.token_id,
    quantity: mintData.token.data.quantity,
    quantity_with_fees: mintData.token.data.quantity_with_fees,
    timestamp: mintData.timestamp
  }
}
