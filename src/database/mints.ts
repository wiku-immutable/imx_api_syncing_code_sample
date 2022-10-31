import { mintDataStructure, sqlStatement } from "./types"

export const createMintsTableSQL = `
CREATE TABLE IF NOT EXISTS mints (
    transaction_id                  BIGINT,
    status                          TEXT,
    user_address                    TEXT,
    token_type                      TEXT,
    id                              TEXT,
    token_address                   TEXT,
    token_id                        TEXT,
    quantity                        TEXT, 
    quantity_with_fees              TEXT,
    timestamp                       TIMESTAMP,
    PRIMARY KEY (transaction_id)
)`

export const upsertMintsTableSQL = (mintData: mintDataStructure): sqlStatement => {
    return [
        `INSERT INTO mints (
            transaction_id,
            status,
            user_address,
            token_type,
            id,
            token_address,
            token_id,
            quantity,
            quantity_with_fees,
            timestamp
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
            $10
        ) ON CONFLICT(transaction_id) DO NOTHING`,
        [
            mintData.transaction_id,
            mintData.status,
            mintData.user_address,
            mintData.token_type,
            mintData.id,
            mintData.token_address,
            mintData.token_id,
            mintData.quantity,
            mintData.quantity_with_fees,
            mintData.timestamp,
        ]
    ]
}

export const MINTS_HEADERS = [
    "transaction_id",
    "status",
    "user_address",
    "token_type",
    "id",
    "token_address",
    "token_id",
    "quantity",
    "quantity_with_fees",
    "timestamp",
]