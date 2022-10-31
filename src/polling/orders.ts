import { 
  ImmutableX, 
  ImmutableXConfiguration,
  OrdersApiListOrdersRequest,
  ListOrdersResponse,
  Order,
} from '@imtbl/core-sdk';
import { Client } from 'pg';
import { getCursorTimestampSQL, upsertCursorsTableSQL } from '../database/cursors';
import { dbParams } from '../database/setup';
import { delay } from '../utils';
import {
  orderDataStructure
} from '../database/types';
import { 
  CONFIG, 
  MAX_PAGE_SIZE,
} from '../constants';
import moment from 'moment';
import { upsertOrdersTableSQL } from '../database/orders';

export const nearRealTimeOrderSync = async(minTimestamp?:string) => {

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
    const [statement, params] = getCursorTimestampSQL("orders", "real-time");
    let res = await client.query(statement, params);
    console.log(res.rows[0])

    // if minTimestamp is older than previous queries, continue from where left off
    // else; start from present with empty cursor
    if (moment(res.rows[0].latest_timestamp) > moment(latestTimestamp)) {
      latestTimestamp = res.rows[0].latest_timestamp
      initialCursor = res.rows[0].cursor
    }

    let { result, cursor: newCursor}  = await getOrderData(CONFIG, MAX_PAGE_SIZE, initialCursor, latestTimestamp);
    console.log(`[ORDERS] Inserted ${result.length} entries. Last entry at ${latestTimestamp}...`);

    // insert each record individually into table
    for (let orderIndex = 0; orderIndex < result.length; orderIndex++) {
      try {
        const [statement, params] = upsertOrdersTableSQL(transformOrderData(result[orderIndex]));
        await client.query(statement, params);
      } catch (err) {
          console.log(result[orderIndex]) 
          console.error(err);
          continue;
      }
    }

    // update latestTimestamp if there are results, else use previously stored one
    if (result.length) {
      latestTimestamp = result[result.length - 1].updated_timestamp
    } else {
      await delay(5000) // 5 second delay if result is empty (i.e. no new data)
    }
    try {
      const [statement, params] = upsertCursorsTableSQL("orders", "real-time", newCursor, latestTimestamp);
      await client.query(statement, params);
    } catch (err) {
      console.error(err)
      continue;
    }
    await delay(500); // 0.5 second delay between requests if there is more data coming
  }
  await client.end()
}

export const historicalOrderSync = async(minTimestamp: string, maxTimestamp: string) => {

  const client = new Client(dbParams);
  await client.connect();

  // initial query
  const [statement, params] = getCursorTimestampSQL("orders", "historical");
  const initialCursor = await client.query(statement, params);
  console.log(initialCursor.rows[0])
  let orderResponse = await getOrderData(CONFIG, MAX_PAGE_SIZE, initialCursor.rows[0].cursor, minTimestamp, maxTimestamp);

  while (orderResponse.result.length) {
      console.log(`[ORDERS] Obtained ${orderResponse.result.length} entries between ${minTimestamp.toLocaleString()} and ${maxTimestamp.toLocaleString()}...`);
      console.log(`Latest timestamp is ${orderResponse.result[orderResponse.result.length - 1].updated_timestamp}`)
      
      // insert each record individually into table
      for (let orderIndex = 0; orderIndex < orderResponse.result.length; orderIndex++) {
        try {
          const [statement, params] = upsertOrdersTableSQL(transformOrderData(orderResponse.result[orderIndex])); // do bulk insert?
          await client.query(statement, params);
        } catch (err) {
            console.error(err);
        }
      }
      // upserting cursor in table
      try {
        const [statement, params] = upsertCursorsTableSQL("orders", "historical", orderResponse.cursor, orderResponse.result[orderResponse.result.length - 1].updated_timestamp);
        await client.query(statement, params);
      } catch (err){
        console.error(err);
      }
      await delay(500); // assuming 5 RPS with buffer
      
      orderResponse  = await getOrderData(CONFIG, MAX_PAGE_SIZE, orderResponse.cursor, minTimestamp, maxTimestamp);
  }
  // upsert cursor table once query is finished. Upserting so cursor will return to empty string
  try {
    const [statement, params] = upsertCursorsTableSQL("orders", "historical", "", "");
    await client.query(statement, params);
  } catch (err) {
    console.error(err);
  }
  await client.end()
}

