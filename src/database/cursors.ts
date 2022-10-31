import { sqlStatement } from "./types"

export const createCursorsTableSQL = `
CREATE TABLE IF NOT EXISTS cursors (
    endpoint_name       TEXT,
    polling_type        TEXT,
    cursor              TEXT,
    latest_timestamp    TEXT,
    PRIMARY KEY (endpoint_name, polling_type)
)`

export const setupCursorsTableSQL = (endpoint_name: string, polling_type:string): sqlStatement => {
  return [
    `INSERT INTO cursors (
      endpoint_name,
      polling_type,
      cursor,
      latest_timestamp
    ) VALUES (
      $1,
      $2,
      $3,
      $4
    ) ON CONFLICT(endpoint_name, polling_type) DO UPDATE 
    SET 
    cursor = excluded.cursor,
    latest_timestamp = excluded.latest_timestamp`, 
    [ endpoint_name, polling_type, "", ""]
  ]
}

export const getCursorTimestampSQL = (endpoint_name: string, polling_type:string): sqlStatement => {
    return [`
        SELECT 
            cursor, 
            latest_timestamp
        FROM cursors
        WHERE endpoint_name = $1
        AND polling_type = $2`,
        [
            endpoint_name, 
            polling_type
        ]
    ]
}

export const upsertCursorsTableSQL = (endpoint_name: string, polling_type:string, cursor: string, latest_timestamp:string): sqlStatement => {
  return [
      `INSERT INTO cursors (
          endpoint_name,
          polling_type,
          cursor,
          latest_timestamp
      ) VALUES(
          $1,
          $2,
          $3,
          $4
      ) ON CONFLICT(endpoint_name, polling_type) DO UPDATE 
      SET 
      cursor = excluded.cursor,
      latest_timestamp = excluded.latest_timestamp`,
      [
          endpoint_name,
          polling_type,
          cursor,
          latest_timestamp
      ]
  ]
}