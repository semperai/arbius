import * as fs from 'fs';
import ProxyAdminArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from "hardhat/config";
import Config from '../scripts/config.one.json';
import MainnetConfig from '../scripts/config.mainnet.json';
import LocalConfig from '../scripts/config.local.json';
import ArbSepoliaConfig from '../scripts/config.sepolia.json';

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
    const engine = await Engine.attach(LocalConfig.v5_engineAddress);
    return engine;
  }

  if (hre.network.name === 'arbitrum') {
    const engine = await Engine.attach(Config.v5_engineAddress);
    return engine;
  }

  if (hre.network.name === 'arbsepolia') {
    const engine = await Engine.attach(ArbSepoliaConfig.v5_engineAddress);
    return engine;
  }

  console.log(`Unknown network ${hre.network.name}`);
  process.exit(1);
}

async function getBaseToken(hre: HardhatRuntimeEnvironment) {
  const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    const baseToken = await BaseToken.attach(LocalConfig.v5_baseTokenAddress);
    return baseToken;
  }

  if (hre.network.name === 'arbitrum') {
    const baseToken = await BaseToken.attach(Config.v5_baseTokenAddress);
    return baseToken;
  }

  if (hre.network.name === 'arbsepolia') {
    const baseToken = await BaseToken.attach(ArbSepoliaConfig.v5_baseTokenAddress);
    return baseToken;
  }

  console.log('Unknown network');
  process.exit(1);
}

async function getVeStaking(hre: HardhatRuntimeEnvironment) {
  const VeStaking = await hre.ethers.getContractFactory("VeStaking");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    return await VeStaking.attach(LocalConfig.v5_veStakingAddress);
  }

  if (hre.network.name === 'arbitrum') {
    return await VeStaking.attach(Config.v5_veStakingAddress);
  }

  if (hre.network.name === 'arbsepolia') {
    return await VeStaking.attach(ArbSepoliaConfig.v5_veStakingAddress);
  }

  console.log('Unknown network');
  process.exit(1);
}

async function getLPStaking(hre: HardhatRuntimeEnvironment) {
  const LPStaking = await hre.ethers.getContractFactory("StakingRewards");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    return await LPStaking.attach(LocalConfig.stakingRewards);
  }

  if (hre.network.name === 'mainnet') {
    return await LPStaking.attach(MainnetConfig.stakingRewards);
  }

  console.log('Unknown network');
  process.exit(1);
}

async function getVotingEscrow(hre: HardhatRuntimeEnvironment) {
  const VotingEscrow = await hre.ethers.getContractFactory("VotingEscrow");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    return await VotingEscrow.attach(LocalConfig.v5_votingEscrowAddress);
  }

  if (hre.network.name === 'arbitrum') {
    return await VotingEscrow.attach(Config.v5_votingEscrowAddress);
  }

  if (hre.network.name === 'arbsepolia') {
    return await VotingEscrow.attach(ArbSepoliaConfig.v5_votingEscrowAddress);
  }

  console.log('Unknown network');
  process.exit(1);
}

async function getVoter(hre: HardhatRuntimeEnvironment) {
  const Voter = await hre.ethers.getContractFactory("Voter");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    return await Voter.attach(LocalConfig.v5_voterAddress);
  }

  if (hre.network.name === 'arbitrum') {
    return await Voter.attach(Config.v5_voterAddress);
  }

  if (hre.network.name === 'arbsepolia') {
    return await Voter.attach(ArbSepoliaConfig.v5_voterAddress);
  }

  console.log('Unknown network');
  process.exit(1);
}

