import * as fs from 'fs';
import ProxyAdminArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task } from "hardhat/config";
import Config from '../scripts/config.json';
import LocalConfig from '../scripts/config.local.json';

async function getMinerAddress(hre: HardhatRuntimeEnvironment) {
  const accounts = await hre.ethers.getSigners();
  return accounts[0].address;
}

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
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
  const engine = await Engine.attach(Config.engineAddress);

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
    const baseToken = await BaseToken.attach(LocalConfig.v2_baseTokenAddress);
    const tx = await baseToken.bridgeMint(to, hre.ethers.utils.parseEther(amount));
    await tx.wait();
    console.log(`minted ${amount} tokens to ${to}`);
});

task("test:mint", "Mint tokens")
.addParam("to", "address")
.addParam("amount", "amount")
.setAction(async ({ to, amount }, hre) => {
    const TestnetToken = await hre.ethers.getContractFactory("TestnetToken");
    const testnetToken = await TestnetToken.attach(Config.v2_baseTokenAddress);
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
  const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
  const baseToken = await BaseToken.attach(Config.baseTokenAddress);
  const minerAddress = await getMinerAddress(hre);
  const bal = await baseToken.balanceOf(minerAddress);
  console.log(`balance ${hre.ethers.utils.formatEther(bal)}`);
});

task("mining:transfer", "Transfer mining rewards to new address")
.addParam("address", "Receiver address")
.addParam("amount", "In token value")
.setAction(async ({ address, amount }, hre) => {
  const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
  const baseToken = await BaseToken.attach(Config.baseTokenAddress);
  const tx = await baseToken.transfer(address, hre.ethers.utils.parseEther(amount));
  await tx.wait();
  console.log(`sent ${amount} tokens to ${address}`);
});

task("mining:claimSolution", "Claim past task")
.addParam("taskid", "Task id")
.setAction(async ({ taskid }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.claimSolution(taskid);
  await tx.wait();
});

task("mining:signalSupport", "Signal mining support for model")
.addParam("model", "Model id")
.addParam("support", "Whether supported or not")
.setAction(async ({ model, support }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.signalSupport(model, support);
  await tx.wait();
});

task("model:register", "Register new model")
.addParam("address", "Address for fees for model")
.addParam("fee", "Flat fee to set")
.addParam("template", "Model schema")
.setAction(async ({ address, fee, template }, hre) => {
  // The template file is loaded and submitted as calldata
  const tdata = fs.readFileSync(template);
  if (tdata.length > 262144) {
    console.error('error: template file bigger than 262144 bytes');
    process.exit(1);
  }

  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.registerModel(address, fee, tdata);
  const receipt = await tx.wait();

  const modelid = receipt.events[0].args.id;

  const { cid } = await engine.models(modelid);

  console.log(`Model registered: ${modelid}`);
  console.log();
  console.log(`Add the following to arbius/contract/scripts/config.json in the "models" section:`);
  console.log();
  console.log(JSON.stringify({
    "<your-model-name>": {
      id: modelid,
      mineable: false,
      contracts: {},
      params: {
        addr: address,
        fee,
        cid,
      },
    },
  }, null, 2));
});

task("validator:lookup", "Query validator")
.addParam("address", "Address")
.setAction(async ({ address }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);

  const validator = await engine.validators(address);
  console.log(validator);

});

task("v2:validator:lookup", "Query validator")
.addParam("address", "Address")
.setAction(async ({ address }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);

  const validator = await engine.validators(address);
  console.log(validator);

});

task("validator:stake", "Become a validator")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);

  const minimum = await engine.getValidatorMinimum();
  const minimumWithBuffer = minimum.mul(1200).div(1000);

  const tx = await engine.validatorDeposit(await getMinerAddress(), minimumWithBuffer);
  await tx.wait();

  console.log(`${await getMinerAddress(hre)} is now a validator`);
});

task("validator:deploy-delegation", "Create delegated validator")
.addVariadicPositionalParam("modelIds")
.setAction(async ({ modelIds }, hre) => {
  const DelegatedValidatorDeployer = await hre.ethers.getContractFactory("DelegatedValidatorDeployerV1");
  const delegatedValidatorDeployer = await DelegatedValidatorDeployer.attach(Config.delegatedValidatorDeployerAddress);

  const tx = await delegatedValidatorDeployer.deploy(
    modelIds,
  );
  const receipt = await tx.wait();
  for (const e of receipt.events) {
    if (! e.event === 'Deploy') {
      continue;
    }

    if (typeof e.args === 'undefined') {
      continue;
    }

    console.log(`new delegated validator deployed to ${e.args.del}`);
    break;
  }
});
// TODO add delegation utilities
// TODO setting delegate for delegatedValidator
// TODO submit solutions and vote etc

