import { tradeDataStructure, sqlStatement } from "./types"

export const createTradesTableSQL = `
CREATE TABLE IF NOT EXISTS trades (
    transaction_id              BIGINT,
    status                      TEXT,
    party_a_order_id            BIGINT,
    party_a_token_type          TEXT,
    party_a_token_address       TEXT,
    party_a_sold                TEXT,
    party_b_order_id            BIGINT,
    party_b_token_type          TEXT,
    party_b_token_id            TEXT,
    party_b_token_address       TEXT,
    party_b_sold                TEXT,
    timestamp                   TIMESTAMP,
    PRIMARY KEY (transaction_id)
)`

export const upsertTradesTableSQL = (tradeData: tradeDataStructure): sqlStatement => {
    return [
        `INSERT INTO trades (
            transaction_id,
            status,
            party_a_order_id,
            party_a_token_type,
            party_a_token_address,
            party_a_sold,
            party_b_order_id,
            party_b_token_type,
            party_b_token_id,
            party_b_token_address,
            party_b_sold,
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
            tradeData.transaction_id,
            tradeData.status,
            tradeData.party_a_order_id,
            tradeData.party_a_token_type,
            tradeData.party_a_token_address,
            tradeData.party_a_sold,
            tradeData.party_b_order_id,
            tradeData.party_b_token_type,
            tradeData.party_b_token_id,
            tradeData.party_b_token_address,
            tradeData.party_b_sold,
            tradeData.timestamp,
        ]
    ]
}

export const TRADES_HEADERS = [
    "transaction_id",
    "status",
    "party_a_order_id",
    "party_a_token_type",
    "party_a_token_address",
    "party_a_sold",
    "party_b_order_id",
    "party_b_token_type",
    "party_b_token_id",
    "party_b_token_address",
    "party_b_sold",
    "timestamp",
]