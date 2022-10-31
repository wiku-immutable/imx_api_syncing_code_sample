import { exit } from 'process';
import { ingestAssetDump } from './assets';

let assetsPath = './sample_data/assets-snapshot-2021-01-01-sample.tsv'

const args = process.argv.slice(2)

const main = async()=>{
    
    if (args.length < 1 || args.length > 2) {
        console.log("Incorrect number of arguments. 2 arguments max. Should be '{endpoint}' or '{endpoint} {path}'");
        exit(1);
    }
    switch (args[0]) {
        case 'assets':
            if (args.length == 2) {
                assetsPath = args[1];
            }
            await ingestAssetDump(assetsPath);
            break;
        case 'orders':
            // REPEAT AS ABOVE
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