import { ethers, Contract, Wallet, BigNumber } from 'ethers';

import { c } from './mc';
import Config from './config.json';
import { expretry } from './utils';

import EngineArtifact from './artifacts/contracts/EngineV1.sol/EngineV1.json';
import BaseTokenArtifact from './artifacts/contracts/BaseTokenV1.sol/BaseTokenV1.json';
// import GovernorArtifact from './artifacts/contracts/GovernorV1.sol/GovernorV1.json';
// import DelegatedValidator from './artifacts/contracts/DelegatedValidatorV1.sol/DelegatedValidatorV1.json';
import ArbSysArtifact from './artifacts/@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol/ArbSys.json';

const ARBSYS_ADDR = '0x0000000000000000000000000000000000000064';

let wallet:   Wallet;
let arbius:   Contract;
let token:    Contract;
// let governor: Contract;
let solver:   Contract; // this could be be either arbius or delegated validator
let arbsys:   Contract;

export async function initializeBlockchain() {
  const provider = new ethers.providers.JsonRpcProvider(c.blockchain.rpc_url!);
  wallet = new Wallet(c.blockchain.private_key, provider);

  arbius   = new Contract(Config.engineAddress,    EngineArtifact.abi,    wallet);
  token    = new Contract(Config.baseTokenAddress, BaseTokenArtifact.abi, wallet);
  // governor = new Contract(Config.governorAddress,  GovernorArtifact.abi,  wallet);
  arbsys   = new Contract(ARBSYS_ADDR,             ArbSysArtifact.abi,    wallet);

  if (! c.blockchain.use_delegated_validator) {
    solver = new Contract(Config.engineAddress,    EngineArtifact.abi,    wallet);
  } else {
    // solver = new Contract(c.blockchain.delegated_validator_address, DelegatedValidator.abi, wallet);
  }
}

// TODO check if we are on nova network, if so use this, otherwise block.number
export async function getBlockNumber() {
  const abn = await expretry(async () => await arbsys.arbBlockNumber());
  return abn;
}

export async function getValidatorStaked(): Promise<BigNumber> {
  const staked = await expretry(async () => {
    /*
    if (c.blockchain.use_delegated_validator) {
      const s = (await arbius.validators(c.blockchain.delegated_validator_address)).staked;
      return s;
    }
    */

    const s = (await arbius.validators(wallet.address)).staked;
    return s;
  });
  return staked;
}

// TODO for delegated mode use deposit method
export async function depositForValidator(depositAmount: BigNumber) {
  // if (c.blockchain.strategy === 'delegated') {
  //   const tx = await solver.deposit(depositAmount);
  // }
  const tx = await solver.validatorDeposit(wallet.address, depositAmount);
  const receipt = await tx.wait();
  return receipt;
}

export {
  wallet,
  arbius,
  token,
  // governor,
  solver,
}
