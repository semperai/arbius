import * as fs from 'fs';
import ProxyAdminArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from "hardhat/config";
import Config from '../scripts/config.one.json';
import LocalConfig from '../scripts/config.local.json';

async function getMinerAddress(hre: HardhatRuntimeEnvironment) {
  const accounts = await hre.ethers.getSigners();
  return accounts[0].address;
}

async function getEngine(hre: HardhatRuntimeEnvironment) {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV4");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }
    
  if (hre.network.name === 'localhost') {
    const engine = await Engine.attach(LocalConfig.v4_engineAddress);
    return engine;
  }

  if (hre.network.name === 'arbitrum') {
    const engine = await Engine.attach(Config.v4_engineAddress);
    return engine;
  }

  console.log('Unknown network');
  process.exit(1);
}
async function getBaseToken(hre: HardhatRuntimeEnvironment) {
  const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    const baseToken = await BaseToken.attach(LocalConfig.v4_baseTokenAddress);
    return baseToken;
  }

  if (hre.network.name === 'arbitrum') {
    const baseToken = await BaseToken.attach(Config.v4_baseTokenAddress);
    return baseToken;
  }

  console.log('Unknown network');
  process.exit(1);
}

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("info", "Gets all info about contract")
.setAction(async ({}, hre) => {
  const engine = await getEngine(hre);

  console.log("baseToken", await engine.baseToken());
  console.log("treasury", await engine.treasury());
  console.log("pauser", await engine.pauser());
  console.log("paused", await engine.paused());
  console.log("accruedFees", await engine.accruedFees());
  console.log("prevhash", await engine.prevhash());
  console.log("startBlockTime", await engine.startBlockTime());
  console.log("version", await engine.version());
  console.log("validatorMinimumPercentage", await engine.validatorMinimumPercentage());
  console.log("slashAmountPercentage", await engine.slashAmountPercentage());
  console.log("solutionFeePercentage", await engine.solutionFeePercentage());
  console.log("retractionFeePercentage", await engine.retractionFeePercentage());
  console.log("treasuryRewardPercentage", await engine.treasuryRewardPercentage());
  console.log("minClaimSolutionTime", await engine.minClaimSolutionTime());
  console.log("minRetractionWaitTime", await engine.minRetractionWaitTime());
  console.log("minContestationVotePeriodTime", await engine.minContestationVotePeriodTime());
  console.log("maxContestationValidatorStakeSince", await engine.maxContestationValidatorStakeSince());
  console.log("exitValidatorMinUnlockTime", await engine.exitValidatorMinUnlockTime());
  console.log("solutionsStakeAmount", await engine.solutionsStakeAmount());
  console.log("totalHeld", await engine.totalHeld());
  console.log("solutionRateLimit", await engine.solutionRateLimit());

  console.log("taskOwnerRewardPercentage", await engine.taskOwnerRewardPercentage());
  console.log("contestationVoteExtensionTime", await engine.contestationVoteExtensionTime());

  console.log("veStaking", await engine.veStaking());
  console.log("veRewards", await engine.veRewards());
});


task("bulk:submit", "Helper to submit multiple tasks at once")
.addOptionalParam("v", "Version of task", "0")
.addParam("owner", "Owner of task")
.addParam("model", "Model id")
.addOptionalParam("fee", "Fee", "0")
.addParam("input", "Input")
.addOptionalParam("n", "Number of tasks", "10")
.addOptionalParam("gas", "Gas limit per task", "250000")
.setAction(async ({
  v,
  owner,
  model,
  fee,
  input,
  n,
  gas,
}, hre) => {
  // TODO move this to config
  const bulkSubmitterAddress = '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc';

  const BulkSubmitTask = await hre.ethers.getContractFactory("BulkSubmitTask");
  const bulkSubmitTask = await BulkSubmitTask.attach(bulkSubmitterAddress);

  const tx = await bulkSubmitTask.submitTaskBulk(
    v,
    owner,
    model,
    fee,
    hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(input)),
    n,
    gas,
  );
  const receipt = await tx.wait();
  console.log(receipt);
});


