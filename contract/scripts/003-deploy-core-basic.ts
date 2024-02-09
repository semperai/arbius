import { ethers, upgrades } from "hardhat";
import { EngineV1 as Engine } from '../typechain/EngineV1';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log('BaseToken address', Config.baseTokenAddress);
  console.log('Treasury address', deployer.address);

  const Engine = await ethers.getContractFactory(
    "EngineV1"
  );
  const engine = await upgrades.deployProxy(Engine, [
    Config.baseTokenAddress,
    deployer.address, // deployer as treasury
  ]);
  await engine.deployed();
  console.log("Engine deployed to:", engine.address);

  console.log('Deploying free mineable model: kandinsky2');
  const {
    modelId: kandinsky2ModelId,
    params: kandinsky2Params,
  } = await deployFreeMineableModel(engine as Engine, '0x'+fs.readFileSync(`${__dirname}/../../templates/kandinsky2.json`, 'hex'), '1');


  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(Config.baseTokenAddress);

  // SAVE CONFIG
  const configPath = __dirname + '/config.json';
  fs.writeFileSync(configPath, JSON.stringify({
    l1TokenAddress: Config.l1TokenAddress,
    baseTokenAddress: Config.baseTokenAddress,
    engineAddress: engine.address,
    // governorAddress: governor.address,
    // timelockAddress: timelock.address,
    proxyAdminAddress,
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
  engine: Engine,
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
