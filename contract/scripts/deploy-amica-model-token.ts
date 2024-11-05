import { ethers, upgrades } from "hardhat";
import Config from "./config.one.json";


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  process.exit(0);

  const AmicaModelToken = await ethers.getContractFactory("AmicaModelToken");
  const token = await AmicaModelToken.deploy(
    "Amica.arbius",
    "AMICA",
    ethers.utils.parseEther("420690000000"),
    "0xF20D0ebD8223DfF22cFAf05F0549021525015577", // dao
    Config.v4_engineAddress,
    Config.v4_baseTokenAddress,
    "0xF20D0ebD8223DfF22cFAf05F0549021525015577", // dao
    "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24", // uniswap router

  );
  console.log(token);
  console.log(`AmicaModelToken is deployed at ${token.address}`);


  process.exit(0)
}

main();
