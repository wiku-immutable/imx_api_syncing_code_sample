import { orderDataStructure, sqlStatement } from "./types"

export const createOrdersTableSQL = `
CREATE TABLE IF NOT EXISTS orders (
    order_id                                BIGINT,
    status                                  TEXT,
    user_address                            TEXT,
    sell_token_type                         TEXT,
    sell_id                                 TEXT,
    sell_token_id                           TEXT,
    sell_token_address                      TEXT,
    sell_token_decimals                     TEXT,
    sell_quantity                           TEXT,
    sell_quantity_with_fees                 TEXT,
    sell_properties_name                    TEXT, 
    sell_properties_image_url               TEXT,
    sell_properties_collection_name         TEXT,
    sell_properties_collection_icon_url     TEXT,
    buy_token_type                          TEXT,
    buy_id                                  TEXT,
    buy_token_id                            TEXT,
    buy_token_address                       TEXT,
    buy_token_decimals                      SMALLINT,
    buy_quantity                            TEXT,
    buy_quantity_with_fees                  TEXT,
    buy_properties_name                     TEXT, 
    buy_properties_image_url                TEXT,
    buy_properties_collection_name          TEXT,
    buy_properties_collection_icon_url      TEXT,
    amount_sold                             TEXT,
    expiration_timestamp                    TEXT,
    timestamp                               TIMESTAMP,
    updated_timestamp                       TIMESTAMP,
    fees                                    TEXT,
    PRIMARY KEY (order_id)
)`

export const upsertOrdersTableSQL = (orderData: orderDataStructure): sqlStatement => {
    return [
        `INSERT INTO orders (
            order_id,
            status,
            user_address,
            sell_token_type,
            sell_id,
            sell_token_id,
            sell_token_address,
            sell_token_decimals,
            sell_quantity,
            sell_quantity_with_fees,
            sell_properties_name, 
            sell_properties_image_url,
            sell_properties_collection_name,
            sell_properties_collection_icon_url,
            buy_token_type,
            buy_id,
            buy_token_id,
            buy_token_address,
            buy_token_decimals,
            buy_quantity,
            buy_quantity_with_fees,
            buy_properties_name, 
            buy_properties_image_url,
            buy_properties_collection_name,
            buy_properties_collection_icon_url,
            amount_sold,
            expiration_timestamp,
            timestamp,
            updated_timestamp,
            fees
        ) VALUES(
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            $20,
            $21,
            $22,
            $23,
            $24,
            $25,
            $26,
            $27,
            $28,
            $29,
            $30
        ) ON CONFLICT(order_id) DO UPDATE 
        SET 
        status = excluded.status,
        updated_timestamp = excluded.updated_timestamp,
        sell_properties_name = excluded.sell_properties_name, 
        sell_properties_image_url = excluded.sell_properties_image_url,
        sell_properties_collection_name = excluded.sell_properties_collection_name,
        sell_properties_collection_icon_url = excluded.sell_properties_collection_icon_url,
        buy_properties_name = excluded.buy_properties_name, 
        buy_properties_image_url = excluded.buy_properties_image_url,
        buy_properties_collection_name = excluded.buy_properties_collection_name,
        buy_properties_collection_icon_url = excluded.buy_properties_collection_icon_url
        WHERE
        orders.updated_timestamp < excluded.updated_timestamp`,
        [
            orderData.order_id,
            orderData.status,
            orderData.user_address,
            orderData.sell_token_type,
            orderData.sell_id,
            orderData.sell_token_id,
            orderData.sell_token_address,
            orderData.sell_token_decimals,
            orderData.sell_quantity,
            orderData.sell_quantity_with_fees,
            orderData.sell_properties_name, 
            orderData.sell_properties_image_url,
            orderData.sell_properties_collection_name,
            orderData.sell_properties_collection_icon_url,
            orderData.buy_token_type,
            orderData.buy_id,
            orderData.buy_token_id,
            orderData.buy_token_address,
            orderData.buy_token_decimals,
            orderData.buy_quantity,
            orderData.buy_quantity_with_fees,
            orderData.buy_properties_name, 
            orderData.buy_properties_image_url,
            orderData.buy_properties_collection_name,
            orderData.buy_properties_collection_icon_url,
            orderData.amount_sold,
            orderData.expiration_timestamp,
            orderData.timestamp,
            orderData.updated_timestamp,
            orderData.fees
        ]
    ]
}

export const ORDERS_HEADERS = [
    "order_id",
    "status",
    "user_address",
    "sell_token_type",
    "sell_id",
    "sell_token_id",
    "sell_token_address",
    "sell_token_decimals",
    "sell_quantity",
    "sell_quantity_with_fees",
    "sell_properties_name", 
    "sell_properties_image_url",
    "sell_properties_collection_name",
    "sell_properties_collection_icon_url",
    "buy_token_type",
    "buy_id",
    "buy_token_id",
    "buy_token_address",
    "buy_token_decimals",
    "buy_quantity",
    "buy_quantity_with_fees",
    "buy_properties_name", 
    "buy_properties_image_url",
    "buy_properties_collection_name",
    "buy_properties_collection_icon_url",
    "amount_sold",
    "expiration_timestamp",
    "timestamp",
    "updated_timestamp",
    "fees"
]