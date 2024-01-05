import { ethers, network, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { EngineV1 as Engine } from "../typechain/EngineV1";
import { TimelockV1 as Timelock } from "../typechain/TimelockV1";
import { GovernorV1 as Governor } from "../typechain/GovernorV1";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("Governance Unit Tests", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer:   SignerWithAddress;
  let user1:      SignerWithAddress;
  let user2:      SignerWithAddress;
  let lpreward:   SignerWithAddress; // doesnt matter for governance testing

  let baseToken: BaseToken;
  let engine: Engine;
  let timelock: Timelock;
  let governor: Governor;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];
    user1      = signers[1];
    user2      = signers[2];
    lpreward   = signers[3];

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();
    console.log("BaseToken deployed to:", baseToken.address);


    const Timelock = await ethers.getContractFactory(
      "TimelockV1"
    );

    timelock = await Timelock.deploy(
      BigNumber.from(0),
      [await deployer.getAddress(), await user1.getAddress()],
      [await deployer.getAddress(), await user1.getAddress()],
      await deployer.getAddress(),
    ) as Timelock;
    await timelock.deployed();
    console.log("Timelock deployed to:", timelock.address);

    const Engine = await ethers.getContractFactory(
      "EngineV1"
    );
    engine = (await upgrades.deployProxy(Engine, [
      baseToken.address,
      await lpreward.getAddress(),
    ])) as Engine;
    await engine.deployed();
    console.log("Engine deployed to:", engine.address);

    await (await engine.transferOwnership(timelock.address)).wait();
    console.log('Transferred Engine to Timelock');

    // normally we'd do this, but we want ability to mint whenever easily for testing
    // await (await baseToken.transferOwnership(engine.address)).wait();
    // console.log('Transferred baseToken to Engine');


    const Governor = await ethers.getContractFactory(
      "GovernorV1"
    );
    governor = await Governor.deploy(
      baseToken.address,
      timelock.address,
     ) as Governor;
    await governor.deployed();
    console.log("Governor deployed to:", engine.address);

    await (await timelock.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")), governor.address)).wait();
    console.log('Timelock: Governor granted PROPOSER_ROLE');

    await (await timelock.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")), governor.address)).wait();
    console.log('Timelock: Governor granted EXECUTOR_ROLE');

    const timelockMinDelay = 60*60*24*3;
    await (await timelock.schedule(
      timelock.address,
      0, // value
      Timelock.interface.encodeFunctionData('updateDelay', [
        timelockMinDelay,
      ]),
      ethers.constants.HashZero, // predecessor
      ethers.constants.HashZero, // salt
      0, // delay
    )).wait()
    await (await timelock.execute(
      timelock.address,
      0, // value
      Timelock.interface.encodeFunctionData('updateDelay', [
        timelockMinDelay,
      ]),
      ethers.constants.HashZero, // predecessor
      ethers.constants.HashZero, // salt
    )).wait()
    console.log('Timelock: Minimum delay updated');

    await (await timelock.renounceRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")),
      deployer.address,
    )).wait();
    console.log('Timelock: deployer renounced PROPOSER_ROLE');

    await (await timelock.renounceRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")),
      deployer.address,
    )).wait();
    console.log('Timelock: deployer renounced TIMELOCK_ADMIN_ROLE');

  });

  describe("vote", () => {
    it("successful treasury vote", async () => {
      await (await baseToken.bridgeMint(await user1.getAddress(), ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to user1');

      await (await baseToken.bridgeMint(timelock.address, ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to timelock');

      await (await baseToken.connect(user1).delegate(await user1.getAddress())).wait();
      console.log('Delegated voting power user1 -> user1');
  

      const proposalDescription = "Proposal #1: Give grant to team";
      const descriptionHash = ethers.utils.id(proposalDescription);

      const transferCalldata = baseToken.interface.encodeFunctionData('transfer', [
        await user1.getAddress(),
        ethers.utils.parseEther("1.0"),
      ]);

      await (await governor.connect(user1)['propose(address[],uint256[],bytes[],string)'](
        [baseToken.address],
        [0],
        [transferCalldata],
        proposalDescription,
      )).wait();
      console.log('Proposal submitted');

      const proposalId = await governor.hashProposal(
        [baseToken.address],
        [0],
        [transferCalldata],
        descriptionHash,
      );

      // wait 1 day
      await network.provider.send("hardhat_mine", ["0x19af"]); // 6575

      // 0 = Against, 1 = For, 2 = Abstain,
      await (await governor.connect(user1).castVote(proposalId, 1)).wait();
      console.log('Vote cast');

      // wait 1 week
      await network.provider.send("hardhat_mine", ["0xb3cb"]); // 46027

      // for timelock
      await (await governor.connect(user1)['queue(address[],uint256[],bytes[],bytes32)'](
        [baseToken.address],
        [0],
        [transferCalldata],
        descriptionHash,
      )).wait();
      console.log('Queue transaction');

      // wait minimum 10 seconds for delay in timelock...
      await network.provider.send("evm_increaseTime", [260000])
      await network.provider.send("evm_mine");

      await (await governor.connect(user1)['execute(address[],uint256[],bytes[],bytes32)'](
        [baseToken.address],
        [0],
        [transferCalldata],
        descriptionHash,
      )).wait();
      console.log('Executed transaction');

      expect(await baseToken.balanceOf(timelock.address)).to.equal(ethers.utils.parseEther('0.0'));
      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('2.0'));
    });

    it("successful setSolutionMineableRate", async () => {
      await (await baseToken.bridgeMint(await user1.getAddress(), ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to user1');

      await (await baseToken.bridgeMint(timelock.address, ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to timelock');

      await (await baseToken.connect(user1).delegate(await user1.getAddress())).wait();
      console.log('Delegated voting power user1 -> user1');
  
      const modelParams = {
        addr: await user1.getAddress(), // doesnt matter, just need address
        fee: BigNumber.from("0"),
        cid: TESTCID,
        rate: ethers.utils.parseEther('0'),
      };
      const modelid = await engine.hashModel(modelParams, await user1.getAddress());
      await (await engine
        .connect(user1)
        .registerModel(modelParams.addr, modelParams.fee, TESTBUF)
      ).wait();
      console.log('Model registered');

      const proposalDescription = "Proposal #1: setSolutionMineableRate model_1";
      const descriptionHash = ethers.utils.id(proposalDescription);

      const setSolutionMineableRateCalldata = engine.interface.encodeFunctionData('setSolutionMineableRate', [
        modelid,
        1
      ]);

      await (await governor.connect(user1)['propose(address[],uint256[],bytes[],string)'](
        [engine.address],
        [0],
        [setSolutionMineableRateCalldata],
        proposalDescription,
      )).wait();
      console.log('Proposal submitted');

      const proposalId = await governor.hashProposal(
        [engine.address],
        [0],
        [setSolutionMineableRateCalldata],
        descriptionHash,
      );

      // wait 1 day
      await network.provider.send("hardhat_mine", ["0x19af"]); // 6575

      // 0 = Against, 1 = For, 2 = Abstain,
      await (await governor.connect(user1).castVote(proposalId, 1)).wait();
      console.log('Vote cast');

      // wait 1 week
      await network.provider.send("hardhat_mine", ["0xb3cb"]); // 46027

      // for timelock
      await (await governor.connect(user1)['queue(address[],uint256[],bytes[],bytes32)'](
        [engine.address],
        [0],
        [setSolutionMineableRateCalldata],
        descriptionHash,
      )).wait();
      console.log('Queue transaction');

      // wait minimum 10 seconds for delay in timelock...
      await network.provider.send("evm_increaseTime", [260000])
      await network.provider.send("evm_mine");

      await (await governor.connect(user1)['execute(address[],uint256[],bytes[],bytes32)'](
        [engine.address],
        [0],
        [setSolutionMineableRateCalldata],
        descriptionHash,
      )).wait();
      console.log('Executed transaction');

      expect((await engine.models(modelid)).rate).to.equal(1);
    });

    it("failed treasury vote", async () => {
      await (await baseToken.bridgeMint(await user1.getAddress(), ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to user1');
      await (await baseToken.connect(user1).delegate(await user1.getAddress())).wait();
      console.log('Delegated voting power user1 -> user1');

      await (await baseToken.bridgeMint(await user2.getAddress(), ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to user2');
      await (await baseToken.connect(user2).delegate(await user2.getAddress())).wait();
      console.log('Delegated voting power user2 -> user2');

      await (await baseToken.bridgeMint(timelock.address, ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to timelock');


      const proposalDescription = "Proposal #1: Give grant to team";
      const descriptionHash = ethers.utils.id(proposalDescription);

      const transferCalldata = baseToken.interface.encodeFunctionData('transfer', [
        await user1.getAddress(),
        ethers.utils.parseEther("1.0"),
      ]);

      await (await governor.connect(user1)['propose(address[],uint256[],bytes[],string)'](
        [baseToken.address],
        [0],
        [transferCalldata],
        proposalDescription,
      )).wait();
      console.log('Proposal submitted');

      const proposalId = await governor.hashProposal(
        [baseToken.address],
        [0],
        [transferCalldata],
        descriptionHash,
      );

      // wait 1 day
      await network.provider.send("hardhat_mine", ["0x19af"]); // 6575

      // 0 = Against, 1 = For, 2 = Abstain,
      await (await governor.connect(user1).castVote(proposalId, 1)).wait();
      console.log('Vote cast');

      // 0 = Against, 1 = For, 2 = Abstain,
      await (await governor.connect(user2).castVote(proposalId, 0)).wait();
      console.log('Vote cast');

      // wait 1 week
      await network.provider.send("hardhat_mine", ["0xb3cb"]); // 46027

      await expect(
        governor
        .connect(user1)
        ['queue(address[],uint256[],bytes[],bytes32)'](
          [baseToken.address],
          [0],
          [transferCalldata],
          descriptionHash,
       )
      ).to.be.revertedWith('Governor: proposal not successful');
    });

    it("must wait at least 1 day", async () => {
      await (await baseToken.bridgeMint(await user1.getAddress(), ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to user1');

      await (await baseToken.bridgeMint(timelock.address, ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to timelock');

      await (await baseToken.connect(user1).delegate(await user1.getAddress())).wait();
      console.log('Delegated voting power user1 -> user1');
  

      const proposalDescription = "Proposal #1: Give grant to team";
      const descriptionHash = ethers.utils.id(proposalDescription);

      const transferCalldata = baseToken.interface.encodeFunctionData('transfer', [
        await user1.getAddress(),
        ethers.utils.parseEther("1.0"),
      ]);

      await (await governor.connect(user1)['propose(address[],uint256[],bytes[],string)'](
        [baseToken.address],
        [0],
        [transferCalldata],
        proposalDescription,
      )).wait();
      console.log('Proposal submitted');

      const proposalId = await governor.hashProposal(
        [baseToken.address],
        [0],
        [transferCalldata],
        descriptionHash,
      );

      // do not wait 1 day
      // await network.provider.send("hardhat_mine", ["0x19af"]); // 6575

      await expect(
        governor
        .connect(user1)
        .castVote(proposalId, 1)
      ).to.be.revertedWith('Governor: vote not currently active');
    });


    it("must wait at least 1 week", async () => {
      await (await baseToken.bridgeMint(await user1.getAddress(), ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to user1');

      await (await baseToken.bridgeMint(timelock.address, ethers.utils.parseEther('1.0'))).wait();
      console.log('Minted 1 token to timelock');

      await (await baseToken.connect(user1).delegate(await user1.getAddress())).wait();
      console.log('Delegated voting power user1 -> user1');
  

      const proposalDescription = "Proposal #1: Give grant to team";
      const descriptionHash = ethers.utils.id(proposalDescription);

      const transferCalldata = baseToken.interface.encodeFunctionData('transfer', [
        await user1.getAddress(),
        ethers.utils.parseEther("1.0"),
      ]);

      await (await governor.connect(user1)['propose(address[],uint256[],bytes[],string)'](
        [baseToken.address],
        [0],
        [transferCalldata],
        proposalDescription,
      )).wait();
      console.log('Proposal submitted');

      const proposalId = await governor.hashProposal(
        [baseToken.address],
        [0],
        [transferCalldata],
        descriptionHash,
      );

      // wait 1 day
      await network.provider.send("hardhat_mine", ["0x19af"]); // 6575

      // 0 = Against, 1 = For, 2 = Abstain,
      await (await governor.connect(user1).castVote(proposalId, 1)).wait();
      console.log('Vote cast');

      // do not wait 1 week
      // await network.provider.send("hardhat_mine", ["0xb3cb"]); // 46027

      // for timelock
      await expect(
        governor
        .connect(user1)
        ['queue(address[],uint256[],bytes[],bytes32)'](
          [baseToken.address],
          [0],
          [transferCalldata],
          descriptionHash,
       )
      ).to.be.revertedWith('Governor: proposal not successful');
    });
  });
});
