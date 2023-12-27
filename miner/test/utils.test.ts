import dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import { expect } from 'chai';
import { c, initializeMiningConfig } from '../src/mc';
import { MiningConfig } from '../src/types';
import { initializeBlockchain, arbius } from '../src/blockchain';
import { generateCommitment } from '../src/utils';


const mconf = {
  "log_path": null,
  "db_path": ":memory:",
  "stake_buffer_percent": 20,
  "evilmode": false,

  "blockchain": {
    "private_key": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
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


describe('Commitment', function() {
  this.timeout(10000); 
  initializeMiningConfig(mconf as MiningConfig);

  beforeEach(async () => {
    await initializeBlockchain();
  });

  it('generate commitment', async () => {
    const address = '0x1A320E53A25f518B893F286f3600cc204c181a8E';
    const taskid  = '0xdc6a147f2cd937a1b290b0dc4eff49a084ad72468fcb36df6d8ddb00c5ff6f7b';
    const cid     = '0x122002e2550d45270ed9c0df80be9a331940d391bcb138e0edfce4d2ff20168d6691';
    
    const commitment_a = await arbius.generateCommitment(address, taskid, cid);
    const commitment_b = generateCommitment(address, taskid, cid);

    expect(commitment_a).to.equal(commitment_b);
  });
});

