import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { ERC20DividendsV1 as ERC20Dividends } from "../typechain/ERC20DividendsV1";
import { GenericTestERC20 } from "../typechain/GenericTestERC20";

//mints full supply to owner
async function generateGenericTokenContract() {
  const GenericTestERC20 = await ethers.getContractFactory('GenericTestERC20');
  const token = await GenericTestERC20.deploy();
  await token.deployed();
  return token;
}

async function generateERC20DividendsTokenContract() {
  const ERC20Dividends = await ethers.getContractFactory('ERC20DividendsV1');

  const stakingToken = await generateGenericTokenContract();
  const rewardToken = await generateGenericTokenContract();

  const e = (await upgrades.deployProxy(ERC20Dividends, [
    'NAME',
    'SYMBOL',
    stakingToken.address,
    rewardToken.address,
  ])) as ERC20Dividends;
  await e.deployed();

  return e;
}


describe('ERC20Dividends Specific', () => {
  let signers: SignerWithAddress[];
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let e: ethers.Contract;
  let stakingToken: GenericTestERC20;
  let rewardToken: GenericTestERC20;

  async function showpending() {
    console.log('total rewards: ', ethers.utils.formatEther(await rewardToken.balanceOf(e.address)));
    console.log('total released: ', ethers.utils.formatEther(await e.totalReleased()));
    console.log('pending: ');

    for (let i=0; i<3; ++i) {
      const user    = signers[i];
      const pending = ethers.utils.formatEther(await e.pendingPayment(user.address));
      console.log(i, pending);
    }
    console.log('lastTotalReceived: ');
    for (let i=0; i<3; ++i) {
      const user    = signers[i];
      const lastTotalReceived = ethers.utils.formatEther(await e.lastTotalReceived(user.address));
      console.log(i, lastTotalReceived);
    }
  }

  beforeEach(async () => {
    signers = await ethers.getSigners();
    addr1 = signers[0];
    addr2 = signers[1];
    addr3 = signers[2];
    e = await generateERC20DividendsTokenContract();

    const cf = await ethers.getContractFactory('GenericTestERC20');
    stakingToken = cf.attach(await e.stakingToken());
    rewardToken = cf.attach(await e.rewardToken());

    for (let i=0; i<3; ++i) {
      await (await stakingToken.connect(signers[i])
        .approve(e.address, ethers.constants.MaxUint256)
      ).wait();
    }
  });

  it(`something`, async () => {
    const a = ethers.utils.parseEther('1');

    // first we have users stake lp
    for (let i=0; i<3; ++i) {
      const user = signers[i];
      await (await stakingToken.connect(user).mint(a)).wait();
      await (await e.connect(user).stake(a)).wait();
    }

    // then we deposit reward tokens
    await (await rewardToken.mint(ethers.utils.parseEther('100'))).wait();
    await (await rewardToken.transfer(e.address, ethers.utils.parseEther('100'))).wait();


    await showpending();

    // 0 unstakes
    await (await e.connect(signers[0]).unstake(a)).wait();

    await showpending();

    // add another 100 reward tokens to pool
    await (await rewardToken.mint(ethers.utils.parseEther('100'))).wait();
    await (await rewardToken.transfer(e.address, ethers.utils.parseEther('100'))).wait();

    await showpending();


    // 1 unstakes
    await (await e.connect(signers[1]).unstake(a)).wait();

    await showpending();


    // have 0 and 1 restake
    await (await e.connect(signers[0]).stake(a)).wait();
    await (await e.connect(signers[1]).stake(a)).wait();

    await showpending();
  });
});
