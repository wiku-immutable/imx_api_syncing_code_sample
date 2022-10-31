import { transferDataStructure, sqlStatement } from "./types"

export const createTransfersTableSQL = `
CREATE TABLE IF NOT EXISTS transfers (
    transaction_id                      BIGINT,
    status                              TEXT,
    user_address                        TEXT,
    receiver                            TEXT,
    token_type                          TEXT,
    token_id                            TEXT,
    id                                  TEXT,
    token_address                       TEXT,
    decimals                            SMALLINT,
    quantity                            TEXT, 
    quantity_with_fees                  TEXT,
    timestamp                           TIMESTAMP,
    PRIMARY KEY (transaction_id)
)`

export const upsertTransfersTableSQL = (transferData: transferDataStructure): sqlStatement => {
    return [
        `INSERT INTO transfers (
            transaction_id,
            status,
            user_address,
            receiver,
            token_type,
            token_id,
            id,
            token_address,
            decimals,
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
            $10,
            $11,
            $12
        ) ON CONFLICT(transaction_id) DO NOTHING`,
        [
            transferData.transaction_id,
            transferData.status,
            transferData.user_address,
            transferData.receiver,
            transferData.token_type,
            transferData.token_id,
            transferData.id,
            transferData.token_address,
            transferData.decimals,
            transferData.quantity,
            transferData.quantity_with_fees,
            transferData.timestamp,
        ]
    ]
}

export const TRANSFERS_HEADERS = [
    "transaction_id",
    "status",
    "user_address",
    "receiver",
    "token_type",
    "token_id",
    "id",
    "token_address",
    "decimals",
    "quantity",
    "quantity_with_fees",
    "timestamp",
]