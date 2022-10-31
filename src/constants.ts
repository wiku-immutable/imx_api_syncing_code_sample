import { Config } from "@imtbl/core-sdk";

// ImmutableX network (mainnet or goerli)
export const CONFIG = Config.PRODUCTION; // change to Config.SANDBOX for goerli

export const endpoints = ["assets", "orders", "mints", "transfers", "trades"]
export const pollingTypes = ["real-time", "historical"]

// note: need to clean up how these timestamps are dealt with
export const TIME_INTERVAL_NUMBER = 20;
export const TIME_INTERVAL_UNIT = 'second';

export const MAX_PAGE_SIZE = 200;