task("engine:transferOwnership", "Transfer admin ownership of Engine")
.addParam("address", "To who?")
.setAction(async ({ address }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.transferOwnership(address);
  await tx.wait();
});

task("engine:setSolutionMineableStatus", "Allow a model to receive rewards for tasks completed")
.addParam("model", "Model id")
.addParam("enabled", "Enable/Disable")
.setAction(async ({ model, enabled }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.setSolutionMineableStatus(model, enabled);
  await tx.wait();
  console.log(`${model} mineable status set to ${enabled}`);
});

task("engine:isPaused", "Check if engine is paused")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const paused = await engine.paused();
  console.log(`Engine is paused: ${paused}`);
});

task("v2:engine:isPaused", "Check if engine is paused")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);
  const paused = await engine.paused();
  console.log(`Engine is paused: ${paused}`);
});

task("engine:pause", "Pause engine")
.addParam("pause", "Pause/Unpause")
.setAction(async ({ pause }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.setPaused(pause === 'true');
  await tx.wait();
  const paused = await engine.paused();
  console.log(`Engine is now ${paused ? 'paused' : 'unpaused'}`);
});

task("v2:engine:pause", "Pause engine")
.addParam("pause", "Pause/Unpause")
.setAction(async ({ pause }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);
  const tx = await engine.setPaused(pause === 'true');
  await tx.wait();
  const paused = await engine.paused();
  console.log(`Engine is now ${paused ? 'paused' : 'unpaused'}`);
});

task("engine:setVersion", "Set engine version for miner check")
.addParam("n", "Version Number")
.setAction(async ({ n }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.setVersion(n);
  await tx.wait();
  const versionNow = await engine.version();
  console.log(`Engine is now version ${versionNow}`);
});

task("v2:engine:setVersion", "Set engine version for miner check")
.addParam("n", "Version Number")
.setAction(async ({ n }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);
  const tx = await engine.setVersion(n);
  await tx.wait();
  const versionNow = await engine.version();
  console.log(`Engine is now version ${versionNow}`);
});

task("engine:version", "Get engine version for miner check")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const versionNow = await engine.version();
  console.log(`Engine is now version ${versionNow}`);
});

task("v2:engine:version", "Get engine version for miner check")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);
  const versionNow = await engine.version();
  console.log(`Engine is now version ${versionNow}`);
});

task("v2:engine:reward", "Check reward calculation")
.addParam("t", "Time")
.addParam("ts", "Total supply")
.setAction(async ({ t, ts }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);
  const reward = await engine.reward(t, hre.ethers.utils.parseEther(ts));
  console.log(hre.ethers.utils.formatEther(reward));
});

task("v2:engine:getPsuedoTotalSupply", "Call getPsuedoTotalSupply")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);
  const ts = await engine.getPsuedoTotalSupply();
  console.log(hre.ethers.utils.formatEther(ts));
});

task("v2:engine:targetTs", "Call targetTs")
.addOptionalParam("t", "Time")
.setAction(async ({ t }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);

  if (typeof t === 'undefined') {
    const startBlockTime = await engine.startBlockTime();
    const now = Math.floor(Date.now() / 1000);
    t = now - startBlockTime.toNumber();
  }

  const ts = await engine.targetTs(t);
  console.log(hre.ethers.utils.formatEther(ts));
});

task("v2:engine:getReward", "Call getReward")
.setAction(async ({ t }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);

  const r = await engine.getReward();
  console.log(hre.ethers.utils.formatEther(r));
});

task("v2:engine:setStartBlockTime", "Set startBlockTime")
.addParam("t", "Time")
.setAction(async ({ t }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV2");
  const engine = await Engine.attach(Config.v2_engineAddress);

  const tx = await engine.setStartBlockTime(t);
  await tx.wait();
  const startBlockTime = await engine.startBlockTime();
  console.log(`Engine is now startBlockTime ${startBlockTime}`);
});

task("v2:engine:minClaimSolutionTime", "Get minClaimSolutionTime")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV3");
  const engine = await Engine.attach(Config.v2_engineAddress);

  const m = await engine.minClaimSolutionTime();
  console.log(`Engine minClaimSolutionTime is ${m}`);
});

task("v2:engine:initialize", "")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("V2_EngineV3");
  const engine = await Engine.attach(Config.v2_engineAddress);

  const tx = await engine.initialize();
  await tx.wait();
  console.log(`Engine initialized`);
});

