import { ethers, Contract, Wallet, BigNumber } from 'ethers';

import { c } from './mc';
import Config from './config.json';
import { expretry } from './utils';

import EngineArtifact from './artifacts/contracts/V2_EngineV2.sol/V2_EngineV2.json';
import BaseTokenArtifact from './artifacts/contracts/BaseTokenV1.sol/BaseTokenV1.json';
// import DelegatedValidator from './artifacts/contracts/DelegatedValidatorV1.sol/DelegatedValidatorV1.json';
import ArbSysArtifact from './artifacts/@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol/ArbSys.json';

const ARBSYS_ADDR = '0x0000000000000000000000000000000000000064';

let wallet:   Wallet;
let arbius:   Contract;
let token:    Contract;
let solver:   Contract; // this could be be either arbius or delegated validator
let arbsys:   Contract;
let chainId: number;

export async function initializeBlockchain() {
  const provider = new ethers.providers.JsonRpcProvider(c.blockchain.rpc_url!);
  wallet = new Wallet(c.blockchain.private_key, provider);

  arbius   = new Contract(Config.v2_engineAddress,    EngineArtifact.abi,    wallet);
  token    = new Contract(Config.v2_baseTokenAddress, BaseTokenArtifact.abi, wallet);
  arbsys   = new Contract(ARBSYS_ADDR,             ArbSysArtifact.abi,    wallet);

  let attemptToGetChainId = await expretry(async () => (await wallet.provider.getNetwork()).chainId);
  if (! attemptToGetChainId) {
    throw new Error('Could not get chainId');
  }
  chainId = attemptToGetChainId;

  if (! c.blockchain.use_delegated_validator) {
    solver = new Contract(Config.v2_engineAddress,    EngineArtifact.abi,    wallet);
  } else {
    // solver = new Contract(c.blockchain.delegated_validator_address, DelegatedValidator.abi, wallet);
  }
}

// arb.blockNumber is only available on Arbitrum chains
export async function getBlockNumber() {
  switch (chainId) {
    case 0xa4ba:
    case 0x66eed:
    case 0x66eee:
      return await expretry(async () => await arbsys.arbBlockNumber());
    default:
      return await expretry(async () => await wallet.provider.getBlockNumber());
  }
}

export {
  wallet,
  arbius,
  token,
  solver,
  chainId,
}
