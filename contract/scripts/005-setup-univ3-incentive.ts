import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import IUniswapV3StakerArtifact from './../artifacts/contracts/interfaces/IUniswapV3Staker.sol/IUniswapV3Staker.json';
import { IUniswapV3Staker  }from './../typechain/IUniswapV3Staker';
import * as fs from 'fs'
import Config from './config.json';

// Make a pool with ETH/AIUS 0.3% fee
const pool = '0xDFDCBD49676670bFC6e13bB2b2c204e8Ccc8F26d';

// https://github.com/Uniswap/v3-staker#deployments
const univ3StakerAddress = '0xe34139463bA50bD61336E0c446Bd8C0867c6fE65';

async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const L1Token = await ethers.getContractFactory("L1Token");
  const l1Token = L1Token.attach(Config.l1TokenAddress);

  console.log('Increasing L1Token allowance ')
  await (await l1Token.approve(univ3StakerAddress, ethers.constants.MaxUint256)).wait();
  console.log('L1Token allowance increased')

  const rewardToken = Config.l1TokenAddress;
  const startTime = BigNumber.from(Math.floor((+new Date() / 1000)) + 1000);
  const endTime = startTime.add(60 * 60 * 24 * 365);
  const refundee = await deployer.getAddress();
  const reward = ethers.utils.parseEther('25000');

  const staker: IUniswapV3Staker = new ethers.Contract(univ3StakerAddress, IUniswapV3StakerArtifact.abi, deployer) as IUniswapV3Staker;

  console.log('Creating incentive tx', {
      rewardToken,
      pool,
      startTime,
      endTime,
      refundee,
    },
    reward,
  );
  const createIncentiveTx = await staker.createIncentive(
    {
      rewardToken,
      pool,
      startTime,
      endTime,
      refundee,
    },
    reward,
  );
  console.log('Create Incentive Tx', createIncentiveTx.hash);
  await createIncentiveTx.wait();
  console.log('Incentive created');

  process.exit(0);
}

main();
