import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import { Logger } from "tslog";
import { Wallet, ethers } from 'ethers';
import { base58 } from '@scure/base';
import { createVerifiedFetch } from '@helia/verified-fetch'
import express from 'express';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const signer = new Wallet(process.env.PRIVATE_KEY, provider);
const port = process.env.PORT || 3000;
const timeout = process.env.TIMEOUT || 5000;

let log;

function initializeLogger(log_path, minLevel = 0) {
  log = new Logger({
    minLevel,
  });

  if (log_path != null) {
    log.attachTransport((lobj) => {
      let p = '[fileNameWithLine undefined]';
      if (lobj._meta.path && lobj._meta.path.fileNameWithLine) {
        p = lobj._meta.path.fileNameWithLine;
      }

      let m = []
      for (let i=0; i<10; ++i) {
        if (lobj.hasOwnProperty(i.toString())) {
          m.push(lobj[i]);
        }
      }

      const l = `${lobj._meta.date.getTime()} ${lobj._meta.logLevelName} ${p} ${m.join('\t')}\n`;
      fs.appendFileSync(log_path, l);
    });
  }
}

function cidify(cid) {
  if (! cid) {
    return '';
  }
  return base58.encode(ethers.utils.arrayify(cid));
}


const app = express();
app.use(express.json());

async function main() {
  await initializeLogger('log.txt', 0);
  log.info(`ipfs-oracle is starting with address ${signer.address}`);

  app.listen(port, () => {
    log.info(`ipfs-oracle listening at http://localhost:${port}`);
  });
}

app.post('/sign', async (req, res) => {
  const body = req.body;

  let cid = body.cid;
  if (! cid) {
    res.status(400).send('Missing CID');
    return;
  }

  const fetch = await createVerifiedFetch();

  try {
    const response = await fetch(`ipfs://${cid}/out-1.txt`, {
      signal: AbortSignal.timeout(timeout),
    });
    const data = await response.text();

    const cidBytes = base58.decode(cid);
    const hash = ethers.utils.keccak256(cidBytes);
    const digest = ethers.utils.arrayify(hash);
    const skey = new ethers.utils.SigningKey(signer.privateKey);
    const components = skey.signDigest(digest);
    const signature = ethers.utils.joinSignature(components);

    res.status(200).send({
      signer: signer.address,
      signature,
      hash,
    });
  } catch (e) {
    console.error(e);
    res.status(400).send('Unable to fetch');
    return;
  }
});


main();
