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
  const stakingToken = await generateGenericTokenContract();
  const rewardToken = await generateGenericTokenContract();

  const ERC20Dividends = await ethers.getContractFactory('ERC20DividendsV1');

  const e = (await upgrades.deployProxy(ERC20Dividends, [
    'NAME',
    'SYMBOL',
    stakingToken.address,
    rewardToken.address,
  ])) as ERC20Dividends;
  await e.deployed();

  return e;
}

function randomSmallerThan(a: ethers.BigNumber): ethers.BigNumber {
  if (a.eq(ethers.constants.Zero)) {
    return ethers.constants.Zero;
  }
  return ethers.BigNumber.from(ethers.utils.randomBytes(32)).mod(a);
}

describe('ERC20DividendsFuzz', () => {
  let signers: SignerWithAddress[];
  let e: ethers.Contract;
  let stakingToken: GenericTestERC20;
  let rewardToken: GenericTestERC20;

  const RUNS = 200;
  const USERS = 8;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    e = await generateERC20DividendsTokenContract();

    const cf = await ethers.getContractFactory('GenericTestERC20');
    stakingToken = cf.attach(await e.stakingToken());
    rewardToken = cf.attach(await e.rewardToken());

    // give max allowance for each user
    for (let i=0; i<USERS+1; ++i) {
      await (await stakingToken.connect(signers[i])
        .approve(e.address, ethers.constants.MaxUint256)
      ).wait();
    }

    // user 4 never unstakes or does any action until end
    const a = ethers.utils.parseEther('0.001');
    await (await stakingToken.connect(signers[USERS]).mint(a)).wait();
    await (await e.connect(signers[USERS]).stake(a)).wait();
  });

  async function stats() {
    console.log();
    console.log('stats:');
    console.log('total received: ', ethers.utils.formatEther(await e.totalReceived()));
    console.log('total rewards: ', ethers.utils.formatEther(await rewardToken.balanceOf(e.address)));
    // console.log('total released: ', ethers.utils.formatEther(await e.totalReleased()));

    let totalpending = ethers.constants.Zero;

    for (let i=0; i<USERS+1; ++i) {
      const user    = signers[i];
      const pending = await e.pendingPayment(user.address);
      const ebal    = await e.balanceOf(user.address);
      const rbal    = await rewardToken.balanceOf(user.address);

      console.log(
        `${i}\t`
       +`${ethers.utils.formatEther(pending).padEnd(20, '0')}\t`
       +`${ethers.utils.formatEther(ebal).padEnd(20, '0')}\t`
       +`${ethers.utils.formatEther(rbal).padEnd(20, '0')}\t`
      );

      totalpending = totalpending.add(pending);
    }
    console.log('total pending', ethers.utils.formatEther(totalpending));
    console.log();
  }

  for (let i=0; i<1; ++i) {
    it(`fuzz`, async () => {
      let totalRewards = ethers.constants.Zero;
      let avgBal = new Array(USERS+1).fill(ethers.constants.Zero);

      for (let j=0; j<RUNS; ++j) {
        for (let k=0; k<USERS; ++k) {
          avgBal[k] = avgBal[k].add(await e.balanceOf(signers[k].address));
        }

        // half the time we deposit some funds/rewards
        if (Math.random() < 0.5) {
            const a = Math.random() < 0.1
              ? randomSmallerThan(ethers.utils.parseEther('10'))
              : randomSmallerThan(ethers.utils.parseEther('1'));
            await (await rewardToken.mint(a)).wait();
            await (await rewardToken.transfer(e.address, a)).wait();
            totalRewards = totalRewards.add(a);
            console.debug(`deposit ${ethers.utils.formatEther(a)}`);
        }

        await stats();

        // choose random user
        const uidx = Math.random()*USERS|0;
        const user = signers[uidx];
  
        const action = Math.random() < 0.6
            ? 'stake'
            : Math.random() < 0.8 ? 'claim' : 'unstake';

        console.debug(`${uidx} attempting ${action}`);
        if (action === 'stake') {
            const a = randomSmallerThan(ethers.utils.parseEther('1'));
            await (await stakingToken.connect(user).mint(a)).wait();
            await (await e.connect(user).stake(a)).wait();
            console.debug(`stake ${ethers.utils.formatEther(a)}`);
        }
        if (action === 'claim') {
          const urbal1 = await rewardToken.balanceOf(user.address);
          await (await e.connect(user).claim()).wait();
          const urbal2 = await rewardToken.balanceOf(user.address);
          console.debug(`claim ${ethers.utils.formatEther(urbal2.sub(urbal1))}`);
        }
        if (action === 'unstake') {
            const bal = await e.balanceOf(user.address);
            // half the time unstake some %, otherwise unstake entire amount
            let a = bal;
            if (Math.random() < 0.5) {
              a = randomSmallerThan(a);
            }
            const urbal1 = await rewardToken.balanceOf(user.address);
            await (await e.connect(user).unstake(a)).wait();
            const urbal2 = await rewardToken.balanceOf(user.address);
            // urbal shows how much reward they received from unstaking
            console.debug(`unstake ${ethers.utils.formatEther(a)} -- ${ethers.utils.formatEther(urbal2.sub(urbal1))}`);
        }
  
        await stats();
      }

      console.log('UNSTAKE ALL TOKENS');

      let usersRewards = ethers.constants.Zero;
      // now have each user unstake all
      for (let j=0; j<USERS; ++j) { 
        const user = signers[j];
        const bal = await e.balanceOf(user.address);
        console.debug(`${j} unstaking ${ethers.utils.formatEther(bal)}`);
        console.debug(`${j} average bal ${ethers.utils.formatEther(avgBal[j].div(RUNS))}`);
        await (await e.connect(user).unstake(bal)).wait();
        usersRewards = usersRewards.add(await rewardToken.balanceOf(user.address));

        await stats();
      }

      await stats();

      console.log('totalRewards', ethers.utils.formatEther(totalRewards));
      console.log('usersRewards', ethers.utils.formatEther(usersRewards));

      const remainingReward = await rewardToken.balanceOf(e.address);
      console.log('remainingReward', ethers.utils.formatEther(remainingReward));
      console.log('totalRewards', ethers.utils.formatEther(totalRewards));


      // check reward token for all signers is equal to total rewards
      // check remainingReward is 0

      // check totalSupply of e is 0 (since everyone unstaked)
      //
    });
  }
});
