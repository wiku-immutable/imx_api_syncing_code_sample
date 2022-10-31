# API Syncing Code Sample

Building on ImmutableX and using our global orderbook to its full extent requires you to be in sync with our APIs.

Currently, polling our API endpoints in short/frequent intervals in the only way to keep in sync with our most recent data. These code samples aim to be simple and easy-to-deploy to get you polling our APIs as quickly as possible!

## Assumed stack

We have assumed the AWS stack for simplicity however, please feel free to use any stack you wish.

| Component | Name |
| -- | -- |
| `Language` | Typescript |
| `Database` | Aws Aurora Serverless v2 (PostgreSQL) |

## Installation

`npm install`

Add your database credentials in `src/database/setup.ts` to connect to your AWS Aurora PostgreSQL database

Remember to change the constants in `src/constants.ts` to suit your desired polling frequency

*** 
## Overview

These code samples illustrate 3 methods of ingesting our endpoint data. They assume a PostgreSQL database has already been created and is ready to be connected to.

### 1. Historical data dump ingestion
If you would like to store a local version of **all** ImmutableX data, it's best to ingest this via data dumps of flat files as even with an API key, this would take weeks. Code samples in `src/data_dump` illustrate how to ingest these data dumps easily. You can do this with the command:

`ts-node src/data_dump/index.ts assets {assets_file_name}`

Note: to get access to the complete set of data dumps, please contact our Support team

### 2. Backlog or historical sync
If you would like to poll over a specific interval and for a specific endpoint, e.g. polling our `/assets` endpoint from Jan 2022 to Feb 2022, you can do this with the command:

`ts-node src/polling/index.ts assets 2022-01-01T00:00:00 2022-02-01T00:00:00`

### 3. Near real-time sync
If you would like to poll most recent data of an endpoint onwards from a specific time or from present time, you can do this with the command:

**[From Jan 2022 to present]:** `ts-node src/polling/index.ts assets 2022-01-01T00:00:00`

**[Present time onwards]:** `ts-node src/polling/index.ts assets`

Note: if you select a specific time to start polling from and the process unexpectedly stops, re-running it with the same timestamp will make the program resume from where it stopped.

***

## Getting help

Immutable X is open to all to build on, with no approvals required. If you want to talk to us to learn more, or apply for developer grants, click below:

[Contact us](https://www.immutable.com/contact)

### Project support

To get help from other developers, discuss ideas, and stay up-to-date on what's happening, become a part of our community on Discord.

[Join us on Discord](https://discord.gg/TkVumkJ9D6)

You can also join the conversation, connect with other projects, and ask questions in our Immutable X Discourse forum.

[Visit the forum](https://forum.immutable.com/)

#### Still need help?

You can also apply for marketing support for your project. Or, if you need help with an issue related to what you're building with Immutable X, click below to submit an issue. Select _I have a question_ or _issue related to building on Immutable X_ as your issue type.

[Contact support](https://support.immutable.com/hc/en-us/requests/new)
