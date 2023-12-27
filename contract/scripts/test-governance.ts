import { ethers, upgrades, network } from "hardhat";
import Config from './config.json';
import ERC20Artifact from '@openzeppelin/contracts/build/contracts/ERC20.json';

export function sleep(ms: number) {
  return new Promise((res, rej) => setTimeout(res, ms));
}


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];
  const user1      = signers[1];
  const user2      = signers[2];
  const validator1 = signers[3];
  const validator2 = signers[4];
  const model1     = signers[5];

  const BaseToken = await ethers.getContractFactory('BaseTokenV1');
  const baseToken = await BaseToken.attach(Config.baseTokenAddress);

  const proposalDescription = "Proposal #1: Give grant to team -- rng: " + Math.random();
  const descriptionHash = ethers.utils.id(proposalDescription);

  const transferCalldata = baseToken.interface.encodeFunctionData('transfer', [
    '0x949e9Cc4e04972a32842Cd9d361298E57859c73e',
    ethers.utils.parseEther("1.0"),
  ]);


  await (await baseToken.connect(user1).delegate(await user1.getAddress())).wait();
  console.log('Delegated voting power user1 -> user1');
  
  const Governor = await ethers.getContractFactory("GovernorV1");
  const governor = Governor.attach(Config.governorAddress);
  // const governor = new ethers.Contract(Config.governorAddress, Governor.interface, user1);


  await (await governor.connect(user1)['propose(address[],uint256[],bytes[],string)'](
    [Config.baseTokenAddress],
    [0],
    [transferCalldata],
    proposalDescription,
  )).wait();
  console.log('Proposal submitted');

  const proposalId = await governor.hashProposal(
    [Config.baseTokenAddress],
    [0],
    [transferCalldata],
    descriptionHash,
  );
  // console.log(proposalId);
  // console.log('proposalSnapshot', await governor.proposalSnapshot(proposalId));
  // console.log('proposalDeadline', await governor.proposalDeadline(proposalId));
  // const latestBlock = await ethers.provider.getBlock("latest")
  // console.log(latestBlock);

  // wait 1 day
  await network.provider.send("hardhat_mine", ["0x19af"]); // 6575

  // 0 = Against, 1 = For, 2 = Abstain,
  await (await governor.connect(user1).castVote(proposalId, 1)).wait();
  console.log('Vote cast');

  // wait 1 week
  await network.provider.send("hardhat_mine", ["0xb3cb"]); // 46027

  // for timelock
  await (await governor.connect(user1)['queue(address[],uint256[],bytes[],bytes32)'](
    [Config.baseTokenAddress],
    [0],
    [transferCalldata],
    descriptionHash,
  )).wait();
  console.log('Queue transaction');

  // wait minimum 10 seconds for delay in timelock...
  await network.provider.send("evm_increaseTime", [12])
  await network.provider.send("evm_mine");
  // await sleep(12_000);

  await (await governor.connect(user1)['execute(address[],uint256[],bytes[],bytes32)'](
    [Config.baseTokenAddress],
    [0],
    [transferCalldata],
    descriptionHash,
  )).wait();
  console.log('Executed transaction');
}

main();