async function getArbiusRouter(hre: HardhatRuntimeEnvironment) {
  const ArbiusRouterV1 = await hre.ethers.getContractFactory("ArbiusRouterV1");
  if (hre.network.name === 'hardhat') {
    console.log('You are on hardhat network, try localhost');
    process.exit(1);
  }

  if (hre.network.name === 'localhost') {
    return await ArbiusRouterV1.attach(LocalConfig.arbiusRouterV1Address);
  }

  if (hre.network.name === 'arbitrum') {
    return await ArbiusRouterV1.attach(Config.arbiusRouterV1Address);
  }

  if (hre.network.name === 'arbsepolia') {
    return await ArbiusRouterV1.attach(ArbSepoliaConfig.arbiusRouterV1Address);
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

task("info:engine", "Gets all info about engine contract")
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

task("info:veStaking", "Gets all info about contract")
.setAction(async ({}, hre) => {
  const veStaking = await getVeStaking(hre);
  console.log('veStaking', veStaking.address);

  console.log("getRewardForDuration", await veStaking.getRewardForDuration());
  console.log("lastTimeRewardApplicable", await veStaking.lastTimeRewardApplicable());
  console.log("lastUpdateTime", await veStaking.lastUpdateTime());
  console.log("owner", await veStaking.owner());
  console.log("periodFinish", await veStaking.periodFinish());
  console.log("rewardPerToken", await veStaking.rewardPerToken());
  console.log("rewardPerTokenStored", await veStaking.rewardPerTokenStored());
  console.log("rewardRate", await veStaking.rewardRate());
  console.log("rewardsDuration", await veStaking.rewardsDuration());
  console.log("rewardsToken", await veStaking.rewardsToken());
  console.log("totalSupply", await veStaking.totalSupply());
  console.log("votingEscrow", await veStaking.votingEscrow());
});

task("vestaking:setEngine", "Set engine address")
.addParam("address", "Engine address")
.setAction(async ({ address }, hre) => {
  const veStaking = await getVeStaking(hre);
  const tx = await veStaking.setEngine(address);
  await tx.wait();
  console.log('Engine set to ', address);
});

task("vestaking:notifyRewardAmount", "Notify reward amount")
.addParam("amount", "Amount")
.setAction(async ({ amount }, hre) => {
  console.log('Address', await getMinerAddress(hre));
  const veStaking = await getVeStaking(hre);
  const tx = await veStaking.notifyRewardAmount(hre.ethers.utils.parseEther(amount));
  const receipt = await tx.wait();
  console.log('Reward notified in ', receipt.transactionHash);
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
  const engine = await Engine.attach(Config.v5_engineAddress);

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
    const baseToken = await BaseToken.attach(LocalConfig.v5_baseTokenAddress);
    const tx = await baseToken.bridgeMint(to, hre.ethers.utils.parseEther(amount));
    await tx.wait();
    console.log(`minted ${amount} tokens to ${to}`);
});

task("test:mint", "Mint tokens")
.addParam("to", "address")
.addParam("amount", "amount")
.setAction(async ({ to, amount }, hre) => {
    const TestnetToken = await hre.ethers.getContractFactory("TestnetToken");
    const testnetToken = await TestnetToken.attach(Config.v5_baseTokenAddress);
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
  const tx = await baseToken.approve(Config.v5_engineAddress, hre.ethers.constants.MaxUint256);
  await tx.wait();
  const allowance = await baseToken.allowance(minerAddress, Config.v5_engineAddress);
  console.log(`allowance ${hre.ethers.utils.formatEther(allowance)}`);
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

task("engine:registerModel", "Register model")
.addOptionalParam("address", "Model treasury address")
.addParam("fee", "Fee")
.addParam("template", "Template")
.setAction(async ({ address, fee, template }, hre) => {
  const engine = await getEngine(hre);

  if (! address) {
    address = await getMinerAddress(hre);
  }

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
  console.log('model address', address);
  console.log(templateBuf.toString());

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

task("engine:setSolutionMineableRate", "Set solution mineable rate")
.addParam("model", "Model id")
.addParam("rate", "Rate")
.setAction(async ({ model, rate }, hre) => {
  if (parseFloat(rate) > 1) {
    console.error('error: rate must be less than 1');
  }

  const engine = await getEngine(hre);
  const tx = await engine.setSolutionMineableRate(model, hre.ethers.utils.parseEther(rate));
  const receipt = await tx.wait();
  console.log(`Solution mineable rate set in ${receipt.transactionHash}`);
});

task("engine:submitTask", "Helper to submit task")
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

task("engine:signalCommitment", "Helper to submit commitment")
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

task("engine:submitSolution", "Helper to submit solution")
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

task("engine:validator", "Query validator")
.addOptionalParam("address", "Address")
.setAction(async ({ address }, hre) => {
  address = address || await getMinerAddress(hre);
  const engine = await getEngine(hre);
  const validator = await engine.validators(address);
  console.log(validator);

});

task("engine:stake", "Become a validator")
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


task("engine:claimSolution", "Claim solved task")
.addParam("task", "Task id")
.setAction(async ({ task }, hre) => {
  const engine = await getEngine(hre);
  const tx = await engine.claimSolution(task);
  const receipt = await tx.wait();
  console.log(`Solution claimed for task ${task} in ${receipt.transactionHash}`);
});


task("engine:withdrawAccruedFees", "Withdraw fees to treasury")
.setAction(async ({ }, hre) => {
  const engine = await getEngine(hre);
  const fees = await engine.accruedFees();
  const tx = await engine.withdrawAccruedFees();
  const receipt = await tx.wait();
  console.log(`Fees ${hre.ethers.utils.formatEther(fees)}  withdrawn to treasury in ${receipt.transactionHash}`);
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

task("snapshot", "Take a snapshot")
.setAction(async ({ }, hre) => {
  const veStaking = await getVeStaking(hre);
  const votingEscrow = await getVotingEscrow(hre);

  const timestamp = 1737526931;

  const totalAirdrop = 6_969_696_969 * 0.1;
  console.log('totalAirdrop', totalAirdrop);

  const totalSupply = await votingEscrow.getPastTotalSupply(timestamp);
  const formattedTotalSupply = hre.ethers.utils.formatEther(totalSupply);

  console.log('totalSupply', formattedTotalSupply);


  let totalToSend = 0;

  let items = [];
  for (let i = 400; i < 800; i++) {
    const balance = await votingEscrow.balanceOfNFTAt(i, timestamp);
    if (balance.eq(0)) {
      console.log(`skipping ${i}`);
      continue;
    }
    const formattedBalance = hre.ethers.utils.formatEther(balance);
    const owner = await votingEscrow.ownerOf(i);
    const percentage = balance.mul(1_000_000_000).div(totalSupply);
    const formattedPercentage = hre.ethers.utils.formatUnits(percentage, 9);
    const amountToSend = Number(formattedPercentage) * totalAirdrop;
    totalToSend += amountToSend;
    console.log(i, owner, formattedBalance, formattedPercentage, amountToSend);
    items.push({ id: i, owner, formattedBalance, formattedPercentage, amountToSend });
  }

  console.log('totalToSend', totalToSend);

  console.log("\n\n\n\n\n");

  console.log(JSON.stringify(items, null, 2));
});

task("snapshot:count", "Count snapshot")
.setAction(async ({ }, hre) => {
  const lines = fs.readFileSync('snapshot_amounts.txt', 'utf8');
  const j = JSON.parse(lines);
  console.log(j);
  let total = 0;
  for (let m of j) {
    console.log(m.amountToSend);
    total += m.amountToSend;
  }
  console.log(total);
});

task("rescue:vestaking", "Rescue veStaking")
.setAction(async ({ }, hre) => {
  const veStaking = await getVeStaking(hre);

  let total = hre.ethers.BigNumber.from(0);
  for (let i = 0; i < 1000; i++) {
    try {
      const balance = await veStaking.earned(i);
      console.log(`${i},${hre.ethers.utils.formatEther(balance)}`);
      if (balance.eq(0)) {
        // console.log(`skipping ${i}`);
        continue;
      }

      // total = total.add(balance);
      // console.log('total', hre.ethers.utils.formatEther(total));
      /*
      const tx = await veStaking.getReward(i);
      const receipt = await tx.wait();
      console.log('Claimed reward for', i, receipt.transactionHash);
      */
    } catch (e) {
      console.log('error', i, e);
      console.log('waiting 3 seconds');
      await new Promise(r => setTimeout(r, 3000));
      // i--;
    }
  }
});

task("model:setFee", "Set fee for model")
.addParam("model", "Model id")
.addParam("fee", "Fee")
.setAction(async ({ model, fee }, hre) => {
  const engine = await getEngine(hre);

  const minfo = await engine.models(model);
  console.log(`Model ${minfo.addr} fee is ${hre.ethers.utils.formatEther(minfo.fee)}`);

  const tx = await engine.setModelFee(model, hre.ethers.utils.parseEther(fee));
  const receipt = await tx.wait();


  console.log(`Model fee for model ${model} is now ${fee} in ${receipt.transactionHash}`);
});

task("router:allowToken", "Allow token for router")
.addOptionalParam("token", "Token address")
.setAction(async ({ token }, hre) => {
  if (! token) {
    token = await getBaseToken(hre);
  } else {
    token = await hre.ethers.getContractAt("IERC20", token);
  }

  const router = await getArbiusRouter(hre);

  const allowance = await token.allowance(await getMinerAddress(hre), router.address);

  console.log(`Allowance for router is ${hre.ethers.utils.formatEther(allowance)}`);

  const tx = await token.approve(router.address, hre.ethers.constants.MaxUint256);
  const receipt = await tx.wait();

  console.log(`Token ${token.address} approved for router in ${receipt.transactionHash}`);
});

task("router:setValidator", "Set validator for router")
.addParam("address", "Validator address")
.addOptionalParam("status", "Status", "true")
.setAction(async ({ address, status }, hre) => {
  const router = await getArbiusRouter(hre);
  const tx = await router.setValidator(address, status === 'true');
  const receipt = await tx.wait();
  console.log(`Validator ${address} is now ${status} in ${receipt.transactionHash}`);
});

task("router:setMinValidators", "Set min validators for router")
.addParam("n", "Number")
.setAction(async ({ n }, hre) => {
  const router = await getArbiusRouter(hre);
  const tx = await router.setMinValidators(n);
  const receipt = await tx.wait();
  console.log(`Min validators set to ${n} in ${receipt.transactionHash}`);
});

task("router:submitTask", "Submit task via router")
.addOptionalParam("v", "Version of task", "0")
.addOptionalParam("owner", "Owner of task")
.addParam("model", "Model id")
.addOptionalParam("fee", "Fee", "0")
.addParam("input", "Input")
.addOptionalParam("incentive", "Incentive", "0")
.addOptionalParam("gas", "Gas limit", "1000000")
.setAction(async ({ v, owner, model, fee, input, incentive, gas }, hre) => {
  if (! owner) {
    owner = await getMinerAddress(hre);
  }

  const router = await getArbiusRouter(hre);
  const tx = await router.submitTask(
    v,
    owner,
    model,
    hre.ethers.utils.parseEther(fee),
    hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(input)),
    hre.ethers.utils.parseEther(incentive),
    gas,
  );
  const receipt = await tx.wait();
  console.log(`Task submitted in ${receipt.transactionHash}`);
});

task("router:addIncentive", "Add incentive to task via router")
.addParam("task", "Task id")
.addParam("incentive", "Incentive")
.setAction(async ({ task, incentive }, hre) => {
  const router = await getArbiusRouter(hre);
  const tx = await router.addIncentive(task, hre.ethers.utils.parseEther(incentive));
  const receipt = await tx.wait();
  console.log(`Incentive added in ${receipt.transactionHash}`);

  const totalIncentive = await router.incentives(task);
  console.log(`Total incentive for task ${task} is now ${hre.ethers.utils.formatEther(totalIncentive)}`);
});

task("router:claimIncentive", "Claim incentive from task via router")
.addParam("task", "Task id")
.setAction(async ({ task }, hre) => {
  const router = await getArbiusRouter(hre);
  // EDIT THESE MANUALLY
  const sigs = [{
    "signer": "0xb7a4f522Ea9e72a54cfcE736Cd5a40de4c0056c6",
    "signature": "0xdf8f990a77b5e2843b43f685ce23ac266f976693b8ea7fee7e95b28bc36dc7ec4752fcba6ef3e76e398815a1e15f685a4d584c77a4a45b0ceed86f6442fe3dcc1b"
  }];
  const tx = await router.claimIncentive(task, sigs);
  const receipt = await tx.wait();
  console.log(`Incentive claimed in ${receipt.transactionHash}`);
});

task("router:incentives", "Get incentives for task via router")
.addParam("task", "Task id")
.setAction(async ({ task }, hre) => {
  const router = await getArbiusRouter(hre);
  const totalIncentive = await router.incentives(task);
  console.log(`Total incentive for task ${task} is ${hre.ethers.utils.formatEther(totalIncentive)}`);
});

task("ipfsoracle:sign", "Sign solution cid from taskid")
.addParam("task", "Task id")
.addParam("pk", "Private key")
.setAction(async ({ task, pk }, hre) => {
  const wallet = new hre.ethers.Wallet(pk);

  const engine = await getEngine(hre);
  const { cid, validator } = await engine.solutions(task);
  if (validator === hre.ethers.constants.AddressZero) {
    console.error('No solution for task', task);
    return
  }

  const hash = hre.ethers.utils.solidityKeccak256(['bytes'], [cid]);
  const digest = hre.ethers.utils.arrayify(hash);
  const skey = new hre.ethers.utils.SigningKey(wallet.privateKey);
  const components = skey.signDigest(digest);
  const signature = hre.ethers.utils.joinSignature(components);

  const signatureObject = {
    signer: wallet.address,
    signature,
  };

  console.log("\nSignature Object for contract:");
  console.log(JSON.stringify(signatureObject, null, 2));
});

task("lpstaking:notifyRewardAmount", "Notify reward amount")
.addParam("amount", "Amount")
.setAction(async ({ amount }, hre) => {
  console.log('Address', await getMinerAddress(hre));
  const lpStaking = await getLPStaking(hre);
  const tx = await lpStaking.notifyRewardAmount(hre.ethers.utils.parseEther(amount));
  const receipt = await tx.wait();
  console.log('Reward notified in ', receipt.transactionHash);
});

task("lpstaking:setRewardsDuration", "Set duration of rewards period")
.addParam("seconds", "Seconds")
.setAction(async ({ seconds }, hre) => {
  console.log('Address', await getMinerAddress(hre));
  const lpStaking = await getLPStaking(hre);
  const tx = await lpStaking.setRewardsDuration(seconds);
  const receipt = await tx.wait();
  console.log('Reward duration changed in ', receipt.transactionHash);
});

task("voter:createGauge", "Create gauge")
.addParam("model", "Model id")
.setAction(async ({ model }, hre) => {
  const voter = await getVoter(hre);
  const tx = await voter.createGauge(model);
  const receipt = await tx.wait();
  console.log('Gauge created in ', receipt.transactionHash);
});

task("voter:killGauge", "Kill gauge (not allowed to receive more votes)")
.addParam("model", "Model id")
.setAction(async ({ model }, hre) => {
  const voter = await getVoter(hre);
  const tx = await voter.killGauge(model);
  const receipt = await tx.wait();
  console.log('Gauge killed in ', receipt.transactionHash);
});

task("voter:reviveGauge", "Revive gauge (brings back to life)")
.addParam("model", "Model id")
.setAction(async ({ model }, hre) => {
  const voter = await getVoter(hre);
  const tx = await voter.reviveGauge(model);
  const receipt = await tx.wait();
  console.log('Gauge revived in ', receipt.transactionHash);
});