task("decode-tx", "Extract input from a submitTask transaction")
.addParam("txid", "transaction hash")
.setAction(async ({ txid }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.v4_engineAddress);

  const tx = await hre.ethers.provider.getTransaction(txid);
  // console.log(tx);

  const parsed = engine.interface.parseTransaction(tx);
  // console.log(parsed);

  const input = Buffer.from(parsed.args.input_.substring(2), 'hex').toString();
  console.log(input);
});

task("local:mint", "Mint tokens")
.addParam("to", "address")
.addParam("amount", "amount")
.setAction(async ({ to, amount }, hre) => {
    const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
    const baseToken = await BaseToken.attach(LocalConfig.v4_baseTokenAddress);
    const tx = await baseToken.bridgeMint(to, hre.ethers.utils.parseEther(amount));
    await tx.wait();
    console.log(`minted ${amount} tokens to ${to}`);
});

task("test:mint", "Mint tokens")
.addParam("to", "address")
.addParam("amount", "amount")
.setAction(async ({ to, amount }, hre) => {
    const TestnetToken = await hre.ethers.getContractFactory("TestnetToken");
    const testnetToken = await TestnetToken.attach(Config.v4_baseTokenAddress);
    const tx = await testnetToken.mint(to, hre.ethers.utils.parseEther(amount));
    await tx.wait();
    console.log(`minted ${amount} tokens to ${to}`);
});

task("local:mine", "mine blocks locally")
.addParam("blocks", "how many")
.setAction(async ({ blocks }, hre) => {
  await hre.network.provider.send("hardhat_mine", [`0x${parseInt(blocks).toString(16)}`]);
});

task("local:timetravel", "go into the future")
.addParam("seconds", "how many")
.setAction(async ({ seconds }, hre) => {
  await hre.network.provider.send("evm_increaseTime", [`0x${parseInt(seconds).toString(16)}`]);
  await hre.network.provider.send("evm_mine");
});

task("local:gen-wallet", "Creates a new wallet", async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  console.log('address', wallet.address);
  console.log('mnemonic', wallet.mnemonic.phrase);
  console.log('privateKey', wallet.privateKey);
});

task("send-eth", "Send ether")
.addParam("address", "Receiver address")
.addParam("amount", "Eth")
.setAction(async ({ address, amount }, hre) => {
  const [account] = await hre.ethers.getSigners();
  await account.sendTransaction({
    to: address,
    value: hre.ethers.utils.parseEther(amount),
  });
});

task("mining:balance", "Get miners token balance")
.setAction(async ({ }, hre) => {
  const baseToken = await getBaseToken(hre);
  const minerAddress = await getMinerAddress(hre);
  const bal = await baseToken.balanceOf(minerAddress);
  console.log(`balance ${hre.ethers.utils.formatEther(bal)}`);
});

task("mining:transfer", "Transfer mining rewards to new address")
.addParam("address", "Receiver address")
.addParam("amount", "In token value")
.setAction(async ({ address, amount }, hre) => {
  const baseToken = await getBaseToken(hre);
  const tx = await baseToken.transfer(address, hre.ethers.utils.parseEther(amount));
  await tx.wait();
  console.log(`sent ${amount} tokens to ${address}`);
});

task("mining:allowance", "Set allowance for miner")
.setAction(async ({ }, hre) => {
  const baseToken = await getBaseToken(hre);
  const minerAddress = await getMinerAddress(hre);
  const tx = await baseToken.approve(Config.v4_engineAddress, hre.ethers.constants.MaxUint256);
  await tx.wait();
  const allowance = await baseToken.allowance(minerAddress, Config.v4_engineAddress);
  console.log(`allowance ${hre.ethers.utils.formatEther(allowance)}`);
});

task("mining:submitTask", "Helper to submit task")
.addOptionalParam("v", "Version of task", "0")
.addOptionalParam("owner", "Owner of task")
.addParam("model", "Model id")
.addOptionalParam("fee", "Fee", "0")
.addParam("input", "Input")
.setAction(async ({ v, owner, model, fee, input }, hre) => {
  owner = owner || await getMinerAddress(hre);

  const engine = await getEngine(hre);
  const tx = await engine.submitTask(
    v,
    owner,
    model,
    hre.ethers.utils.parseEther(fee),
    hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(input))
  );
  const receipt = await tx.wait();
  console.log(receipt.events[0].args.id);
});

