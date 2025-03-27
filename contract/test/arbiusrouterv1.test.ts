import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants, utils } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  UniswapV2Deployer,
  IUniswapV2Factory,
  IUniswapV2Pair__factory,
  IUniswapV2Router02,
} from "uniswap-v2-deploy-plugin";
import {
  ArbiusRouterV1,
  ArbiusRouterV1__factory,

  SwapReceiver,
  SwapReceiver__factory,

  BaseTokenV1,
  BaseTokenV1__factory,

  V2_EngineV1,
  V2_EngineV1__factory,

  V2_EngineV5,
  V2_EngineV5__factory,
} from "../typechain";

import { expect } from "./chai-setup";

function eth(n: number) {
  return utils.parseEther(n.toString());
}

const AddressOne = "0x0000000000000000000000000000000000000001";

describe("swap", () => {
  let signer: SignerWithAddress;
  let nonowner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let arbiustoken: BaseTokenV1;
  let engine: V2_EngineV5;
  let arbiusRouter: ArbiusRouterV1;
  let swapreceiver: SwapReceiver;

  let factory: IUniswapV2Factory;
  let router: IUniswapV2Router02;

  let usdtoken: BaseTokenV1;


  beforeEach(async () => {
    [signer, nonowner, treasury] = await ethers.getSigners();

    ({ factory, router } = await UniswapV2Deployer.deploy(signer));

    const baseTokenFactory = (await ethers.getContractFactory(
      "BaseTokenV1",
      signer,
    )) as BaseTokenV1__factory;

    const v1engineFactory = (await ethers.getContractFactory(
      "V2_EngineV1",
      signer,
    )) as V2_EngineV1__factory;

    const v5engineFactory = (await ethers.getContractFactory(
      "V2_EngineV5",
      signer,
    )) as V2_EngineV5__factory;

    const arbiusRouterFactory = (await ethers.getContractFactory(
      "ArbiusRouterV1",
      signer
    )) as ArbiusRouterV1__factory;

    const swapReceiverFactory = (await ethers.getContractFactory(
      "SwapReceiver",
      signer
    )) as SwapReceiver__factory;

    arbiustoken = (await upgrades.deployProxy(baseTokenFactory, [
      await signer.getAddress(), // gateway/minter
      constants.AddressZero,
    ])) as BaseTokenV1;
    await arbiustoken.deployed();
    await arbiustoken.bridgeMint(signer.address, eth(10_000));

    usdtoken = (await upgrades.deployProxy(baseTokenFactory, [
      await signer.getAddress(), // gateway/minter
      constants.AddressZero,
    ])) as BaseTokenV1;
    await usdtoken.deployed();
    await usdtoken.bridgeMint(signer.address, eth(10_000));

    const v1engine = (await upgrades.deployProxy(v1engineFactory, [
      arbiustoken.address,
      treasury.address,
    ])) as V2_EngineV1;
    await v1engine.deployed();
      
    engine = await upgrades.upgradeProxy(v1engine.address, v5engineFactory) as V2_EngineV5;


    swapreceiver = await swapReceiverFactory.deploy();
    await swapreceiver.deployed();

    arbiusRouter = await arbiusRouterFactory.deploy(
      engine.address,
      arbiustoken.address,
      router.address,
      swapreceiver.address,
    );
    await arbiusRouter.deployed();

    // this needs to be done after deploy to allow for proper swapping
    await swapreceiver.transferOwnership(arbiusRouter.address);

    // approve engine for spending tokens
    await arbiustoken.approve(engine.address, constants.MaxUint256);
    // approve router for spending tokens
    await arbiustoken.approve(router.address, constants.MaxUint256);
    await usdtoken.approve(router.address, constants.MaxUint256);
    // and arbiusrouter too
    await arbiustoken.approve(arbiusRouter.address, constants.MaxUint256);
    await usdtoken.approve(arbiusRouter.address, constants.MaxUint256);

    // make aius/eth pair
    await router.addLiquidityETH(
      arbiustoken.address,
      eth(100),
      0,
      eth(1),
      signer.address,
      constants.MaxUint256,
      {
        value: eth(1),
      }
    );

    // make usd/eth pair
    await router.addLiquidityETH(
      usdtoken.address,
      eth(100),
      0,
      eth(1),
      signer.address,
      constants.MaxUint256,
      {
        value: eth(1),
      }
    );

  });

  const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
  const TESTBUF = '0x746573740a';

  function sign(signer: any, hash: string) {
    const digest = ethers.utils.arrayify(hash);
    const skey = new ethers.utils.SigningKey(signer.privateKey);
    const components = skey.signDigest(digest);
    const signature = ethers.utils.joinSignature(components);
    return signature;
  }

  function generateCommitment(address: string, taskid: string, cid:          string): string {
    return utils.keccak256(
      utils.defaultAbiCoder.encode(
        ['address', 'bytes32', 'bytes'],
        [address, taskid, cid]
      )
    );
  }

  async function deploy_model() {
    const addr = treasury.address
    const fee = eth(0);

    const modelid = await engine.hashModel({
      addr,
      fee,
      rate: eth(0),
      cid: TESTCID,
    }, signer.address);

    await (await engine.registerModel(addr, fee, TESTBUF)).wait();
    return modelid;
  }

  it("owner can withdraw usd", async () => {
    const originalBalance = await usdtoken.balanceOf(signer.address);

    usdtoken.bridgeMint(arbiusRouter.address, eth(1000));
    expect(await usdtoken.balanceOf(arbiusRouter.address)).to.eq(eth(1000));
    await (await arbiusRouter.connect(signer).withdraw(usdtoken.address)).wait();
    expect(await usdtoken.balanceOf(arbiusRouter.address)).to.eq(eth(0));
    expect(await usdtoken.balanceOf(signer.address)).to.eq(originalBalance.add(eth(1000)));
  });

  it("non-owner cannot withdraw usd", async () => {
    usdtoken.bridgeMint(arbiusRouter.address, eth(1000));
    await expect(arbiusRouter.connect(nonowner).withdraw(usdtoken.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("owner can withdraw eth", async () => {
    await signer.sendTransaction({
      to: arbiusRouter.address,
      value: eth(1),
    });

    const originalBalance = await ethers.provider.getBalance(signer.address);

    expect(await ethers.provider.getBalance(arbiusRouter.address)).to.eq(eth(1));
    await arbiusRouter.connect(signer).withdrawETH();
    expect(await ethers.provider.getBalance(arbiusRouter.address)).to.eq(eth(0));
    expect(await ethers.provider.getBalance(signer.address)).to.be.gt(originalBalance);
  });

  it("non-owner cannot withdraw eth", async () => {
    await expect(arbiusRouter.connect(nonowner).withdrawETH()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("owner can set validator", async () => {
    await (await arbiusRouter.connect(signer).setValidator(nonowner.address, true)).wait();
    expect(await arbiusRouter.validators(nonowner.address)).to.eq(true);
  });

  it("owner can set and rescind validator", async () => {
    await (await arbiusRouter.connect(signer).setValidator(nonowner.address, true)).wait();
    await (await arbiusRouter.connect(signer).setValidator(nonowner.address, false)).wait();
    expect(await arbiusRouter.validators(nonowner.address)).to.eq(false);
  });

  it("non-owner cannot set validator", async () => {
    await expect(arbiusRouter.connect(nonowner).setValidator(nonowner.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("owner can set min validators", async () => {
    await (await arbiusRouter.connect(signer).setMinValidators(1)).wait();
    expect(await arbiusRouter.minValidators()).to.eq(1);
  });

  it("non-owner cannot set min validators", async () => {
    await expect(arbiusRouter.connect(nonowner).setMinValidators(1)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("submit task function", async () => {
    const modelid = await deploy_model();
    const taskid = await arbiusRouter.submitTask(
      0,
      nonowner.address,
      modelid,
      eth(0),
      TESTBUF,
      eth(0.1),
      1_000_000,
    );

    const taskid_ = await engine.prevhash();
  });

  it("claim incentive", async () => {
    const modelid = await deploy_model();
    const taskid = await arbiusRouter.submitTask(
      0,
      nonowner.address,
      modelid,
      eth(0),
      TESTBUF,
      eth(0.1),
      1_000_000,
    );

    const taskid_ = await engine.prevhash();

    const validatorMinimum = await engine.getValidatorMinimum();

    await engine.validatorDeposit(signer.address, validatorMinimum.add(eth(10)));

    const cid = "0x1220b67cb9e4eb64d2771bb37d9344d51b29a3db0472c4db745350eb18747073c8a8";

    const commitment = generateCommitment(signer.address, taskid_, cid);
    await engine.signalCommitment(commitment);
    await engine.submitSolution(taskid_, cid);

    await arbiusRouter.setMinValidators(1);

    const validator = ethers.Wallet.createRandom();
    await arbiusRouter.setValidator(validator.address, true);

    const hash = ethers.utils.keccak256(utils.arrayify(cid));
    const signature = sign(validator, hash);

    const sigs = [
      {
        signer: validator.address,
        signature,
      },
    ];

    await arbiusRouter.claimIncentive(taskid_, sigs);
  });

  it("submitTaskWithToken", async () => {
    const modelid = await deploy_model();
    await arbiusRouter.uniswapApprove(usdtoken.address);
    const taskid = await arbiusRouter.submitTaskWithToken(
      0,
      nonowner.address,
      modelid,
      eth(0),
      TESTBUF,
      eth(0.1),
      usdtoken.address,
      eth(10), // amountinmax
      1_000_000,
    );
  });

  it("submitTaskWithETH", async () => {
    const modelid = await deploy_model();
    // need to send eth to the contract
    const taskid = await arbiusRouter.submitTaskWithETH(
      0,
      nonowner.address,
      modelid,
      eth(0),
      TESTBUF,
      eth(0.1),
      1_000_000,
      {
        value: eth(10),
      }
    );
  });

  it("manual addIncentive", async () => {
    const modelid = await deploy_model();
    await engine.submitTask(0, nonowner.address, modelid, eth(0), TESTBUF);
    const taskid = await engine.prevhash();
    await arbiusRouter.addIncentive(taskid, eth(0.1));
  });

  it("manual addIncentive for non-existent taskid is allowed", async () => {
    const taskid = await engine.prevhash();
    await arbiusRouter.addIncentive(taskid, eth(0.1));
  });

  it("validation single valid sig", async () => {
    const signer = ethers.Wallet.createRandom();
    await arbiusRouter.setValidator(signer.address, true);

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    const signature = sign(signer, hash);

    const sigs = [
      {
        signer: signer.address,
        signature,
      },
    ];

    await arbiusRouter.validateSignatures(hash, sigs);
  });

  it("validation fails without sufficient signatures", async () => {
    await arbiusRouter.setMinValidators(1);

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));

    await expect(arbiusRouter.validateSignatures(hash, [])).to.be.revertedWith("InsufficientSignatures");
  });

  it("validation fails with invalid signature", async () => {
    const signer = ethers.Wallet.createRandom();
    await arbiusRouter.setValidator(signer.address, true);

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    let signature = sign(signer, hash);
    signature = signature.slice(0, -8) + "00000000";

    const sigs = [
      {
        signer: signer.address,
        signature,
      },
    ];

    await expect(arbiusRouter.validateSignatures(hash, sigs)).to.be.revertedWith("ECDSA: invalid signature");
  });

  it("validation fails with wrong signer", async () => {
    const signer = ethers.Wallet.createRandom();
    const signer2 = ethers.Wallet.createRandom();
    await arbiusRouter.setValidator(signer.address, true);

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    const signature = sign(signer, hash);

    const sigs = [
      {
        signer: signer2.address,
        signature,
      },
    ];

    await expect(arbiusRouter.validateSignatures(hash, sigs)).to.be.revertedWith("InvalidValidator");
  });

  it("validation fails with non validator", async () => {
    const signer = ethers.Wallet.createRandom();
    await arbiusRouter.setValidator(signer.address, false);

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    const signature = sign(signer, hash);

    const sigs = [
      {
        signer: signer.address,
        signature,
      },
    ];

    await expect(arbiusRouter.validateSignatures(hash, sigs)).to.be.revertedWith("InvalidValidator");
  });

  it("validation fails with non sorted validators", async () => {
    const signers = [
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
    ].sort((a: any, b: any) => {
      // sort backwards
      if (a.address < b.address) {
        return 1;
      }
      if (a.address > b.address) {
        return -1;
      }
      if (a == b) {
        return 0;
      }
    });

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    let sigs = [];
    for (const signer of signers) {
      await arbiusRouter.setValidator(signer.address, true);

      const signature = sign(signer, hash);

      sigs.push({
        signer: signer.address,
        signature,
      });
    }

    await expect(arbiusRouter.validateSignatures(hash, sigs)).to.be.revertedWith("SignersNotSorted");
  });

  it("validation passes with sorted validators", async () => {
    const signers = [
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
      ethers.Wallet.createRandom(),
    ].sort((a: any, b: any) => {
      // sort backwards
      if (a.address < b.address) {
        return -1;
      }
      if (a.address > b.address) {
        return 1;
      }
      if (a == b) {
        return 0;
      }
    });

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    let sigs = [];
    for (const signer of signers) {
      await arbiusRouter.setValidator(signer.address, true);

      const signature = sign(signer, hash);

      sigs.push({
        signer: signer.address,
        signature,
      });
    }

    await arbiusRouter.validateSignatures(hash, sigs);
  });

  it("validation fails with duplicate signers", async () => {
    const signer = ethers.Wallet.createRandom();
    const signers = [signer, signer];

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
    let sigs = [];
    for (const signer of signers) {
      await arbiusRouter.setValidator(signer.address, true);

      const signature = sign(signer, hash);

      sigs.push({
        signer: signer.address,
        signature,
      });
    }

    await expect(arbiusRouter.validateSignatures(hash, sigs)).to.be.revertedWith("SignersNotSorted");
  });

  
  it("emergencyClaimIncentive", async () => {
    const modelid = await deploy_model();
    await engine.submitTask(0, nonowner.address, modelid, eth(0), TESTBUF);
    const taskid = await engine.prevhash();
    await arbiusRouter.addIncentive(taskid, eth(0.1));

    const originalBalance = await arbiustoken.balanceOf(signer.address);
    await arbiusRouter.emergencyClaimIncentive(taskid);
    expect(await arbiustoken.balanceOf(signer.address)).to.be.eq(originalBalance.add(eth(0.1)));
  });

  it("non-owner cannot run emergencyClaimIncentive", async () => {
    const modelid = await deploy_model();
    await engine.submitTask(0, nonowner.address, modelid, eth(0), TESTBUF);
    const taskid = await engine.prevhash();
    await arbiusRouter.addIncentive(taskid, eth(0.1));

    await expect(arbiusRouter.connect(nonowner).emergencyClaimIncentive(taskid)).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
