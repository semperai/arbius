/*
import dotenv from "dotenv"
dotenv.config();

import axios from 'axios';
import {
  sleep,
} from './utils';

if (typeof process.env.REPLICATE_API_TOKEN === 'undefined' ||
    typeof process.env.PINATA_JWT === 'undefined'
) {
  console.error('Ensure REPLICATE_API_TOKEN and PINATA_JWT are set in .env');
  process.exit(1);
}

async function getOldPinnedFiles() {
  const HOURS = 2;
  const pinStart = (new Date('05 October 2011 14:48 UTC')).toISOString();
  const pinEnd = (new Date((+(new Date()))-(1000*60*60*HOURS))).toISOString();

  const res = await axios({
    method: 'get',
    url: `https://api.pinata.cloud/data/pinList?status=pinned&pinStart=${pinStart}&pinEnd=${pinEnd}`,
    headers: { 
      'Authorization': `Bearer ${process.env.PINATA_JWT}`
    },
  });
  
  return res.data;
}

async function unpinFile(cid: string) {
  const res = await axios({
    method: 'delete',
    url: `https://api.pinata.cloud/pinning/unpin/${cid}`,
    headers: {
      'Authorization': `Bearer ${process.env.PINATA_JWT}`
    }
  });
  console.log(res.data);
}


async function main() {
  while (true) {
    try {
      const old = await getOldPinnedFiles();
      if (old.count === 0) {
        console.log('no old files found, sleeping for a minute');
        await sleep(60_000);
        continue;
      }
  
      console.log(`found ${old.count} old pinned files`);
    
      for (let row of old.rows) {
        const cid = row.ipfs_pin_hash;
        console.log(`unpinning cid ${cid}`);
        await unpinFile(cid);
      }
    } catch (e) {
      console.error(JSON.stringify(e));
    }
  }
}

main();
*/