task("mining:signalCommitment", "Helper to submit commitment")
.addParam("task", "Task id")
.addOptionalParam("cid", "Solution cid", "0x12206666666666666666666666666666666666666666666666666666666666666666")
.setAction(async ({ task, cid }, hre) => {
  const engine = await getEngine(hre);
  const sender = await getMinerAddress(hre);
  const commitment = await engine.generateCommitment(sender, task, cid);
  console.log(`Commitment: ${commitment}`);
  const tx = await engine.signalCommitment(commitment);
  const receipt = await tx.wait();
  console.log(`Commitment signaled for task ${task} in ${receipt.transactionHash}`);
});

task("mining:submitSolution", "Helper to submit solution")
.addParam("task", "Task id")
.addOptionalParam("cid", "Solution cid", "0x12206666666666666666666666666666666666666666666666666666666666666666")
.addOptionalParam("commit", "Send commitment", true, types.boolean)
.setAction(async ({ task, cid, commit }, hre) => {
  const engine = await getEngine(hre);

  if (commit) {
    const sender = await getMinerAddress(hre);
    const commitment = await engine.generateCommitment(sender, task, cid);
    console.log(`Commitment: ${commitment}`);
    const tx = await engine.signalCommitment(commitment);
    const receipt = await tx.wait();
    console.log(`Commitment signaled for task ${task} in ${receipt.transactionHash}`);
  }
  {
    const tx = await engine.submitSolution(
      task,
      cid,
    );
    const receipt = await tx.wait();
    console.log(`Solution submitted for task ${task} in ${receipt.transactionHash}`);
  }
});
  

task("mining:claimSolution", "Claim past task")
.addParam("task", "Task id")
.setAction(async ({ task }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.claimSolution(task);
  await tx.wait();
});

task("validator:lookup", "Query validator")
.addOptionalParam("address", "Address")
.setAction(async ({ address }, hre) => {
  address = address || await getMinerAddress(hre);
  const engine = await getEngine(hre);
  const validator = await engine.validators(address);
  console.log(validator);

});

task("validator:stake", "Become a validator")
.addOptionalParam("address", "Address")
.addOptionalParam("amount", "Amount")
.setAction(async ({ address, amount }, hre) => {
  address = address || await getMinerAddress(hre);
  const engine = await getEngine(hre);

  if (! amount) {
    const minimum = await engine.getValidatorMinimum();
    const minimumWithBuffer = minimum.mul(1200).div(1000);
    console.log(`No amount specified, using minimum ${hre.ethers.utils.formatEther(minimumWithBuffer)}`);
    amount = hre.ethers.utils.formatEther(minimumWithBuffer);
  }

  const tx = await engine.validatorDeposit(address, hre.ethers.utils.parseEther(amount));
  await tx.wait();

  const validator = await engine.validators(address);
  const staked = hre.ethers.utils.formatEther(validator.staked);

  console.log(`${await getMinerAddress(hre)} is now a validator with stake ${staked}`);
});

task("engine:transferOwnership", "Transfer admin ownership of Engine")
.addParam("address", "To who?")
.setAction(async ({ address }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.transferOwnership(address);
  await tx.wait();
});

task("engine:transferTreasury", "Transfer treasury of Engine")
.addParam("address", "To who?")
.setAction(async ({ address }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.transferTreasury(address);
  await tx.wait();
});

task("engine:isPaused", "Check if engine is paused")
.setAction(async ({ }, hre) => {
  const engine = await getEngine(hre);
  const paused = await engine.paused();
  console.log(`Engine is paused: ${paused}`);
});

task("engine:pause", "Pause engine")
.addParam("pause", "Pause/Unpause")
.setAction(async ({ pause }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.setPaused(pause === 'true');
  await tx.wait();
  const paused = await engine.paused();
  console.log(`Engine is now ${paused ? 'paused' : 'unpaused'}`);
});

task("engine:setVersion", "Set engine version for miner check")
.addParam("n", "Version Number")
.setAction(async ({ n }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.setVersion(n);
  await tx.wait();
  const versionNow = await engine.version();
  console.log(`Engine is now version ${versionNow}`);
});

