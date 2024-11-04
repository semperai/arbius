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
  ModelTokenV1,
  ModelTokenV1__factory,

  ModelTokenSwapReceiver,
  ModelTokenSwapReceiver__factory,

  BaseTokenV1,
  BaseTokenV1__factory,

  V2EngineV1,
  V2EngineV1__factory,

  V2EngineV4,
  V2EngineV4__factory,
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
  let arbiusTreasury: SignerWithAddress;
  let arbiustoken: BaseTokenV1;
  let engine: V2EngineV4;
  let modeltoken: ModelTokenV1;
  let modeltokenswapreceiver: ModelTokenSwapReceiver;
  let factory: IUniswapV2Factory;
  let router: IUniswapV2Router02;
  let usdtoken: BaseTokenV1;


  beforeEach(async () => {
    [signer, nonowner, treasury, arbiusTreasury] = await ethers.getSigners();

    ({ factory, router } = await UniswapV2Deployer.deploy(signer));

    const baseTokenFactory = (await ethers.getContractFactory(
      "BaseTokenV1",
      signer,
    )) as BaseTokenV1__factory;

    const v1engineFactory = (await ethers.getContractFactory(
      "V2_EngineV1",
      signer,
    )) as V2EngineV1__factory;
    const v4engineFactory = (await ethers.getContractFactory(
      "V2_EngineV4",
      signer,
    )) as V2EngineV4__factory;

    const modelTokenFactory = (await ethers.getContractFactory(
      "ModelTokenV1",
      signer
    )) as ModelTokenV1__factory;

    const modelTokenSwapReceiverFactory = (await ethers.getContractFactory(
      "ModelTokenSwapReceiver",
      signer
    )) as ModelTokenSwapReceiver__factory;

    arbiustoken = (await upgrades.deployProxy(baseTokenFactory, [
      await signer.getAddress(), // gateway/minter
      constants.AddressZero,
    ])) as BaseTokenV1;
    await arbiustoken.deployed();
    await arbiustoken.bridgeMint(signer.address, eth(1_000 + 100 + 10));

    usdtoken = (await upgrades.deployProxy(baseTokenFactory, [
      await signer.getAddress(), // gateway/minter
      constants.AddressZero,
    ])) as BaseTokenV1;
    await usdtoken.deployed();
    await usdtoken.bridgeMint(signer.address, eth(10000));

    const v1engine = (await upgrades.deployProxy(v1engineFactory, [
      arbiustoken.address,
      arbiusTreasury.address,
    ])) as V2EngineV1;
    await v1engine.deployed();
      
    engine = await upgrades.upgradeProxy(v1engine.address, v4engineFactory) as V2EngineV4;

    modeltoken = await modelTokenFactory.deploy(
      "llama",
      "LLAMA",
      eth(1_000 + 10),
      treasury.address,
      engine.address,
      arbiustoken.address,
      arbiusTreasury.address,
      router.address,
    );
    await modeltoken.deployed();

    modeltokenswapreceiver = await modelTokenSwapReceiverFactory.deploy();
    await modeltokenswapreceiver.deployed();

    // this needs to be done after deploy to allow for proper swapping
    await modeltokenswapreceiver.transferOwnership(modeltoken.address);
    await modeltoken.setSwapReceiver(modeltokenswapreceiver.address);

    // approve router for spending tokens
    await arbiustoken.approve(router.address, constants.MaxUint256);
    await modeltoken.approve(router.address, constants.MaxUint256);

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

    // make aius/model pair
    await router.addLiquidity(
      modeltoken.address,
      arbiustoken.address,
      eth(10),
      eth(10),
      0,
      0,
      signer.address,
      constants.MaxUint256
    );
  });

  async function deploy_model() {
    const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
    const TESTBUF = '0x746573740a';

    const addr = modeltoken.address;
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

  it("enable tax", async () => {
    expect(await modeltoken.taxEnabled()).to.equal(false);
    await expect(modeltoken.enableTax()).to.emit(modeltoken, "TaxEnabled");
    expect(await modeltoken.taxEnabled()).to.equal(true);
  });

  it("cant enable taxes twice", async () => {
    expect(await modeltoken.taxEnabled()).to.equal(false);
    await modeltoken.enableTax();
    await expect(modeltoken.enableTax()).to.be.revertedWith("ModelTokenV1: tax already enabled");
  });

  it("cant enable taxes as non-owner", async () => {
    expect(await modeltoken.taxEnabled()).to.equal(false);
    await expect(modeltoken.connect(nonowner).enableTax()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set public syncing enabled", async () => {
    const modelid = await deploy_model();

    expect(await modeltoken.publicSyncingEnabled(modelid)).to.equal(false);
    await expect(modeltoken.setPublicSyncingEnabled(modelid, true))
      .to.emit(modeltoken, "PublicSyncingEnabled")
      .withArgs(modelid, true);
    expect(await modeltoken.publicSyncingEnabled(modelid)).to.equal(true);
  });

  it("cant set public syncing enabled as non-owner", async () => {
    const modelid = await deploy_model();

    expect(await modeltoken.publicSyncingEnabled(modelid)).to.equal(false);
    await expect(modeltoken.connect(nonowner).setPublicSyncingEnabled(modelid, true)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set pricing token", async () => {
    const modelid = await deploy_model();

    expect(await modeltoken.pricingToken(modelid)).to.equal(constants.AddressZero);
    await expect(modeltoken.setPricingToken(modelid, usdtoken.address))
      .to.emit(modeltoken, "PricingTokenSet")
      .withArgs(modelid, usdtoken.address);
    expect(await modeltoken.pricingToken(modelid)).to.equal(usdtoken.address);
  });

  it("cant set pricing token as non-owner", async () => {
    const modelid = await deploy_model();

    expect(await modeltoken.pricingToken(modelid)).to.equal(constants.AddressZero);
    await expect(modeltoken.connect(nonowner).setPricingToken(modelid, usdtoken.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set target price", async () => {
    const modelid = await deploy_model();

    expect(await modeltoken.targetPrice(modelid)).to.equal(eth(0));
    await expect(modeltoken.setTargetPrice(modelid, eth(0.1)))
      .to.emit(modeltoken, "TargetPriceSet")
      .withArgs(modelid, eth(0.1));
    expect(await modeltoken.targetPrice(modelid)).to.equal(eth(0.1));
  });

  it("cant set target price as non-owner", async () => {
    const modelid = await deploy_model();

    expect(await modeltoken.targetPrice(modelid)).to.equal(eth(0));
    await expect(modeltoken.connect(nonowner).setTargetPrice(modelid, eth(0.1))).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set swap receiver", async () => {
    expect(await modeltoken.swapReceiver()).to.equal(modeltokenswapreceiver.address);
    await expect(modeltoken.setSwapReceiver(constants.AddressZero))
      .to.emit(modeltoken, "SwapReceiverSet")
      .withArgs(constants.AddressZero);
    expect(await modeltoken.swapReceiver()).to.equal(constants.AddressZero);
  });

  it("cant set swap receiver as non-owner", async () => {
    await expect(modeltoken.connect(nonowner).setSwapReceiver(constants.AddressZero)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set reward divisor", async () => {
    expect(await modeltoken.rewardDivisor()).to.equal(eth(10000));
    await expect(modeltoken.setRewardDivisor(eth(50000)))
      .to.emit(modeltoken, "RewardDivisorSet")
      .withArgs(eth(50000));
    expect(await modeltoken.rewardDivisor()).to.equal(eth(50000));
  });

  it("cant set reward divisor as non-owner", async () => {
    await expect(modeltoken.connect(nonowner).setRewardDivisor(eth(50000))).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set tax divisor", async () => {
    expect(await modeltoken.taxDivisor()).to.equal(eth(50));
    await expect(modeltoken.setTaxDivisor(eth(100)))
      .to.emit(modeltoken, "TaxDivisorSet")
      .withArgs(eth(100));
    expect(await modeltoken.taxDivisor()).to.equal(eth(100));
  });

  it("cant set tax divisor as non-owner", async () => {
    await expect(modeltoken.connect(nonowner).setTaxDivisor(eth(100))).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("set liquidity divisor", async () => {
    expect(await modeltoken.liquidityDivisor()).to.equal(eth(2));
    await expect(modeltoken.setLiquidityDivisor(eth(4)))
      .to.emit(modeltoken, "LiquidityDivisorSet")
      .withArgs(eth(4));
    expect(await modeltoken.liquidityDivisor()).to.equal(eth(4));
  });

  it("cant set liquidity divisor as non-owner", async () => {
    await expect(modeltoken.connect(nonowner).setLiquidityDivisor(eth(4))).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("swap with no fee (model -> aius)", async () => {
    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      eth(1),
      0,
      [modeltoken.address, arbiustoken.address],
      signer.address,
      constants.MaxUint256
    );

    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(
      eth(999).toString()
    );
    expect(await (await arbiustoken.balanceOf(signer.address)).toString()).to.equal(
      utils.parseEther("1000.906610893880149131").toString()
    );
  });

  it("transfer with fee", async () => {
    await modeltoken.enableTax();
    expect (await modeltoken.taxEnabled()).to.equal(true);

    expect(await (await modeltoken.balanceOf(await signer.getAddress())).toString()).to.equal(
      eth(1_000).toString()
    );
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(
      eth(0).toString()
    );

    await modeltoken.transfer(signer.address, eth(1));
    
    expect(await (await modeltoken.balanceOf(await signer.getAddress())).toString()).to.equal(
      eth(1_000 - 0.02).toString()
    );
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(
      eth(0.02).toString()
    );

    expect(await (await modeltoken.totalSupply()).toString()).to.equal(
      eth(1_000 + 10).toString()
    );
    expect(await (await arbiustoken.totalSupply()).toString()).to.equal(
      eth(1_000 + 100 + 10).toString()
    );
  });

  it("swap with fee (model -> aius)", async () => {
    await modeltoken.enableTax();

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      eth(1),
      0,
      [modeltoken.address, arbiustoken.address],
      signer.address,
      constants.MaxUint256
    );

    // collected tax
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(
      eth(0.02).toString(),
    );

    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(
      eth(999).toString(),
    );
    expect(await (await arbiustoken.balanceOf(signer.address)).toString()).to.equal(
      utils.parseEther("1000.890092611318513335").toString(),
    );
  });

  it("swap with fee (aius -> model)", async () => {
    await modeltoken.enableTax();

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      eth(1),
      0,
      [arbiustoken.address, modeltoken.address],
      signer.address,
      constants.MaxUint256
    );

    // collected tax
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(
      utils.parseEther("0.018132217877602982").toString(),
    );

    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(
      utils.parseEther("1000.888478676002546149").toString(),
    );
    expect(await (await arbiustoken.balanceOf(signer.address)).toString()).to.equal(
      eth(999).toString(),
    );
  });

  it("cant liquidate without tax enabled", async () => {
    expect(await modeltoken.taxEnabled()).to.equal(false);

    await expect(modeltoken.liquidate()).to.be.revertedWith("ModelTokenV1: tax not enabled");
  });

  it("liquidate after transfer", async () => {
    await modeltoken.enableTax();

    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(1_000).toString());
    expect(await (await modeltoken.balanceOf(nonowner.address)).toString()).to.equal(eth(0).toString());
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());

    

    await modeltoken.transfer(nonowner.address, eth(1));


    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(999).toString());
    expect(await (await modeltoken.balanceOf(nonowner.address)).toString()).to.equal(eth(0.98).toString());
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0.02).toString());



    const pair = IUniswapV2Pair__factory.connect(
      await factory.getPair(modeltoken.address, arbiustoken.address),
      signer
    );

    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(eth(10).toString());
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(eth(10).toString());


    await modeltoken.liquidate();

    // check signer receive reward
    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(999 + 0.000002).toString());

    // check treasury receive eth
    expect(await (await ethers.provider.getBalance(treasury.address)).toString()).to.equal(utils.parseEther("10000.000099307096988833").toString());



    // check pair balances

    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(utils.parseEther("10.019998").toString());
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(utils.parseEther("9.990038419271033077").toString());


    // check contract balance
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());
    expect(await (await arbiustoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());

  });

  it("liquidate after transfer with reward divisor set to max", async () => {
    await modeltoken.enableTax();

    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(1_000).toString());
    expect(await (await modeltoken.balanceOf(nonowner.address)).toString()).to.equal(eth(0).toString());
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());

    
    await modeltoken.setRewardDivisor(constants.MaxUint256);

    await modeltoken.transfer(nonowner.address, eth(1));


    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(999).toString());
    expect(await (await modeltoken.balanceOf(nonowner.address)).toString()).to.equal(eth(0.98).toString());
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0.02).toString());



    const pair = IUniswapV2Pair__factory.connect(
      await factory.getPair(modeltoken.address, arbiustoken.address),
      signer
    );

    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(eth(10).toString());
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(eth(10).toString());


    await modeltoken.liquidate();

    // check signer did not receive reward
    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(999).toString());

    // check pair balances

    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(utils.parseEther("10.02").toString());
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(utils.parseEther("9.990037425246899869").toString());


    // check contract balance
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());
    expect(await (await arbiustoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());

  });

  it("liquidate after transfer with reward and tax divisor set to max", async () => {
    await modeltoken.enableTax();

    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(1_000).toString());
    expect(await (await modeltoken.balanceOf(nonowner.address)).toString()).to.equal(eth(0).toString());
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());

    
    await modeltoken.setRewardDivisor(constants.MaxUint256);
    await modeltoken.setTaxDivisor(constants.MaxUint256);

    await modeltoken.transfer(nonowner.address, eth(1));


    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(999).toString());
    expect(await (await modeltoken.balanceOf(nonowner.address)).toString()).to.equal(eth(1).toString());
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());



    const pair = IUniswapV2Pair__factory.connect(
      await factory.getPair(modeltoken.address, arbiustoken.address),
      signer
    );

    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(eth(10).toString());
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(eth(10).toString());


    await modeltoken.liquidate();

    // check signer did not receive reward
    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(eth(999).toString());

    // check pair balances

    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(utils.parseEther("10").toString());
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(utils.parseEther("10").toString());


    // check contract balance
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());
    expect(await (await arbiustoken.balanceOf(modeltoken.address)).toString()).to.equal(eth(0).toString());

  });

  it("liquidate after swap (aius -> model)", async () => {
    await modeltoken.enableTax();

    const pair = IUniswapV2Pair__factory.connect(
      await factory.getPair(modeltoken.address, arbiustoken.address),
      signer
    );

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      eth(1),
      0,
      [arbiustoken.address, modeltoken.address],
      signer.address,
      constants.MaxUint256
    );

    // check that pair totalsupply is 1 prior to liquidation
    expect((await pair.totalSupply()).toString()).equal(
      eth(10).toString(),
    );

    // check that zero address has no pair balance
    expect(await (await pair.balanceOf(constants.AddressZero)).toString()).to.equal(
      "1000", // uniswap minimum for 0x0
    );


    // check pair balance of modeltoken prior to liquidation
    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(
utils.parseEther("9.093389106119850869").toString(),
    );
    // check pair balance of arbiustoken prior to liquidation
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(
eth(11).toString(),
    );

    const preBalance = await ethers.provider.getBalance(treasury.address);
    // Liquidate!
    await modeltoken.liquidate();
    const postBalance = await ethers.provider.getBalance(treasury.address);
    // check that we receive reward
    expect(postBalance.sub(preBalance)).to.be.gt(eth(0.0001));
    expect(postBalance.sub(preBalance)).to.be.lt(eth(0.0002));

    // check that we receive reward
    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(
utils.parseEther("1000.888480489224333909").toString(),
    );

    // check that all of the modeltokens balance used during liquidate
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(
      eth(0).toString(),
    );

    // check that pair totalsupply increased after liquidation
    expect((await pair.totalSupply()).toString()).equal(
      utils.parseEther("10.004969547995499998").toString(),
    );

    // check that zero address has pair balance now
    expect(await (await pair.balanceOf(constants.AddressZero)).toString()).to.equal(
      utils.parseEther("0.004969547995500998").toString(),
    );

    // check pair balance of modeltoken after liquidation
    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(
      utils.parseEther("9.111519510775666091").toString(),
    );

    // check pair balance of arbiustoken after liquidation
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(
      utils.parseEther("10.989075060942247561").toString(),
    );

  });

  it("liquidate after swap (model -> aius)", async () => {
    await modeltoken.enableTax();

    const pair = IUniswapV2Pair__factory.connect(
      await factory.getPair(modeltoken.address, arbiustoken.address),
      signer
    );

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      eth(1),
      0,
      [modeltoken.address, arbiustoken.address],
      signer.address,
      constants.MaxUint256
    );

    // check that pair totalsupply is 1 prior to liquidation
    expect((await pair.totalSupply()).toString()).equal(
      eth(10).toString(),
    );

    // check that zero address has no pair balance
    expect(await (await pair.balanceOf(constants.AddressZero)).toString()).to.equal(
      "1000", // uniswap minimum for 0x0
    );


    // check pair balance of modeltoken prior to liquidation
    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(
      eth(11 - 0.02).toString(),
    );
    // check pair balance of arbiustoken prior to liquidation
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(
      utils.parseEther("9.109907388681486665").toString(),
    );

    // Liquidate!
    await modeltoken.liquidate();

    // check that we receive reward
    expect(await (await modeltoken.balanceOf(signer.address)).toString()).to.equal(
      eth(999 + 0.000002).toString(),
    );

    // check that all of the modeltokens balance used during liquidate
    expect(await (await modeltoken.balanceOf(modeltoken.address)).toString()).to.equal(
      eth(0).toString(),
    );

    // check that pair totalsupply increased after liquidation
    expect((await pair.totalSupply()).toString()).equal(
      utils.parseEther("10.004539618852459015").toString(),
    );

    // check that zero address has pair balance now
    expect(await (await pair.balanceOf(constants.AddressZero)).toString()).to.equal(
      utils.parseEther("0.004539618852460015").toString(),
    );

    // check pair balance of modeltoken after liquidation
    expect(await (await modeltoken.balanceOf(pair.address)).toString()).to.equal(
      eth(11 - 0.000002).toString(),
    );

    // check pair balance of arbiustoken after liquidation
    expect(await (await arbiustoken.balanceOf(pair.address)).toString()).to.equal(
      utils.parseEther("9.101640791382234160").toString(),
    );

  });

  it("withdraw arbius", async () => {
    expect(await (await arbiustoken.balanceOf(arbiusTreasury.address)).toString()).to.equal(
      eth(0).toString(),
    );

    // send arbius to modeltoken
    await arbiustoken.transfer(modeltoken.address, eth(3));

    // just being pedantic for documentation sake :)
    expect(await (await arbiustoken.balanceOf(modeltoken.address)).toString()).to.equal(
      eth(3).toString(),
    );

    // withdraw arbius
    await expect(modeltoken.withdrawArbius())
      .to.emit(modeltoken, "ArbiusWithdrawn")
      .withArgs(signer.address);

    // check that arbius has been withdrawn
    expect(await (await arbiustoken.balanceOf(arbiusTreasury.address)).toString()).to.equal(
      eth(2.9997).toString(),
    );

    // check that we receive reward
    expect(await (await arbiustoken.balanceOf(signer.address)).toString()).to.equal(
    eth(997 + 0.0003).toString(),
    );
  });

  it("set model fee", async () => {
    const modelid = await deploy_model();

    // check fee is 0 (for documentation :) )
    expect(await (await engine.models(modelid)).fee.toString()).to.equal(eth(0).toString());

    await expect(modeltoken.updateModelFee(modelid, eth(0.1)))
      .to.emit(engine, "ModelFeeChanged")
      .withArgs(modelid, eth(0.1));

    // check fee is now 0.1
    expect(await (await engine.models(modelid)).fee.toString()).to.equal(eth(0.1).toString());
  });

  it("set model addr", async () => {
    const modelid = await deploy_model();

    // check address is modeltoken
    expect(await (await engine.models(modelid)).addr).to.equal(modeltoken.address);

    await expect(modeltoken.updateModelAddr(modelid, AddressOne))
      .to.emit(engine, "ModelAddrChanged")
      .withArgs(modelid, AddressOne);

    // check address is now 0x0
    expect(await (await engine.models(modelid)).addr.toString()).to.equal(AddressOne);
  });

  it("cant set model fee on model we dont own", async () => {
    const modelid = await deploy_model();

    await modeltoken.updateModelAddr(modelid, AddressOne);

    await expect(modeltoken.updateModelFee(modelid, eth(2))).to.be.revertedWith("not model owner");
  });

  it("cant set model addr on model we dont own", async () => {
    const modelid = await deploy_model();

    await modeltoken.updateModelAddr(modelid, AddressOne);

    await expect(modeltoken.updateModelAddr(modelid, AddressOne)).to.be.revertedWith("not model owner");
  });

  it("engine owner can set model fee", async () => {
    const modelid = await deploy_model();
    await engine.transferOwnership(nonowner.address);

    expect((await engine.models(modelid)).fee.toString()).to.equal(eth(0).toString());
    await engine.connect(nonowner).setModelFee(modelid, eth(0.1));
    expect((await engine.models(modelid)).fee.toString()).to.equal(eth(0.1).toString());
  });

  it("engine owner can set model addr", async () => {
    const modelid = await deploy_model();
    await engine.transferOwnership(nonowner.address);

    expect((await engine.models(modelid)).addr).to.equal(modeltoken.address);
    await engine.connect(nonowner).setModelAddr(modelid, AddressOne);
    expect((await engine.models(modelid)).addr).to.equal(AddressOne);
  });

  it("non engine owner cant set model fee", async () => {
    const modelid = await deploy_model();
    await expect(engine.connect(nonowner).setModelFee(modelid, eth(0.1))).to.be.revertedWith("not model owner");
  });

  it("non engine owner cant set model addr", async () => {
    const modelid = await deploy_model();
    await expect(engine.connect(nonowner).setModelAddr(modelid, AddressOne)).to.be.revertedWith("not model owner");
  });

  it("engine owner cant set model addr to 0", async () => {
    const modelid = await deploy_model();
    await expect(engine.setModelAddr(modelid, constants.AddressZero)).to.be.revertedWith("address must be non-zero")
  });

    
  it("sync", async () => {
    const modelid = await deploy_model();

    await usdtoken.approve(router.address, constants.MaxUint256);

    // make eth/usd pair
    await router.addLiquidityETH(
      usdtoken.address,
      eth(2500),
      0,
      eth(1),
      signer.address,
      constants.MaxUint256,
      {
        value: eth(1),
      }
    );

    await modeltoken.setPublicSyncingEnabled(modelid, true);
    await modeltoken.setPricingToken(modelid, usdtoken.address);
    await modeltoken.setTargetPrice(modelid, eth(0.1));

    expect((await engine.models(modelid)).fee.toString()).to.equal(eth(0).toString());

    await expect(modeltoken.sync(modelid))
      .to.emit(modeltoken, "Sync")
      .withArgs(modelid, utils.parseEther("0.003972871990444469").toString());

    // since 2500 usd=1eth
    // and 1 aius=25usd
    // and our fee is set to $0.10
    // this value should be about 0.004 in aius
    expect((await engine.models(modelid)).fee.toString()).to.equal(utils.parseEther("0.003972871990444469").toString());
  });

  it("cant sync if public syncing is disabled", async () => {
    const modelid = await deploy_model();
    await modeltoken.setPricingToken(modelid, usdtoken.address);
    await expect(modeltoken.connect(nonowner).sync(modelid)).to.be.revertedWith("ModelTokenV1: public syncing not enabled");
  });

  it("can sync if public syncing disabled by owner", async () => {
    const modelid = await deploy_model();
    await modeltoken.setPricingToken(modelid, usdtoken.address);
    await modeltoken.setPublicSyncingEnabled(modelid, false);
    expect(modeltoken.sync(modelid)).to.not.be.reverted;
  });

  it("cant sync if pricing token is not set", async () => {
    const modelid = await deploy_model();
    await expect(modeltoken.sync(modelid)).to.be.revertedWith("ModelTokenV1: pricing token not set");
  });

});
