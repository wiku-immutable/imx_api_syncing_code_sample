import { assetDataStructure, sqlStatement } from "./types"

export const createAssetsTableSQL = `
CREATE TABLE IF NOT EXISTS assets (
    token_address       TEXT,
    token_id            TEXT,
    id                  TEXT,
    user_address        TEXT,
    status              TEXT,
    uri                 TEXT,
    name                TEXT,
    description         TEXT,
    image_url           TEXT,
    metadata            TEXT DEFAULT '{}', 
    collection_name     TEXT,
    collection_icon_url TEXT,
    fees                TEXT,
    created_at          TIMESTAMP, 
    updated_at          TIMESTAMP,
    PRIMARY KEY (token_address, token_id)
)`

export const upsertAssetsTableSQL = (assetData: assetDataStructure): sqlStatement => {
    return [
        `INSERT INTO assets (
            token_address,
            token_id,
            id,
            user_address,
            status,
            uri,
            name,
            description,
            image_url,
            metadata,
            collection_name,
            collection_icon_url,
            fees,
            created_at,
            updated_at
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
            $15
        ) ON CONFLICT(token_address, token_id) 
        DO UPDATE SET
        user_address = excluded.user_address,
        id = excluded.id,
        status = excluded.status,
        uri = excluded.uri,
        name = excluded.name,
        description = excluded.description,
        image_url = excluded.image_url,
        metadata = excluded.metadata,
        collection_name = excluded.collection_name,
        collection_icon_url = excluded.collection_icon_url,
        fees = excluded.fees,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
        WHERE 
        assets.updated_at < excluded.updated_at`,
        [
            assetData.token_address,
            assetData.token_id,
            assetData.id,
            assetData.user_address,
            assetData.status,
            assetData.uri,
            assetData.name,
            assetData.description,
            assetData.image_url,
            assetData.metadata,
            assetData.collection_name,
            assetData.collection_icon_url,
            assetData.fees,
            assetData.created_at,
            assetData.updated_at
        ]
    ]
}

export const ASSETS_HEADERS = [ 
    "token_address",
    "token_id", 
    "id",
    "user_address", 
    "status", 
    "uri", 
    "name", 
    "description", 
    "image_url", 
    "metadata", 
    "collection_name", 
    "collection_icon_url", 
    "fees", 
    "created_at", 
    "updated_at"
]