task("engine:version", "Get engine version for miner check")
.setAction(async ({ }, hre) => {
  const engine = await getEngine(hre);
  const versionNow = await engine.version();
  console.log(`Engine is now version ${versionNow}`);
});

task("engine:reward", "Check reward calculation")
.addParam("t", "Time")
.addParam("ts", "Total supply")
.setAction(async ({ t, ts }, hre) => {
  const engine = await getEngine(hre);
  const reward = await engine.reward(t, hre.ethers.utils.parseEther(ts));
  console.log(hre.ethers.utils.formatEther(reward));
});

task("engine:getPsuedoTotalSupply", "Call getPsuedoTotalSupply")
.setAction(async ({ }, hre) => {
  const engine = await getEngine(hre);
  const ts = await engine.getPsuedoTotalSupply();
  console.log(hre.ethers.utils.formatEther(ts));
});

task("engine:targetTs", "Call targetTs")
.addOptionalParam("t", "Time")
.setAction(async ({ t }, hre) => {
  const engine = await getEngine(hre);

  if (typeof t === 'undefined') {
    const startBlockTime = await engine.startBlockTime();
    const now = Math.floor(Date.now() / 1000);
    t = now - startBlockTime.toNumber();
  }

  const ts = await engine.targetTs(t);
  console.log(hre.ethers.utils.formatEther(ts));
});

task("engine:getReward", "Call getReward")
.setAction(async ({ t }, hre) => {
  const engine = await getEngine(hre);
  const r = await engine.getReward();
  console.log(hre.ethers.utils.formatEther(r));
});

task("engine:setStartBlockTime", "Set startBlockTime")
.addParam("t", "Time")
.setAction(async ({ t }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.setStartBlockTime(t);
  await tx.wait();
  const startBlockTime = await engine.startBlockTime();
  console.log(`Engine is now startBlockTime ${startBlockTime}`);
});

task("engine:minClaimSolutionTime", "Get minClaimSolutionTime")
.setAction(async ({ }, hre) => {
  const engine = await getEngine(hre);
  const m = await engine.minClaimSolutionTime();
  console.log(`Engine minClaimSolutionTime is ${m}`);
});

task("treasury:withdrawAccruedFees", "Withdraw fees to treasury")
.setAction(async ({ }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.withdrawAccruedFees();
  await tx.wait();
  console.log('Fees withdrawn');
});

task("modeltoken:deploy", "Create new model token")
.addParam("name", "Name of token (e.g. 'LLaMa')")
.addParam("symbol", "Symbol of token (e.g. LLM)")
.addParam("initialSupply", "Initial supply in ether")
.addParam("treasury", "Treasury address")
.addParam("arbius", "Arbius address")
.addParam("arbiusToken", "AIUS token address")
.addParam("arbiusTreasury", "Arbius treasury address")
.addParam("router", "Uniswap router address")
.setAction(async ({
  name,
  symbol,
  initialSupply,
  treasury,
  arbius,
  arbiusToken,
  arbiusTreasury,
  router,
}, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  console.log('Deploying ModelToken with owner ', await getMinerAddress(hre));
  const modelToken = await ModelToken.deploy(
    name,
    symbol,
    hre.ethers.utils.parseEther(initialSupply),
    treasury,
    arbius,
    arbiusToken,
    arbiusTreasury,
    router,
  );
  await modelToken.deployed();

  console.log(`${name}(${symbol}) deployed to: ${modelToken.address}`);
  console.log('Make sure to write this down!');

  const ModelTokenSwapReceiver = await hre.ethers.getContractFactory("ModelTokenSwapReceiver");
  const modelTokenSwapReceiver = await ModelTokenSwapReceiver.deploy();
  await modelTokenSwapReceiver.deployed();
  console.log('ModelTokenSwapReceiver deployed to: ', modelTokenSwapReceiver.address);
  await modelTokenSwapReceiver.transferOwnership(modelToken.address);
  console.log('ModelTokenSwapReceiver ownership transferred to ', modelToken.address);

  await modelToken.setSwapReceiver(modelTokenSwapReceiver.address);
  console.log('ModelToken swap receiver set to ', modelTokenSwapReceiver.address);
});

