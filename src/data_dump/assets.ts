import { dbParams } from '../database/setup';
import { Client } from 'pg';
import { parse, Parser } from 'csv-parse';
import { ASSETS_HEADERS, createAssetsTableSQL, upsertAssetsTableSQL } from '../database/assets';
import path from 'path';
import fs from 'fs';
import { assetDataStructure } from "../database/types"
import { ready } from '../utils';

export const ingestAssetDump = async(assetPath: string)=>{
    const client = new Client (dbParams);
    await client.connect()
    await client.query(createAssetsTableSQL);

    const filePath = path.resolve(assetPath)
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

    const parser = parse(fileContent, {
        delimiter: '\t',
        columns: ASSETS_HEADERS,
        from_line: 2
    })

    await ready(parser)

    let row: (assetDataStructure | null)
    while ((row = parser.read()) !== null) {
        const [statement, params] = upsertAssetsTableSQL(row)
        //console.log(row)
        try{
            // console.log({statement, params})
            const res = await client.query(statement, params);
            console.log(`Inserted ${row.token_id} - ${res.rows} affected`) // should show us whats been updated
        }catch (err) {
            console.error(`Error inserting entry ${err}`);
        } finally {
            await client.end()
        }
    }
}