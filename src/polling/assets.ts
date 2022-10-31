import { 
  ImmutableX, 
  AssetsApiListAssetsRequest,
  AssetWithOrders,
  ImmutableXConfiguration,
  ListAssetsResponse,
} from '@imtbl/core-sdk';
import { Client } from 'pg';
import { upsertAssetsTableSQL } from '../database/assets';
import { getCursorTimestampSQL, upsertCursorsTableSQL } from '../database/cursors';
import { dbParams } from '../database/setup';
import { delay } from '../utils';
import {
  assetDataStructure
} from '../database/types';
import { 
  CONFIG, 
  MAX_PAGE_SIZE,
} from '../constants';
import moment from 'moment';

export const nearRealTimeAssetSync = async(minTimestamp?:string) => {

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
    const [statement, params] = getCursorTimestampSQL("assets", "real-time");
    let res = await client.query(statement, params);
    console.log(res.rows[0])

    // if minTimestamp is older than previous queries, continue from where left off
    // else; start from present with empty cursor
    if (moment(res.rows[0].latest_timestamp) > moment(latestTimestamp)) {
      latestTimestamp = res.rows[0].latest_timestamp
      initialCursor = res.rows[0].cursor
    }

    let { result, cursor: newCursor}  = await getAssetData(CONFIG, MAX_PAGE_SIZE, initialCursor, latestTimestamp);
    console.log(`[ASSETS] Inserted ${result.length} entries. Last entry at ${latestTimestamp}...`);

    // insert each record individually into table
    for (let assetIndex = 0; assetIndex < result.length; assetIndex++) {
      try {
        const [statement, params] = upsertAssetsTableSQL(transformAssetData(result[assetIndex]));
        await client.query(statement, params);
      } catch (err) {
          console.error(err);
          continue;
      }
    }

    // update latestTimestamp if there are results, else use previously stored one
    if (result.length) {
      latestTimestamp = result[result.length - 1].updated_at
    } else {
      await delay(5000) // 5 second delay if result is empty (i.e. no new data)
    }
    try {
      const [statement, params] = upsertCursorsTableSQL("assets", "real-time", newCursor, latestTimestamp);
      await client.query(statement, params);
    } catch (err) {
      console.error(err)
      continue;
    }
    await delay(500); // 0.5 second delay between requests if there is more data coming
  }

  await client.end()
}

export const historicalAssetSync = async(minTimestamp: string, maxTimestamp: string) => {

  const client = new Client(dbParams);
  await client.connect();

  // initial query
  const [statement, params] = getCursorTimestampSQL("assets", "historical");
  const initialCursor = await client.query(statement, params);
  console.log(initialCursor.rows[0])
  let assetResponse = await getAssetData(CONFIG, MAX_PAGE_SIZE, initialCursor.rows[0].cursor, minTimestamp, maxTimestamp);

  while (assetResponse.result.length) {
      console.log(`[ASSETS] Obtained ${assetResponse.result.length} entries between ${minTimestamp.toLocaleString()} and ${maxTimestamp.toLocaleString()}...`);
      console.log(`Latest timestamp is ${assetResponse.result[assetResponse.result.length - 1].updated_at}`)
      
      // insert each record individually into table
      for (let assetIndex = 0; assetIndex < assetResponse.result.length; assetIndex++) {
        try {
          const [statement, params] = upsertAssetsTableSQL(transformAssetData(assetResponse.result[assetIndex])); // do bulk insert?
          await client.query(statement, params);
        } catch (err) {
            console.error(err);
        }
      }
      // upserting cursor in table
      try {
        const [statement, params] = upsertCursorsTableSQL("assets", "historical", assetResponse.cursor, assetResponse.result[assetResponse.result.length - 1].updated_at);
        await client.query(statement, params);
      } catch (err){
        console.error(err);
      }
      await delay(500); // assuming 5 RPS with buffer
      
      assetResponse  = await getAssetData(CONFIG, MAX_PAGE_SIZE, assetResponse.cursor, minTimestamp, maxTimestamp);
  }
  // upsert cursor table once query is finished. Upserting so cursor will return to empty string
  try {
    const [statement, params] = upsertCursorsTableSQL("assets", "historical", "", "");
    await client.query(statement, params);
  } catch (err) {
    console.error(err);
  }
  await client.end()
}

export const getAssetData = async (
  config: ImmutableXConfiguration, 
  pageSize: number,
  cursor: string,
  minTimestamp: string, 
  maxTimestamp?: string 
  ): Promise<ListAssetsResponse> => {
  
  let client = new ImmutableX(config)

  try {
    const assetsRequest: AssetsApiListAssetsRequest = {
      updatedMinTimestamp: minTimestamp,
      updatedMaxTimestamp: maxTimestamp,
      includeFees: true,
      cursor: cursor,
      orderBy: 'updated_at',
      direction: 'asc',
      pageSize: pageSize
    };

    return client.listAssets(assetsRequest);;
  } catch (err) {
    console.error(err);
  }
}

export function transformAssetData(assetData: AssetWithOrders): assetDataStructure {
  return {
    id: assetData.id,
    token_address: assetData.token_address,
    token_id: assetData.token_id,
    user_address: assetData.user,
    status: assetData.status,
    uri: assetData.uri,
    name: assetData.name,
    description: assetData.description,
    image_url: assetData.image_url,
    metadata: JSON.stringify(assetData.metadata),
    collection_name: assetData.collection.name,
    collection_icon_url: assetData.collection.icon_url,
    fees: JSON.stringify(assetData.fees),
    created_at: assetData.created_at,
    updated_at: assetData.updated_at
  }
}