task("modeltoken:enabletax", "Enable tax for model token")
.addParam("address", "Model token address")
.setAction(async ({ address }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.enableTax();
  await tx.wait();
  console.log('Tax enabled');
});

task("modeltoken:deployModel", "Deploy model")
.addParam("address", "Model token address")
.addParam("fee", "Fee")
.addParam("template", "Template")
.setAction(async ({ address, fee, template }, hre) => {
  const engine = await getEngine(hre);

  const templateBuf = fs.readFileSync(template);
  if (templateBuf.length > 262144) {
    console.error('error: template file bigger than 262144 bytes');
    process.exit(1);
  }
  if (templateBuf.length === 0) {
    console.error('error: template file is empty');
    process.exit(1);
  }
  if (! JSON.parse(templateBuf.toString())) {
    console.error('error: template file is not valid json');
    process.exit(1);
  }

  const cid = await engine.generateIPFSCID(templateBuf);
  console.log('model cid is', cid);

  const feeParsed = hre.ethers.utils.parseEther(fee);

  const modelId = await engine.hashModel({
    addr: address,
    fee: feeParsed,
    rate: hre.ethers.utils.parseEther('0'),
    cid,
  }, await getMinerAddress(hre));

  await (await engine.registerModel(address, feeParsed, templateBuf)).wait();
  console.log('model added with id', modelId);
});


task("modeltoken:info", "Get model info")
.addOptionalParam("address", "Model token address")
.addOptionalParam("model", "Model id")
.setAction(async ({ address, model }, hre) => {
  if (!address && !model) {
    console.error('address or model is required');
    process.exit(1);
  }

  let modelTokenAddress = address; // address could be undefined here
  if (model) {
    const engine = await getEngine(hre);

    const { addr, fee, cid } = await engine.models(model);
    console.log(`Model ${model}`);
    console.log(`  addr: ${addr}`);
    console.log(`  fee: ${hre.ethers.utils.formatEther(fee)}`);
    console.log(`  cid: ${cid}`);

    modelTokenAddress = addr;
  }

  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(modelTokenAddress);

  console.log(``);
  console.log(`ModelToken ${modelTokenAddress}`);
  console.log(`  public syncing: ${await modelToken.publicSyncingEnabled(model)}`);
  console.log(`  pricing token: ${await modelToken.pricingToken(model)}`);
  console.log(`  pricing decimals: ${await modelToken.pricingTokenDecimals(model)}`);
  console.log(`  target price: ${hre.ethers.utils.formatEther(await modelToken.targetPrice(model))}`);
  console.log(`  tax enabled: ${await modelToken.taxEnabled()}`);
  console.log(`  reward divisor: ${hre.ethers.utils.formatEther(await modelToken.rewardDivisor())}`);
  console.log(`  tax divisor: ${hre.ethers.utils.formatEther(await modelToken.taxDivisor())}`);
  console.log(`  liquidity divisor: ${hre.ethers.utils.formatEther(await modelToken.liquidityDivisor())}`);

  console.log(`  treasury: ${await modelToken.treasury()}`);
  console.log(`  arbius: ${await modelToken.arbius()}`);
  console.log(`  aius: ${await modelToken.arbiusToken()}`);
  console.log(`  arbius treasury: ${await modelToken.arbiusTreasury()}`);
  console.log(`  router: ${await modelToken.router()}`);
  console.log(`  swap receiver: ${await modelToken.swapReceiver()}`);
});


task("modeltoken:setPublicSyncingEnabled", "Enable public syncing for model")
.addParam("address", "Model token address")
.addParam("model", "Model id")
.addParam("enabled", "Enable/Disable")
.setAction(async ({ address, model, enabled }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.setPublicSyncingEnabled(model, enabled);
  await tx.wait();
  console.log(`Public syncing for model ${model} is now ${enabled}`);
});

task("modeltoken:setPricingToken", "Set pricing token for model")
.addParam("address", "Model token address")
.addParam("model", "Model id")
.addParam("token", "Token address")
.setAction(async ({ address, model, token }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.setPricingToken(model, token);
  await tx.wait();
  console.log(`Pricing token for model ${model} is now ${token}`);
});

