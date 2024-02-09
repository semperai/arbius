import { ethers, upgrades } from "hardhat";
import { EngineV1 as Engine } from '../typechain/EngineV1';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Timelock = await ethers.getContractFactory(
    "TimelockV1"
  );
  const timelock = await Timelock.deploy(
    // mindelay should be updated after proposer is added / during setup
    0,
    // governor added during deploy
    // deployer renounces after setup
    [ await deployer.getAddress() ],
    // only executor should be zero address (to allow anyone to execute)
    [ ethers.constants.AddressZero ],
    // admin should be deployer and revoked after setup
    await deployer.getAddress(),
  );
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);

  const Engine = await ethers.getContractFactory(
    "EngineV1"
  );
  const engine = await upgrades.deployProxy(Engine, [
    Config.baseTokenAddress,
    timelock.address, // timelock as treasury
  ]);
  await engine.deployed();
  console.log("Engine deployed to:", engine.address);

  const Governor = await ethers.getContractFactory(
    "GovernorV1"
  );
  const governor = await Governor.deploy(
    Config.baseTokenAddress,
    timelock.address,
  );
  console.log("Governor deployed to:", governor.address);

  await (await timelock.grantRole(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")),
    governor.address
  )).wait();
  console.log('Timelock: Governor granted PROPOSER_ROLE');

  console.log('Deploying free mineable model: kandinsky2');
  const {
    modelId: kandinsky2ModelId,
    params: kandinsky2Params,
  } = await deployFreeMineableModel(engine, '0x'+fs.readFileSync(`${__dirname}/../../templates/kandinsky2.json`, 'hex'), '1');



  await (await timelock.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")), governor.address)).wait();
  console.log('Timelock: Governor granted PROPOSER_ROLE');

  // TODO change me for prod, this for testing
  // const timelockMinDelay = 60*60*24*3;
  const timelockMinDelay = 240;
  await (await timelock.schedule(
    timelock.address,
    0, // value
    Timelock.interface.encodeFunctionData('updateDelay', [
      timelockMinDelay,
    ]),
    ethers.constants.HashZero, // predecessor
    ethers.constants.HashZero, // salt
    0, // delay
  )).wait()
  await (await timelock.execute(
    timelock.address,
    0, // value
    Timelock.interface.encodeFunctionData('updateDelay', [
      timelockMinDelay,
    ]),
    ethers.constants.HashZero, // predecessor
    ethers.constants.HashZero, // salt
  )).wait()
  console.log('Timelock: Minimum delay updated');

  await (await timelock.renounceRole(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")),
    await deployer.getAddress(),
  )).wait();
  console.log('Timelock: deployer renounced PROPOSER_ROLE');

  await (await timelock.renounceRole(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")),
    await deployer.getAddress(),
  )).wait();
  console.log('Timelock: deployer renounced TIMELOCK_ADMIN_ROLE');


  // we deployed BaseToken earlier, but we need to transfer ownership here
  // This will allow timelock to set BaseToken params in future
  const BaseToken = await ethers.getContractFactory("BaseTokenV1");
  const baseToken = BaseToken.attach(Config.baseTokenAddress);
  // await (await baseToken.connect(deployer).transferOwnership(timelock.address)).wait();
  // console.log('Transferred BaseToken to Timelock');

  // Transfer engine to timelock so it may control setting params
  await (await engine.transferOwnership(timelock.address)).wait();
  console.log('Transferred Engine to Timelock');

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(baseToken.address);

  // SAVE CONFIG
  const configPath = __dirname + '/config.json';
  fs.writeFileSync(configPath, JSON.stringify({
    l1TokenAddress: Config.l1TokenAddress,
    baseTokenAddress: Config.baseTokenAddress,
    engineAddress: engine.address,
    governorAddress: governor.address,
    timelockAddress: timelock.address,
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
