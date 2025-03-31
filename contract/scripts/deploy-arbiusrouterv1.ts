import { ethers, upgrades } from "hardhat";
import Config from "./config.one.json";


async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  const SwapReceiver = await ethers.getContractFactory("SwapReceiver");
  const swapReceiver = await SwapReceiver.deploy();
  await swapReceiver.deployed();
  console.log(`SwapReceiver is deployed at ${swapReceiver.address}`);

  const ArbiusRouterV1 = await ethers.getContractFactory("ArbiusRouterV1");
  const arbiusRouterV1 = await ArbiusRouterV1.deploy(
    Config.v5_engineAddress,
    Config.v5_baseTokenAddress,
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24", // uniswap router02 address
    swapReceiver.address,
  );
  await arbiusRouterV1.deployed();
  console.log(`ArbiusRouterV1 is deployed at ${arbiusRouterV1.address}`);

  await swapReceiver.transferOwnership(arbiusRouterV1.address);
  console.log(`Ownership of SwapReceiver is transferred to ${arbiusRouterV1.address}`);

  process.exit(0)
}

main();
