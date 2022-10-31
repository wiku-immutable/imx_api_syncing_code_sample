import { 
  ImmutableX, 
  ImmutableXConfiguration,
  ListTradesResponse,
  ListTransfersResponse,
  Trade,
  TradesApiListTradesRequest,
  Transfer,
  TransfersApiListTransfersRequest,
} from '@imtbl/core-sdk';
import { Client } from 'pg';
import { getCursorTimestampSQL, upsertCursorsTableSQL } from '../database/cursors';
import { dbParams } from '../database/setup';
import { delay } from '../utils';
import {
  tradeDataStructure,
} from '../database/types';
import { 
  CONFIG, 
  MAX_PAGE_SIZE,
} from '../constants';
import moment from 'moment';
import { upsertTradesTableSQL } from '../database/trades';

export const nearRealTimeTradeSync = async(minTimestamp?:string) => {

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
    const [statement, params] = getCursorTimestampSQL("trades", "real-time");
    let res = await client.query(statement, params);
    console.log(res.rows[0])

    // if minTimestamp is older than previous queries, continue from where left off
    // else; start from present with empty cursor
    if (moment(res.rows[0].latest_timestamp) > moment(latestTimestamp)) {
      latestTimestamp = res.rows[0].latest_timestamp
      initialCursor = res.rows[0].cursor
    }

    let { result, cursor: newCursor}  = await getTradeData(CONFIG, MAX_PAGE_SIZE, initialCursor, latestTimestamp);
    console.log(`[TRADES] Inserted ${result.length} entries. Last entry at ${latestTimestamp}...`);

    // insert each record individually into table
    for (let tradeIndex = 0; tradeIndex < result.length; tradeIndex++) {
      try {
        const [statement, params] = upsertTradesTableSQL(transformTradeData(result[tradeIndex]));
        await client.query(statement, params);
      } catch (err) {
        console.log(result[tradeIndex])
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
      const [statement, params] = upsertCursorsTableSQL("trades", "real-time", newCursor, latestTimestamp);
      await client.query(statement, params);
    } catch (err) {
      console.error(err)
      continue;
    }
    await delay(500); // 0.5 second delay between requests if there is more data coming
  }

  await client.end()
}

export const historicalTradeSync = async(minTimestamp: string, maxTimestamp: string) => {

  const client = new Client(dbParams);
  await client.connect();

  // initial query
  const [statement, params] = getCursorTimestampSQL("trades", "historical");
  const initialCursor = await client.query(statement, params);
  console.log(initialCursor.rows[0])
  let tradeResponse = await getTradeData(CONFIG, MAX_PAGE_SIZE, initialCursor.rows[0].cursor, minTimestamp, maxTimestamp);

  while (tradeResponse.result.length) {
      console.log(`[TRADES] Obtained ${tradeResponse.result.length} entries between ${minTimestamp.toLocaleString()} and ${maxTimestamp.toLocaleString()}...`);
      console.log(`Latest timestamp is ${tradeResponse.result[tradeResponse.result.length - 1].timestamp}`)
      
      // insert each record individually into table
      for (let tradeIndex = 0; tradeIndex < tradeResponse.result.length; tradeIndex++) {
        try {
          const [statement, params] = upsertTradesTableSQL(transformTradeData(tradeResponse.result[tradeIndex]));
          await client.query(statement, params);
        } catch (err) {
            console.error(err);
        }
      }
      // upserting cursor in table
      try {
        const [statement, params] = upsertCursorsTableSQL("trades", "historical", tradeResponse.cursor, tradeResponse.result[tradeResponse.result.length - 1].timestamp);
        await client.query(statement, params);
      } catch (err){
        console.error(err);
      }
      await delay(500); // assuming 5 RPS with buffer
      
      tradeResponse  = await getTradeData(CONFIG, MAX_PAGE_SIZE, tradeResponse.cursor, minTimestamp, maxTimestamp);
  }
  // upsert cursor table once query is finished. Upserting so cursor will return to empty string
  try {
    const [statement, params] = upsertCursorsTableSQL("trades", "historical", "", "");
    await client.query(statement, params);
  } catch (err) {
    console.error(err);
  }
  await client.end()
}

export const getTradeData = async (
  config: ImmutableXConfiguration, 
  pageSize: number,
  cursor: string,
  minTimestamp: string, 
  maxTimestamp?: string 
  ): Promise<ListTradesResponse> => {
  
  let client = new ImmutableX(config)

  try {
    const tradesRequest: TradesApiListTradesRequest = {
      minTimestamp: minTimestamp,
      maxTimestamp: maxTimestamp,
      cursor: cursor,
      orderBy: 'created_at',
      direction: 'asc',
      pageSize: pageSize
    };

    return client.listTrades(tradesRequest);;
  } catch (err) {
    console.error(err);
  }
}

export function transformTradeData(tradeData: Trade): tradeDataStructure {
  return {
    transaction_id: tradeData.transaction_id,
    status: tradeData.status,
    party_a_order_id: tradeData.a.order_id,
    party_a_token_type: tradeData.a.token_type,
    party_a_token_address: tradeData.a.token_address,
    party_a_sold: tradeData.a.token_id,
    party_b_order_id: tradeData.b.order_id,
    party_b_token_type: tradeData.b.token_type,
    party_b_token_id: tradeData.b.token_id,
    party_b_token_address: tradeData.b.token_address,
    party_b_sold: tradeData.b.token_id,
    timestamp: tradeData.timestamp
  }
}


