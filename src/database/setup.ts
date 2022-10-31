import { Client } from "pg"
import { pollingTypes } from "../constants"
import { endpoints } from "../constants"
import { createAssetsTableSQL } from "./assets"
import { createCursorsTableSQL, setupCursorsTableSQL } from "./cursors"
import { createMintsTableSQL } from "./mints"
import { createOrdersTableSQL } from "./orders"
import { createTradesTableSQL } from "./trades"
import { createTransfersTableSQL } from "./transfers"

export const dbParams = {
    "host": '',
    "password": '',
    "port": 5432,
    "database": '',
    "user": ''
  }

export const setupTables = async(): Promise<void> => {
  const client = new Client(dbParams);
  await client.connect();
  await client.query(createCursorsTableSQL);

  for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex++) {
    for (let typesIndex = 0; typesIndex < pollingTypes.length; typesIndex++) {
      const [statement, params] =  setupCursorsTableSQL(endpoints[endpointIndex], pollingTypes[typesIndex])
      await client.query(statement, params);
    }
  }

  await client.query(createAssetsTableSQL);
  await client.query(createOrdersTableSQL);
  await client.query(createMintsTableSQL);
  await client.query(createTradesTableSQL);
  await client.query(createTransfersTableSQL);

  await client.end()
}