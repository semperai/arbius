import { ethers, upgrades } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function main() {
    // Read and parse the config.json file to get the contract addresses
    const configPath = path.resolve(__dirname, './config.json');
    const configFile = fs.readFileSync(configPath, 'utf-8');
    const Config = JSON.parse(configFile);

    // Ensure the environment variables are defined
    const novaKey = process.env.NOVA_PRIVATE_KEY;
    const novaProviderUrl = process.env.NOVA_PROVIDER_URL;

    if (!novaKey || !novaProviderUrl) {
        throw new Error("NOVA_PRIVATE_KEY or NOVA_PROVIDER_URL is not defined in the environment variables.");
    }

    // Create a provider object from the URL string
    const novaProvider = new ethers.providers.JsonRpcProvider(novaProviderUrl);
    // Create a wallet object
    const walletNova = new ethers.Wallet(novaKey, novaProvider);

    // Use walletNova to interact with the contracts
    const mirrorEngine = await ethers.getContractAt('V2_EngineV2', Config.v2_engineAddress, walletNova);
    const mirrorL2Token = await ethers.getContractAt('BaseTokenV1', Config.v2_l1TokenAddress, walletNova);

    // get config from nova
    const mirrorEngineBalance = await mirrorL2Token.balanceOf(mirrorEngine.address);
    const solutionStakeAmount = await mirrorEngine.solutionsStakeAmount();
    const startTime = await mirrorEngine.startBlockTime();

    //console.log("Mirror Engine Balance: ", mirrorEngineBalance.toString());
    //console.log("Solution Stake Amount: ", solutionStakeAmount.toString());
    //console.log("Start Time: ", startTime.toString());


    /* Deploy contracts */

    const signers = await ethers.getSigners();
    const deployer = signers[0];

    console.log("Deploying contracts with the account:", deployer.address);

    const L2Token = await ethers.getContractFactory('TestnetToken');
    const l2Token = await upgrades.deployProxy(L2Token, []);
    await l2Token.deployed();
    console.log(`L2Token is deployed to L2 at ${l2Token.address}`);

    // deploy and upgrade engine
    const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
    const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
    const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
    const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");

    let engine = await upgrades.deployProxy(V2_EngineV1, [
        l2Token.address,
        deployer.address, // deployer as treasury
      ]);
    await engine.deployed();
    console.log("Engine deployed to:", engine.address);

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2);
    console.log("Engine upgraded to V2");

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
        .mint(engine.address, mirrorEngineBalance)
    ).wait();
    console.log(`Minted to mirror engine: ${mirrorEngineBalance}`);

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, { call: "initialize" });
    console.log("Engine upgraded to V3");
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, { call: "initialize" });
    console.log("Engine upgraded to V4"); 

    
    // Deploy ve-contracts
    const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
    const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
    const VeStaking = await ethers.getContractFactory("VeStaking");

    const veNFTRender = await VeNFTRender.deploy();
    console.log("VeNFTRender deployed to:", veNFTRender.address);
    const votingEscrow = await VotingEscrow.deploy(
        l2Token.address,
        veNFTRender.address,
        ethers.constants.AddressZero // vestaking not deployed yet
    );
    console.log("VotingEscrow deployed to:", votingEscrow.address);
    const veStaking = await VeStaking.deploy(l2Token.address, votingEscrow.address);
    console.log("VeStaking deployed to:", veStaking.address);

    await (await votingEscrow.setVeStaking(veStaking.address)).wait();
    console.log("VeStaking set in VotingEscrow");

    await (await engine.setVeStaking(veStaking.address)).wait();
    console.log("VeStaking set in EngineV4");


    // Governance contracts
    const TimelockV1 = await ethers.getContractFactory("TimelockV1");
    const GovernorV1 = await ethers.getContractFactory("GovernorV1");

    const proposers = [deployer.address];
    const executors = [deployer.address];

    const timelock = await TimelockV1.deploy(0, proposers, executors, walletNova.address);
    await timelock.deployed();
    console.log("Timelock deployed to:", timelock.address);
    
    const governor = await GovernorV1.deploy(
      votingEscrow.address,
      timelock.address
    );
    await governor.deployed();
    console.log("Governor deployed to:", governor.address);

    // Define the role constants
    const PROPOSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE"));
    const EXECUTOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE"));
    
    // Grant roles to the governor
    await (await timelock.grantRole(PROPOSER_ROLE, governor.address)).wait();
    await (await timelock.grantRole(EXECUTOR_ROLE, governor.address)).wait();
    console.log("Governor roles granted");


    // SAVE CONFIG
    const sepoliaConfigPath = __dirname + '/config.sepolia.json';
    fs.writeFileSync(sepoliaConfigPath, JSON.stringify({
        v2_baseTokenAddress: l2Token.address,
        v2_enginev4Address: engine.address,
        veNFTRenderAddress: veNFTRender.address,
        votingEscrowAddress: votingEscrow.address,
        veStakingAddress: veStaking.address,
        timelockAddress: timelock.address,
        governorAddress: governor.address
    }, null, 2));
    console.log('Saved config to', sepoliaConfigPath);
    process.exit(0);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
