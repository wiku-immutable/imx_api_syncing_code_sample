import { Client } from "pg"
import { pollingTypes } from "../constants"
import { endpoints } from "../constants"
import { createAssetsTableSQL } from "./assets"
import { createCursorsTableSQL, setupCursorsTableSQL } from "./cursors"
import { createMintsTableSQL } from "./mints"
import { createOrdersTableSQL } from "./orders"
import { createTradesTableSQL } from "./trades"
import { createTransfersTableSQL } from "./transfers"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config({ path: '../../.env' })

export const dbParams = {
    "host": process.env.DB_HOST,
    "password": process.env.DB_PASSWORD,
    "port": Number(process.env.DB_PORT),
    "database": process.env.DB_NAME,
    "user": process.env.DB_USER
  }

const setupTables = async(): Promise<void> => {
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

setupTables();