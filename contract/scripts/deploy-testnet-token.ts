import { ethers, upgrades } from "hardhat";


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  const TestnetToken = await ethers.getContractFactory("TestnetToken");
  const testnetToken = await upgrades.deployProxy(TestnetToken, []);
  await testnetToken.deployed();
  console.log(`TestnetToken is deployed at ${testnetToken.address}`);

  console.log("Deploying contracts with the account:", deployer.address);

  process.exit(0)
}

main();
