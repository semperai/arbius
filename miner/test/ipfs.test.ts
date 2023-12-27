import dotenv from 'dotenv';
dotenv.config();
import { expect } from 'chai';
import * as fs from 'fs';
import { base58 } from '@scure/base';
import { pinFileToIPFS, pinFilesToIPFS } from '../src/ipfs';
import { c, initializeMiningConfig } from '../src/mc';
import { MiningConfig } from '../src/types';


const mconf = {
  "log_path": null,
  "db_path": ":memory:",
  "stake_buffer_percent": 20,
  "evilmode": false,

  "blockchain": {
    "private_key": "",
    "rpc_url": "https://nova.arbitrum.io/rpc"
  },

  "automine": {
    "enabled": false,
    "delay": 60,
    "version": 0,
    "model": "0x7cb00aefb0992612b38464630c161fa7f36d727f0a52bcf926e7d8a361af86c7",
    "fee": "0",
    "input": {
      "prompt": ""
    }
  },
  "ml": {
    "strategy": "replicate",
    "replicate": {
      "api_token": process.env.TEST_REPLICATE_API_TOKEN!,
    },
    "cog": {
    }
  },
  "ipfs": {
    "strategy": "pinata",
    "pinata": {
      "jwt": process.env.TEST_PINATA_JWT!,
    },
    "http_client": {
      "url": "http:/127.0.0.1:5001",
    },
  }
};


describe('IPFS', function() {
  this.timeout(10000); 

  it('pin files by content (pinata)', async () => {
    mconf.ipfs.strategy = 'pinata';
    initializeMiningConfig(mconf as MiningConfig);

    const paths = [
      `out-1.png`,
      `ipfs_a.bin`,
      `ipfs_b.bin`,
      `ipfs_c.bin`,
      `ipfs_d.bin`,
    ];

    const cid = await pinFilesToIPFS(c, 'taskidtest', paths);
    console.log(cid);
  });

  it('pin files by content (http_client)', async () => {
    mconf.ipfs.strategy = 'http_client';
    initializeMiningConfig(mconf as MiningConfig);

    const paths = [
      `out-1.png`,
      `ipfs_a.bin`,
      `ipfs_b.bin`,
      `ipfs_c.bin`,
      `ipfs_d.bin`,
    ];

    const cid = await pinFilesToIPFS(c, 'taskidtest', paths);
    console.log(cid);
  });

  it('pin file by content (pinata)', async () => {
    mconf.ipfs.strategy = 'pinata';
    initializeMiningConfig(mconf as MiningConfig);

    const fa = fs.readFileSync(`${__dirname}/ipfs_a.bin`);
    const fb = fs.readFileSync(`${__dirname}/ipfs_b.bin`);
    const fc = fs.readFileSync(`${__dirname}/ipfs_c.bin`);
    const fd = fs.readFileSync(`${__dirname}/ipfs_d.bin`);

    const ca = await pinFileToIPFS(c, fa, "a");
    const cb = await pinFileToIPFS(c, fb, "b");
    const cc = await pinFileToIPFS(c, fc, "c");
    const cd = await pinFileToIPFS(c, fd, "d");

    const ha = '0x'+Buffer.from(base58.decode(ca)).toString('hex')
    const hb = '0x'+Buffer.from(base58.decode(cb)).toString('hex')
    const hc = '0x'+Buffer.from(base58.decode(cc)).toString('hex')
    const hd = '0x'+Buffer.from(base58.decode(cd)).toString('hex')

    expect(ha).to.equal("0x1220e844b8764c00d4a76ac03930a3d8f32f3df59aea3ed0ade4c3bc38a3b23a31d9");
    expect(hb).to.equal("0x1220f782bf27d7dfa16c5556ae0e19d41a73fc380a28455abcedecd70460505f022b");
    expect(hc).to.equal("0x1220c32cae42b7d6ed6efd2512fd7dac6530cbd96cbcc19a3d1c336ace8e401f1c3a");
    expect(hd).to.equal("0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8");
  });

  it('pin file by content (http_client)', async () => {
    mconf.ipfs.strategy = 'http_client';
    initializeMiningConfig(mconf as MiningConfig);

    const fa = fs.readFileSync(`${__dirname}/ipfs_a.bin`);
    const fb = fs.readFileSync(`${__dirname}/ipfs_b.bin`);
    const fc = fs.readFileSync(`${__dirname}/ipfs_c.bin`);
    const fd = fs.readFileSync(`${__dirname}/ipfs_d.bin`);

    const ca = await pinFileToIPFS(c, fa, "a");
    const cb = await pinFileToIPFS(c, fb, "b");
    const cc = await pinFileToIPFS(c, fc, "c");
    const cd = await pinFileToIPFS(c, fd, "d");

    const ha = '0x'+Buffer.from(base58.decode(ca)).toString('hex')
    const hb = '0x'+Buffer.from(base58.decode(cb)).toString('hex')
    const hc = '0x'+Buffer.from(base58.decode(cc)).toString('hex')
    const hd = '0x'+Buffer.from(base58.decode(cd)).toString('hex')

    expect(ha).to.equal("0x1220e844b8764c00d4a76ac03930a3d8f32f3df59aea3ed0ade4c3bc38a3b23a31d9");
    expect(hb).to.equal("0x1220f782bf27d7dfa16c5556ae0e19d41a73fc380a28455abcedecd70460505f022b");
    expect(hc).to.equal("0x1220c32cae42b7d6ed6efd2512fd7dac6530cbd96cbcc19a3d1c336ace8e401f1c3a");
    expect(hd).to.equal("0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8");
  });
});