task("engine:setMinClaimSolutionTime", "set min claim solution time")
.addParam("n", "seconds")
.setAction(async ({ n }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.setMinClaimSolutionTime(n);
  await tx.wait();
  const m = await engine.minClaimSolutionTime();
  console.log(`Engine minClaimSolutionTime is now ${m}`);
});

task("engine:setMinContestationVotePeriodTime", "set min contestation vote period time")
.addParam("n", "seconds")
.setAction(async ({ n }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.setMinContestationVotePeriodTime(n);
  await tx.wait();
  const m = await engine.minContestationVotePeriodTime();
  console.log(`Engine minContestationVotePeriodTime is now ${m}`);
});

task("treasury:withdrawAccruedFees", "Withdraw fees to treasury")
.setAction(async ({ }, hre) => {
  const Engine = await hre.ethers.getContractFactory("EngineV1");
  const engine = await Engine.attach(Config.engineAddress);
  const tx = await engine.withdrawAccruedFees();
  await tx.wait();
  console.log('Fees withdrawn');
});

task("engine:utils:staked", "Check staked amount")
.addParam("address", "Address")
.setAction(async ({ address }, hre) => {
  const Utils = await hre.ethers.getContractFactory("EngineUtilsV1");
  const utils = await Utils.attach(Config.engineUtilsAddress);
  const staked = await utils.staked(address);
  console.log(`Staked: ${hre.ethers.utils.formatEther(staked)}`);
});

task("governance:delegate", "Delegate your tokens")
.addParam("address", "To who? (can be yourself)")
.setAction(async ({ address }, hre) => {
  const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
  const baseToken = await BaseToken.attach(Config.baseTokenAddress);
  const tx = await baseToken.delegate(address);
  await tx.wait();
  console.log(`Delegated voting rights to ${address}`);
});

task("governance:propose", "Propose a vote")
.addParam("f", "Filename of proposal markdown file")
.setAction(async ({ f }, hre) => {
  const description = fs.readFileSync(f, 'utf8');
  const descriptionHash = hre.ethers.utils.id(description);

  const Governor  = await hre.ethers.getContractFactory("GovernorV1");
  const governor  = await Governor.attach(Config.governorAddress);

  const BaseToken = await hre.ethers.getContractFactory("BaseTokenV1");
  const baseToken = await BaseToken.attach(Config.baseTokenAddress);

  const targets = [
    Config.baseTokenAddress,
  ];
  const values = [
    0,
  ];
  const calldatas = [
    baseToken.interface.encodeFunctionData('transfer', [
      '0x1A320E53A25f518B893F286f3600cc204c181a8E',
      hre.ethers.utils.parseEther("1.000012"),
    ]),
  ];

  const tx = await governor['propose(address[],uint256[],bytes[],string)'](
    targets,
    values,
    calldatas,
    description,
  );
  const receipt = await tx.wait();

  const proposalId = await governor.hashProposal(
    targets,
    values,
    calldatas,
    descriptionHash,
  );
  console.log('Proposal submitted', proposalId.toHexString());
  console.log(receipt);
});

task("governance:vote", "Vote on a proposal")
.addParam("proposal", "Proposal id")
.addParam("vote", "0=against, 1=for, 2=abstain")
.setAction(async ({ proposal, vote }, hre) => {
  const Governor  = await hre.ethers.getContractFactory("GovernorV1");
  const governor  = await Governor.attach(Config.governorAddress);

  // 0 = Against, 1 = For, 2 = Abstain,
  const tx = await governor.castVote(proposal, vote);
  const receipt = await tx.wait();
  console.log('Vote cast');
});

task("governance:cancel", "Cancel a proposal")
.addParam("proposal", "Proposal id")
.setAction(async ({ proposal }, hre) => {
  const Governor  = await hre.ethers.getContractFactory("GovernorV1");
  const governor  = await Governor.attach(Config.governorAddress);

  const tx = await governor.cancel(proposal);
  const receipt = await tx.wait();
  console.log('Proposal canceled');
});

task("governance:queue", "Queue a proposal")
.addParam("proposal", "Proposal id")
.setAction(async ({ proposal }, hre) => {
  const Governor  = await hre.ethers.getContractFactory("GovernorV1");
  const governor  = await Governor.attach(Config.governorAddress);

  const [
    targets,
    values,
    signatures,
    calldatas,
  ] = await governor.getActions(proposal);

  const descriptionHash = await governor.descriptionHashes(proposal);

  const tx = await governor['queue(address[],uint256[],bytes[],bytes32)'](
    targets,
    values,
    calldatas,
    descriptionHash,
  );
  const receipt = await tx.wait();
  console.log('Proposal queued');
});