task("modeltoken:setTargetPrice", "Set target price for model")
.addParam("address", "Model token address")
.addParam("model", "Model id")
.addParam("price", "Price")
.setAction(async ({ address, model, price }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);

  let priceParsed = hre.ethers.utils.parseEther(price);

  const tx = await modelToken.setTargetPrice(model, priceParsed);
  await tx.wait();

  console.log(`Target price for model ${model} is now ${price}`);
});

task("modeltoken:setRewardDivisor", "Set reward divisor for model token")
.addParam("address", "Model token address")
.addParam("divisor", "Divisor")
.setAction(async ({ address, divisor }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.setRewardDivisor(hre.ethers.utils.parseEther(divisor));
  await tx.wait();
  console.log(`Reward divisor is now ${divisor}`);
});

task("modeltoken:setTaxDivisor", "Set tax divisor for model token")
.addParam("address", "Model token address")
.addParam("divisor", "Divisor")
.setAction(async ({ address, model, divisor }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.setTaxDivisor(hre.ethers.utils.parseEther(divisor));
  await tx.wait();
  console.log(`Tax divisor is now ${divisor}`);
});

task("modeltoken:setLiquidityDivisor", "Set liquidity divisor for model token")
.addParam("address", "Model token address")
.addParam("divisor", "Divisor")
.setAction(async ({ address, divisor }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.setLiquidityDivisor(hre.ethers.utils.parseEther(divisor));
  await tx.wait();
  console.log(`Liquidity divisor is now ${divisor}`);
});

task("modeltoken:liquidate", "Liquidate model token")
.addParam("address", "Model token address")
.setAction(async ({ address }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.liquidate();
  const receipt = await tx.wait();
  console.log(`Model token liquidated in ${receipt.transactionHash}`);
});

task("modeltoken:withdrawArbius", "Withdraw arbius from model token")
.addParam("address", "Model token address")
.setAction(async ({ address }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.withdrawArbius();
  const receipt = await tx.wait();
  console.log(`Arbius withdrawn in ${receipt.transactionHash}`);
});

task("modeltoken:updateModelFee", "Update fee for model")
.addParam("model", "Model id")
.addParam("fee", "Fee")
.setAction(async ({ address, model, fee }, hre) => {
  const engine = await getEngine(hre);
  const { addr: modelTokenAddress } = await engine.models(model);

  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(modelTokenAddress);

  const tx = await modelToken.updateModelFee(model, fee);
  const receipt = await tx.wait();
  console.log(`Model fee for model ${model} is now ${fee} in ${receipt.transactionHash}`);
});

task("modeltoken:updateModelAddr", "Update model address for model")
.addParam("model", "Model id")
.addParam("addr", "Address")
.setAction(async ({ address, model, addr }, hre) => {
  const engine = await getEngine(hre);
  const { addr: modelTokenAddress } = await engine.models(model);

  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(modelTokenAddress);
  const tx = await modelToken.updateModelAddr(model, addr);
  await tx.wait();
  console.log(`Model address for model ${model} is now ${addr}`);
});

task("modeltoken:sync", "Sync model with pricing token")
.addParam("address", "Model token address")
.addParam("model", "Model id")
.setAction(async ({ address, model }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.sync(model);
  await tx.wait();
  console.log(`Model ${model} synced`);
});

task("modeltoken:transferOwnership", "Transfer ownership of model token")
.addParam("address", "Model token address")
.addParam("to", "To who?")
.setAction(async ({ address, to }, hre) => {
  const ModelToken = await hre.ethers.getContractFactory("ModelTokenV1");
  const modelToken = await ModelToken.attach(address);
  const tx = await modelToken.transferOwnership(to);
  await tx.wait();
  console.log(`Ownership transferred to ${to}`);
});

task("amica:setTax")
.addParam("address", "Model token address")
.addParam("tax", "Tax")
.setAction(async ({ address, tax }, hre) => {
  const Amica = await hre.ethers.getContractFactory("AmicaModelToken");
  const amica = await Amica.attach(address);
  const tx = await amica.setTax(hre.ethers.utils.parseEther(tax));
  await tx.wait();
  console.log(`Tax set to ${tax}`);
});
