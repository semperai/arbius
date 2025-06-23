
import { ethers, upgrades } from "hardhat";
import * as hre from "hardhat"; // Import hre directly from Hardhat
import Config from './config.one.json';

async function main() {
  // get network name from hardhat runtime environment
  const networkName = hre.network.name;
  console.log("Network:", networkName);

  /* Deploy contracts */
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // upgrade new version with totalHeld fix
  const EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
  const engine = await upgrades.upgradeProxy(Config.v5_engineAddress, EngineV5_2, {
    call: "initialize",
  });
  console.log("Engine upgraded");

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
