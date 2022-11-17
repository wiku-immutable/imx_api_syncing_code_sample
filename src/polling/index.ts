import { setupTables } from '../database/setup';
import { exit } from 'process';
import moment from 'moment';
import { historicalAssetSync, nearRealTimeAssetSync } from './assets';
import { historicalOrderSync, nearRealTimeOrderSync } from './orders';
import { historicalMintSync, nearRealTimeMintSync } from './mints';
import { historicalTransferSync, nearRealTimeTransferSync } from './transfers';
import { historicalTradeSync, nearRealTimeTradeSync } from './trades';

const args = process.argv.slice(2)

const main = async()=>{

  if (args.length < 1 || args.length > 3) {
    console.log("Incorrect number of arguments. 2 arguments max. Should be '{endpoint}' or '{endpoint} {path}'");
    exit(1);
  }

  // check timestamps are valid
  try {
    if (args.length == 3) {
      if (!moment(args[1]).isValid() || !moment(args[2]).isValid()) {
        throw "Invalid datetime timestamp. Example format is yyyy-MM-ddThh:mm:ssZ"
      }
    } 
    
    if (args.length == 2) {
      if (!moment(args[1]).isValid()) {
        throw "Invalid datetime timestamp. Example format is yyyy-MM-ddThh:mm:ssZ"
      }
    }

  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  switch (args[0]) {
    case 'assets':
      if (args.length == 3) {
        await historicalAssetSync(moment(args[1]).toISOString(), moment(args[2]).toISOString());
      } else if (args.length == 2) {
        await nearRealTimeAssetSync(moment(args[1]).toISOString());
      } else {
        await nearRealTimeAssetSync();
      }
      break;
    case 'orders':
      if (args.length == 3) {
        await historicalOrderSync(moment(args[1]).toISOString(), moment(args[2]).toISOString());
      } else if (args.length == 2) {
        await nearRealTimeOrderSync(moment(args[1]).toISOString());
      } else {
        await nearRealTimeOrderSync();
      }
      break;
    case 'mints':
      if (args.length == 3) {
        await historicalMintSync(moment(args[1]).toISOString(), moment(args[2]).toISOString());
      } else if (args.length == 2) {
        await nearRealTimeMintSync(moment(args[1]).toISOString());
      } else {
        await nearRealTimeMintSync();
      }
      break;
    case 'transfers':
      if (args.length == 3) {
        await historicalTransferSync(moment(args[1]).toISOString(), moment(args[2]).toISOString());
      } else if (args.length == 2) {
        await nearRealTimeTransferSync(moment(args[1]).toISOString());
      } else {
        await nearRealTimeTransferSync();
      }
      break;
    case 'trades':
      if (args.length == 3) {
        await historicalTradeSync(moment(args[1]).toISOString(), moment(args[2]).toISOString());
      } else if (args.length == 2) {
        await nearRealTimeTradeSync(moment(args[1]).toISOString());
      } else {
        await nearRealTimeTradeSync();
      }
      break;
    default:
      console.log("Unrecognised endpoint. Expecting 'assets', 'orders', 'mints', 'trades' or 'transfers'");
  }
}

main()
.then(()=>process.exit(0))
.catch((e)=>{
    console.log(e)
    process.exit(1)
})