import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function main() {
  // Read and parse the config.json file to get the contract addresses
  const configPath = path.resolve(__dirname, "./config.one.json");
  const configFile = fs.readFileSync(configPath, "utf-8");
  const Config = JSON.parse(configFile);

  // Ensure the environment variables are defined
  const oneKey = process.env.ARBITRUM_PRIVATE_KEY;
  const oneProviderUrl = process.env.ARBITRUM_PROVIDER_URL;

  if (!oneKey || !oneProviderUrl) {
    throw new Error(
      "ARBITRUM_PRIVATE_KEY or ARBITRUM_PROVIDER_URL is not defined in the environment variables."
    );
  }

  // Create a provider object from the URL string
  const oneProvider = new ethers.providers.JsonRpcProvider(oneProviderUrl);
  // Create a wallet object
  const walletOne = new ethers.Wallet(oneKey, oneProvider);

  // Use walletOne to interact with the contracts
  const mirrorEngine = await ethers.getContractAt(
    "V2_EngineV2",
    Config.v5_engineAddress,
    walletOne
  );
  const mirrorL2Token = await ethers.getContractAt(
    "BaseTokenV1",
    Config.v5_baseTokenAddress,
    walletOne
  );

  // get config from one
  const mirrorEngineBalance = await mirrorL2Token.balanceOf(
    mirrorEngine.address
  );
  const solutionStakeAmount = await mirrorEngine.solutionsStakeAmount();
  const startTime = await mirrorEngine.startBlockTime();

  //console.log("Mirror Engine Balance: ", mirrorEngineBalance.toString());
  //console.log("Solution Stake Amount: ", solutionStakeAmount.toString());
  //console.log("Start Time: ", startTime.toString());

  /* Deploy contracts */

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  const l2Token = await ethers.getContractAt("TestnetToken", "0x8D9753e0af7ed426c63c7D6f0424d83f257C7821");

  // deploy and upgrade engine
  const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
  const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
  const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
  const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
  const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");
  const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");


  /*
  let engine = await upgrades.deployProxy(V2_EngineV1, [
    l2Token.address,
    deployer.address, // deployer as treasury
  ]);
  await engine.deployed();
  console.log("Engine deployed to:", engine.address);

  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2);
  console.log("Engine upgraded to V2");

  await (
    await engine.connect(deployer).setSolutionStakeAmount(solutionStakeAmount)
  ).wait();
  console.log(`Solution stake amount set to ${solutionStakeAmount}`);

  await (await engine.connect(deployer).setStartBlockTime(startTime)).wait();
  console.log(
    `Start block time set to ${new Date(startTime * 1000).toString()}`
  );

  await (
    await l2Token.connect(deployer).mint(engine.address, mirrorEngineBalance)
  ).wait();
  console.log(`Minted to mirror engine: ${mirrorEngineBalance}`);
  */


  // mint 1_000_000 - mirrorEngineBalance to deployer
  /*
  const toMint = ethers.utils.parseEther("1000000").sub(mirrorEngineBalance);
  await (await l2Token.connect(deployer).mint(deployer.address, toMint)).wait();
  console.log(`Minted to deployer: ${toMint}`);

  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, {
    call: "initialize",
  });
  console.log("Engine upgraded to V3");
  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
    call: "initialize",
  });
  console.log("Engine upgraded to V4");
  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
    call: "initialize",
  });
  console.log("Engine upgraded to V5");
  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
    call: "initialize",
  });
  console.log("Engine upgraded to V6");

  // Deploy ve-contracts
  const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
  const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
  const VeStaking = await ethers.getContractFactory("VeStaking");
  const Voter = await ethers.getContractFactory("Voter");

  const veNFTRender = await VeNFTRender.deploy();
  console.log("VeNFTRender deployed to:", veNFTRender.address);
  const votingEscrow = await VotingEscrow.deploy(
    l2Token.address,
    veNFTRender.address,
    ethers.constants.AddressZero // vestaking not deployed yet
  );
  console.log("VotingEscrow deployed to:", votingEscrow.address);
  const veStaking = await VeStaking.deploy(
    l2Token.address,
    votingEscrow.address
  );
  console.log("VeStaking deployed to:", veStaking.address);
  const voter = await Voter.deploy(votingEscrow.address);
  console.log("Voter deployed to:", voter.address);

  await (await votingEscrow.setVeStaking(veStaking.address)).wait();
  console.log("VeStaking set in VotingEscrow");
  await (await engine.setVeStaking(veStaking.address)).wait();
  console.log("VeStaking set in EngineV5");
  await (await votingEscrow.setVoter(voter.address)).wait();
  console.log("Voter set in VotingEscrow");
  await (await engine.setVoter(voter.address)).wait();
  console.log("Voter set in EngineV5");
  await (await veStaking.setEngine(engine.address)).wait();
  console.log("Engine set in VeStaking)");

  // Governance contracts
  const TimelockV1 = await ethers.getContractFactory("TimelockV1");
  const GovernorV1 = await ethers.getContractFactory("GovernorV1");

  const proposers = [deployer.address];
  const executors = [deployer.address];

  const timelock = await TimelockV1.deploy(
    0,
    proposers,
    executors,
    walletOne.address
  );
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);
  */

  let engine = await ethers.getContractAt("V2_EngineV6", "0xBb388FACEffd52941a789610a931CeaDb043B885", deployer);

  const veNFTRender = await ethers.getContractAt("VeNFTRender", "0x1355bfAdE8d425a13aB1e344A5206747e42fB961", deployer);
 
  const votingEscrow = await ethers.getContractAt("VotingEscrow", "0x4e801E9BE4fa87F1c7737d77D7F74e799380eC15", deployer);

  const veStaking = await ethers.getContractAt("VeStaking", "0x51dfbe71b2226262a102a668C612c9F4C7bf81e5", deployer);

  const voter = await ethers.getContractAt("Voter", "0x19774CAB3DacE1Ac360083213Ba9E379AB6F5dB7", deployer);

  const timelock = await ethers.getContractAt("TimelockV1", "0x32c3623a621b986B1c1413cf073BCa005A718412", deployer);

  const governor = await ethers.getContractAt("GovernorV1", "0x3E44BA7519c098c6936c0ef738a9648826d155C6", deployer);
  
  /*
  const GovernorV1 = await ethers.getContractFactory("GovernorV1");

  const governor = await GovernorV1.deploy(
    votingEscrow.address,
    timelock.address
  );
  await governor.deployed();
  console.log("Governor deployed to:", governor.address);

  // Define the role constants
  const PROPOSER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
  );
  const EXECUTOR_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")
  );

  // Grant roles to the governor
  await (await timelock.grantRole(PROPOSER_ROLE, governor.address)).wait();
  await (await timelock.grantRole(EXECUTOR_ROLE, governor.address)).wait();
  console.log("Governor roles granted");
  */

  const SwapReceiver = await ethers.getContractFactory("SwapReceiver");
  const swapReceiver = await SwapReceiver.deploy();
  await swapReceiver.deployed();
  console.log(`SwapReceiver is deployed at ${swapReceiver.address}`);

  const ArbiusRouterV1 = await ethers.getContractFactory("ArbiusRouterV1");
  const arbiusRouterV1 = await ArbiusRouterV1.deploy(
    engine.address,
    l2Token.address,
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24", // uniswap router02 address
    swapReceiver.address,
  );
  await arbiusRouterV1.deployed();
  console.log(`ArbiusRouterV1 is deployed at ${arbiusRouterV1.address}`);

  await swapReceiver.transferOwnership(arbiusRouterV1.address);
  console.log(`Ownership of SwapReceiver is transferred to ${arbiusRouterV1.address}`);

  // SAVE CONFIG
  const sepoliaConfigPath = __dirname + "/config.sepolia.json";
  fs.writeFileSync(
    sepoliaConfigPath,
    JSON.stringify(
      {
        v6_baseTokenAddress: l2Token.address,
        v6_engineAddress: engine.address,
        v6_veNFTRenderAddress: veNFTRender.address,
        v6_votingEscrowAddress: votingEscrow.address,
        v6_veStakingAddress: veStaking.address,
        v6_voterAddress: voter.address,
        v6_timelockAddress: timelock.address,
        v6_governorAddress: governor.address,
        v6_arbiusRouterV1Address: arbiusRouterV1.address,
        v6_swapReceiverAddress: swapReceiver.address,
      },
      null,
      2
    )
  );
  console.log("Saved config to", sepoliaConfigPath);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