export const getOrderData = async (
  config: ImmutableXConfiguration, 
  pageSize: number,
  cursor: string,
  minTimestamp: string, 
  maxTimestamp?: string 
  ): Promise<ListOrdersResponse> => {
  
  let client = new ImmutableX(config)

  try {
    const ordersRequest: OrdersApiListOrdersRequest = {
      updatedMinTimestamp: minTimestamp,
      updatedMaxTimestamp: maxTimestamp,
      includeFees: true,
      cursor: cursor,
      orderBy: 'updated_at',
      direction: 'asc',
      pageSize: pageSize
    };

    return client.listOrders(ordersRequest);;
  } catch (err) {
    console.error(err);
  }
}

function sellorderERC721 (orderData: Order): orderDataStructure {
  return {
    order_id: orderData.order_id,
    status: orderData.status,
    user_address: orderData.user,
    sell_token_type: orderData.sell.type,
    sell_id: orderData.sell.data.id,
    sell_token_id: orderData.sell.data.token_id,
    sell_token_address: orderData.sell.data.token_address,
    sell_token_decimals: null,
    sell_quantity: orderData.sell.data.quantity,
    sell_quantity_with_fees: orderData.sell.data.quantity_with_fees,
    sell_properties_name: orderData.sell.data.properties.name,
    sell_properties_image_url: orderData.sell.data.properties.image_url,
    sell_properties_collection_name: orderData.sell.data.properties.collection.name,
    sell_properties_collection_icon_url: orderData.sell.data.properties.collection.icon_url,
    buy_token_type: orderData.buy.type,
    buy_id: null,
    buy_token_id: null,
    buy_token_address: orderData.buy.data.token_address,
    buy_token_decimals: orderData.buy.data.decimals,
    buy_quantity: orderData.buy.data.quantity,
    buy_quantity_with_fees: orderData.buy.data.quantity_with_fees,
    buy_properties_name: null,
    buy_properties_image_url: null,
    buy_properties_collection_name: null,
    buy_properties_collection_icon_url: null,
    amount_sold: orderData.amount_sold,
    expiration_timestamp: orderData.expiration_timestamp,
    timestamp: orderData.timestamp,
    updated_timestamp: orderData.updated_timestamp,
    fees: JSON.stringify(orderData.fees)
  }
}

function sellOrderETHERC20 (orderData: Order): orderDataStructure {
  return {
    order_id: orderData.order_id,
    status: orderData.status,
    user_address: orderData.user,
    sell_token_type: orderData.sell.type,
    sell_id: null,
    sell_token_id: null,
    sell_token_address: orderData.sell.data.token_address,
    sell_token_decimals: orderData.sell.data.decimals,
    sell_quantity: orderData.sell.data.quantity,
    sell_quantity_with_fees: orderData.sell.data.quantity_with_fees,
    sell_properties_name: null,
    sell_properties_image_url: null,
    sell_properties_collection_name: null,
    sell_properties_collection_icon_url: null,
    buy_token_type: orderData.buy.type,
    buy_id: orderData.buy.data.id,
    buy_token_id: orderData.buy.data.token_id,
    buy_token_address: orderData.buy.data.token_address,
    buy_token_decimals: null,
    buy_quantity: orderData.buy.data.quantity,
    buy_quantity_with_fees: orderData.buy.data.quantity_with_fees,
    buy_properties_name: orderData.buy.data.properties.name,
    buy_properties_image_url: orderData.buy.data.properties.image_url,
    buy_properties_collection_name: orderData.buy.data.properties.collection.name,
    buy_properties_collection_icon_url: orderData.buy.data.properties.collection.icon_url,
    amount_sold: orderData.amount_sold,
    expiration_timestamp: orderData.expiration_timestamp,
    timestamp: orderData.timestamp,
    updated_timestamp: orderData.updated_timestamp,
    fees: JSON.stringify(orderData.fees)
  }
}

export function transformOrderData(orderData: Order): orderDataStructure {
  if (orderData.sell.type == "ERC721") {
    return sellorderERC721(orderData)
  } else {
    return sellOrderETHERC20(orderData)
  }
}