task("governance:execute", "Execute a proposal")
.addParam("proposal", "Proposal id")
.setAction(async ({ proposal }, hre) => {
  const Governor  = await hre.ethers.getContractFactory("GovernorV1");
  const governor  = await Governor.attach(Config.governorAddress);

  const [
    targets,
    values,
    signatures,
    calldatas,
  ] = await governor.getActions(proposal);

  const descriptionHash = await governor.descriptionHashes(proposal);

  const tx = await governor['execute(address[],uint256[],bytes[],bytes32)'](
    targets,
    values,
    calldatas,
    descriptionHash,
  );
  const receipt = await tx.wait();
  console.log('Proposal executed');
  console.log(receipt);
});

task("governance:proposal", "Look up proposal info")
.addParam("proposal", "Proposal id")
.setAction(async ({ proposal }, hre) => {
  const Governor  = await hre.ethers.getContractFactory("GovernorV1");
  const governor  = await Governor.attach(Config.governorAddress);

  const {
    id,
    proposer,
    eta,
    startBlock,
    endBlock,
    forVotes,
    againstVotes,
    abstainVotes,
    canceled,
    executed,
  } = await governor.proposals(proposal);

  console.log('id',           id.toHexString());
  console.log('proposer',     proposer);
  console.log('eta',          eta.toString());
  console.log('startBlock',   startBlock.toString());
  console.log('endBlock',     endBlock.toString());
  console.log('forVotes',     ethers.utils.formatEther(forVotes));
  console.log('againstVotes', ethers.utils.formatEther(againstVotes));
  console.log('abstainVotes', ethers.utils.formatEther(abstainVotes));
  console.log('canceled',     canceled);
  console.log('executed',     executed);

  console.log();

  const [
    targets,
    values,
    signatures,
    calldatas,
  ] = await governor.getActions(proposal);

  console.log('targets',     targets);
  console.log('values',      values.map((v) => ethers.utils.formatEther(v.toString())));
  console.log('signatures',  signatures);
  console.log('calldatas',   calldatas);

  for (let i=0; i<targets.length; ++i) {
    console.log();
    console.log(`target ${i}`);
    const target = targets[i];
    const calldata = calldatas[i];

    let iface = null;
    if (target === Config.baseTokenAddress) {
      const Contract = await hre.ethers.getContractFactory("BaseTokenV1");
      const contract = await Contract.attach(Config.baseTokenAddress);
      iface = contract.interface; 
    }
    else if (target === Config.engineAddress) {
      const Contract = await hre.ethers.getContractFactory("EngineV1");
      const contract = await Contract.attach(Config.engineAddress);
      iface = baseToken.interface; 
    }
    else if (target === Config.lpStakingRewardAddress) {
      const Contract = await hre.ethers.getContractFactory("LPStakingRewardV1");
      const contract = await Contract.attach(Config.lpStakingRewardAddress);
      iface = contract.interface; 
    }
    else if (target === Config.timelockAddress) {
      const Contract = await hre.ethers.getContractFactory("TimelockV1");
      const contract = await Contract.attach(Config.timelockAddress);
      iface = baseToken.interface; 
    }
    else if (target === Config.governorAddress) {
      const Contract = await hre.ethers.getContractFactory("GovernorV1");
      const contract = await Contract.attach(Config.governorAddress);
      iface = contract.interface; 
    }
    else if (target === Config.delegatedValidatorDeployerAddress) {
      const Contract = await hre.ethers.getContractFactory("DelegatedValidatorDeployerV1");
      const contract = await Contract.attach(Config.delegatedValidatorDeployerAddress);
      iface = contract.interface; 
    }
    // TODO add additional interface lookups here
    else if (target === Config.proxyAdminAddress) {
      // special handling needed for proxy admin
      const contract = new ethers.Contract(Config.proxyAdminAddress, ProxyAdminArtifact.abi);
      iface = contract.interface;
    }

    if (iface === null) {
      console.log(`cannot decode (do not know target ${target})`);
      continue;
    }

    const { args, name, signature, value, functionFragment } = iface.parseTransaction({
      data: calldata,
    });

    for (let input_idx=0; input_idx<functionFragment.inputs.length; ++input_idx) {
      const input = functionFragment.inputs[input_idx];
      const arg = args[input_idx];
      console.log(`${input.name}(${input.type}) ${arg}`);
    }
  }
});
