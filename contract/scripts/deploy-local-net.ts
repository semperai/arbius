import { ethers, upgrades } from "hardhat";
import { getL2Network } from '@arbitrum/sdk';
import { EngineV1 } from '../typechain/EngineV1';
import { V2EngineV2 as EngineV2 } from '../typechain/V2EngineV2';
import * as fs from 'fs'
import Config from './config.json';
import 'dotenv/config';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  // TODO read these from nova
  // const mirrorEngine = await ethers.getContractAt('V2EngineV2', Config.v2_engineAddress);
  // const mirrorL2Token = await ethers.getContractAt('BaseTokenV1', Config.v2_l1TokenAddress);
  // const mirrorEngineBalance = await mirrorL2Token.balanceOf(mirrorEngine.address);
  const mirrorEngineBalance = ethers.utils.parseEther('578000');
  // const solutionStakeAmount = await mirrorEngine.solutionsStakeAmount();
  const solutionStakeAmount = ethers.utils.parseEther('0.001');
  // const startTime = await mirrorEngine.startBlockTime();
  const startTime = 1708311640;

  console.log('Deploying the L2Token to L2:');
  const L2Token = await ethers.getContractFactory('BaseTokenV1');
  const l2Token = await upgrades.deployProxy(L2Token, [
    deployer.address,
    deployer.address,
  ]);

  await l2Token.deployed();
  console.log(`L2Token is deployed to L2 at ${l2Token.address}`);


  const EngineV1 = await ethers.getContractFactory("EngineV1");
  const EngineV2 = await ethers.getContractFactory("V2_EngineV2");

  let engine = await upgrades.deployProxy(EngineV1, [
    l2Token.address,
    deployer.address, // deployer as treasury
  ]);
  await engine.deployed();
  console.log("Engine deployed to:", engine.address);

  engine = await upgrades.upgradeProxy(engine.address, EngineV2);
  console.log("Engine upgraded");

  await (await engine
    .connect(deployer)
    .setSolutionStakeAmount(solutionStakeAmount)
  ).wait();
  console.log(`Solution stake amount set to ${solutionStakeAmount}`);

  await (await engine
    .connect(deployer)
    .setStartBlockTime(startTime)
  ).wait();
  console.log(`Start block time set to ${new Date((startTime) * 1000).toString()}`);

  await (await l2Token
    .connect(deployer)
    .bridgeMint(engine.address, mirrorEngineBalance)
  ).wait();
  console.log(`Minted to mirror engine: ${mirrorEngineBalance}`);
  
  for (const signer of signers) {
    await (await l2Token
      .connect(deployer)
      .bridgeMint(signer.address, ethers.utils.parseEther('1000'))
    ).wait();
    console.log(`Minted to ${signer.address}: 1000 tokens`);
  }


  console.log('Deploying free mineable model: kandinsky2');
  const {
    modelId: kandinsky2ModelId,
    params: kandinsky2Params,
  } = await deployFreeMineableModel(engine as EngineV1, '0x'+fs.readFileSync(`${__dirname}/../../templates/kandinsky2.json`, 'hex'), '1');


  // SAVE CONFIG
  const configPath = __dirname + '/config.local.json';
  fs.writeFileSync(configPath, JSON.stringify({
    v2_baseTokenAddress: l2Token.address,
    v2_engineAddress: engine.address,
    models: {
      kandinsky2: {
        id: kandinsky2ModelId,
        mineable: true,
        contracts: {
        },
        params: {
          addr: kandinsky2Params.addr,
          fee: kandinsky2Params.fee.toString(),
          rate: kandinsky2Params.rate.toString(),
          cid: kandinsky2Params.cid,
        },
      },
    },
  }, null, 2));
  console.log('Saved config to', configPath);
  process.exit(0)
}

// simple free model, no fees
async function deployFreeMineableModel(
  engine: EngineV1,
  template: string,
  rateStr: string, // 1 = 1x, 2=2x reward rate
) {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  const addr = '0x0000000000000000000000000000000000000001';
  const fee = ethers.utils.parseEther('0');

  const rate = ethers.utils.parseEther(rateStr);

  const cid = await engine.generateIPFSCID(template);
  console.log('model cid is', cid);

  const modelId = await engine.hashModel({
    addr,
    fee,
    rate,
    cid,
  }, await deployer.getAddress());

  await (await engine
    .connect(deployer)
    .registerModel(addr, fee, template)
  ).wait();
  console.log('model added with id', modelId);


  await (await engine
    .connect(deployer)
    .setSolutionMineableRate(modelId, rate)
  ).wait();
  console.log('model is now mineable');

  return {
    modelId,
    params: {
      addr,
      fee,
      rate,
      cid,
    },
  };
}

main();
