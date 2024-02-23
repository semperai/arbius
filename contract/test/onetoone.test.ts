import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { OneToOneConvert } from "../typechain/OneToOneConvert";

describe("One to One", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer:   SignerWithAddress;

  let tokenA: BaseToken;
  let tokenB: BaseToken;
  let oneToOne: OneToOneConvert;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );

    tokenA = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await tokenA.deployed();

    tokenB = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await tokenB.deployed();

    const OneToOneConvert = await ethers.getContractFactory(
      "OneToOneConvert"
    );
    oneToOne = await OneToOneConvert.deploy(tokenA.address, tokenB.address);
    await oneToOne.deployed();
  });

  it("should swap tokens", async () => {
    await (await tokenA.bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("100"))).wait();

    await (await tokenB.bridgeMint(oneToOne.address, ethers.utils.parseEther("150"))).wait();

    await tokenA.approve(oneToOne.address, ethers.utils.parseEther("100"));

    await expect(
      oneToOne.swap(ethers.utils.parseEther("100"))
    ).to.emit(oneToOne, "Swap")
    .withArgs(await deployer.getAddress(), ethers.utils.parseEther("100"));

    expect(await tokenA.balanceOf(await deployer.getAddress())).to.equal(ethers.utils.parseEther("0"));
    // tokena burned
    expect(
      await tokenA.balanceOf("0x0000000000000000000000000000000000000001")
    ).to.equal(ethers.utils.parseEther("100"));

    expect(await tokenB.balanceOf(await deployer.getAddress())).to.equal(ethers.utils.parseEther("100"));
    expect(await tokenB.balanceOf(oneToOne.address)).to.equal(ethers.utils.parseEther("50"));

  });

  it("should fail to swap without enough tokens", async () => {
    await (await tokenA.bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("100"))).wait();

    await (await tokenB.bridgeMint(oneToOne.address, ethers.utils.parseEther("150"))).wait();

    await tokenA.approve(oneToOne.address, ethers.utils.parseEther("150"));

    await expect(
      oneToOne.swap(ethers.utils.parseEther("150"))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    expect(await tokenA.balanceOf(await deployer.getAddress())).to.equal(ethers.utils.parseEther("100"));
    expect(await tokenA.balanceOf("0x0000000000000000000000000000000000000001")).to.equal(ethers.utils.parseEther("0"));

    expect(await tokenB.balanceOf(await deployer.getAddress())).to.equal(ethers.utils.parseEther("0"));
    expect(await tokenB.balanceOf(oneToOne.address)).to.equal(ethers.utils.parseEther("150"));

  });

  it("should fail to swap without enough tokens in bridge", async () => {
    await (await tokenA.bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("100"))).wait();

    await (await tokenB.bridgeMint(oneToOne.address, ethers.utils.parseEther("50"))).wait();

    await tokenA.approve(oneToOne.address, ethers.utils.parseEther("100"));

    await expect(
      oneToOne.swap(ethers.utils.parseEther("100"))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    expect(await tokenA.balanceOf(await deployer.getAddress())).to.equal(ethers.utils.parseEther("100"));
    expect(await tokenA.balanceOf("0x0000000000000000000000000000000000000001")).to.equal(ethers.utils.parseEther("0"));

    expect(await tokenB.balanceOf(await deployer.getAddress())).to.equal(ethers.utils.parseEther("0"));
    expect(await tokenB.balanceOf(oneToOne.address)).to.equal(ethers.utils.parseEther("50"));

  });
});
