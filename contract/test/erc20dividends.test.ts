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

  // to owner address
  await (await stakingToken.mint(ethers.utils.parseEther('1000000000'))).wait();

  const e = (await upgrades.deployProxy(ERC20Dividends, [
    'NAME',
    'SYMBOL',
    stakingToken.address,
    rewardToken.address,
  ])) as ERC20Dividends;
  await e.deployed();

  await (await stakingToken.approve(e.address, ethers.constants.MaxUint256)).wait();
  await (await e.stake(ethers.utils.parseEther('1000000000'))).wait();

  return e;
}

describe('Regular ERC20 Tests work', () => {
  it('IMPORTANT TODO: RUN THE STANDARD OPENZEPPELIN TESTS ', async () => {
    expect(true);
  });
});

describe('ERC20Dividends', () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let e: ethers.Contract;
  let stakingToken: GenericTestERC20;
  let rewardToken: GenericTestERC20;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    addr1 = signers[1];
    addr2 = signers[2];
    e = await generateERC20DividendsTokenContract();

    const cf = await ethers.getContractFactory('GenericTestERC20');
    stakingToken = cf.attach(await e.stakingToken());
    rewardToken = cf.attach(await e.rewardToken());
    await (await rewardToken.mint(100000 * 4)).wait();

    // transfer 25% of shares from the owner (who deployed rewardToken and recieved all its supply) to
    // ownerBalance = await e.balanceOf(owner.address);
    // tokenContract.transfer(addr1.address, ownerBalance.mul(3).div(4));
    await (await rewardToken.transfer(e.address, 100000)).wait();

  });

  it('name and symbol are correctly initialized', async () => {
    expect(await e.name()).to.equal('NAME');
    expect(await e.symbol()).to.equal('SYMBOL');
  });

  it('PaymentRelease event when released', async () => {
    const tx = await e.release(100);
    const receipt = await tx.wait();

    let found = false;
    for (let e of receipt.events) {
      if (e.event === 'PaymentReleased') {
        expect(e.args.token).to.equal(rewardToken.address);
        expect(e.args.to).to.equal(owner.address);
        expect(e.args.amount).to.equal(ethers.BigNumber.from(100));
        found = true;
        break;
      }
    }
    expect(found).to.equal(true);
  });

  // transfer these percents of shares and ensure dividends are treated right:
  // (percents are used instead of decimals due to ease of multiplication by a BigNumber)
  //
  // Transferring shares results in dividends from transferred shares being
  // distributed to sender and all shares being withheld from sender and receiver
  /*
  for (const testPct of [50, 49, 51, 25, 80, 99, 0, 1, 100]) {
    it(`transferring shares results in dividends to sender ${testPct}`, async () => {
      const pending = await e.pendingPayment(owner.address);
      const ownerBalance = await e.balanceOf(owner.address);
      const totalSupply = await e.totalSupply();
      const shareFrac = ownerBalance.div(totalSupply);

      await (await e.transfer(addr1.address, ownerBalance.mul(testPct).div(100))).wait();

      expect(await e.pendingPayment(owner.address)).to.equal(0);
      expect(await e.pendingPayment(addr1.address)).to.equal(0);
      expect(await e.withheld(addr1.address)).to.equal(pending.mul(testPct).div(100));
      expect(await e.withheld(owner.address)).to.equal(pending.mul(100 - testPct).div(100));
    });
  }
  */

 /*

  // Selling shares results in dividends from sold shares being distributed
  // to seller and withheld from buyer, even with:
  // * intermediary payment to token contract
  for (const testPct of [49, 50, 51, 30, 99, 0, 1, 100]) {
    it(`selling shares results in dividends to seller and not buyer (with intermediary payment) ${testPct}`, async () => {
      const pending = await e.pendingPayment(owner.address);
      const ownerBalance = await e.balanceOf(owner.address);
      const totalSupply = await e.totalSupply();
      const shareFrac = ownerBalance.div(totalSupply);

      await (await e.transfer(addr1.address, ownerBalance.mul(testPct).div(100))).wait();
      const additionToPool = 100000;
      const shareOfAddition = shareFrac.mul(additionToPool);

      await (await rewardToken.transfer(e.address, additionToPool)).wait();

      expect(await e.pendingPayment(owner.address))
        .to.equal(shareOfAddition.mul(100 - testPct).div(100));
      expect(await e.pendingPayment(addr1.address))
        .to.equal(shareOfAddition.mul(testPct).div(100));

      expect(await e.withheld(owner.address))
        .to.equal(
          (await rewardToken.balanceOf(e.address))
            .mul(await e.balanceOf(owner.address))
            .div(await e.totalSupply())
        );
      // TODO ?
      // expect(await e.withheld(addr1.address)).to.equal(pending.mul(testPct).div(100));
    });
  }


  // Selling shares results in dividends from sold shares being distributed
  // to seller and withheld from buyer, even with:
  // * intermediary payment to token contract
  // * and intermediate selling of shares
  for (const testPct of [49, 50, 51, 30, 99, 1, 100]) {
    for (const testTransferPct of [49, 50, 51, 30, 99, 1, 100]) {
      it(`selling shares results to dividends to seller and not buyer (with intermediary payment and selling of shares) ${testPct} ${testTransferPct}`, async () => {
        const ownerBalance = await e.balanceOf(owner.address), shareFrac = ownerBalance.div(await e.totalSupply());
        await (await e.transfer(addr1.address, ownerBalance.mul(testPct).div(100))).wait();

        const additionToPool = 100000, shareOfAddition = shareFrac.mul(additionToPool);
        await (await rewardToken.transfer(e.address, additionToPool)).wait();

        await (
          await e.connect(addr1)
            .transfer(addr2.address, (await e.balanceOf(addr1.address)).mul(testTransferPct).div(100))
        ).wait();

        expect(await rewardToken.balanceOf(addr1.address)).to.equal(shareOfAddition.mul(testPct).div(100));
        expect(await e.pendingPayment(addr1.address)).to.equal(0);
        expect(await e.pendingPayment(addr2.address)).to.equal(0);

        await (await rewardToken.transfer(e.address, additionToPool)).wait();

        expect(await e.pendingPayment(addr1.address)).to.equal(shareOfAddition.mul(testPct).div(100).mul(100 - testTransferPct).div(100));
        expect(await e.pendingPayment(addr2.address)).to.equal(shareOfAddition.mul(testPct).div(100).mul(      testTransferPct).div(100));
      });
    }
  }


  // May take a while going through edge cases:
  // Selling shares results in dividends from sold shares being distributed
  // to seller and withheld from buyer,
  // even with:
  // * intermediary payment to token contract,
  // * intermediate selling of shares,
  // * and intermediate releasing
  for (const testPct of [49, 50, 51, 30, 99, 1, 100]) {
    for (const testTransferPct of [49, 50, 51, 30, 99, 1, 100]) {
      for (const releasePct of [49, 50, 51, 30, 99, 1, 100]) {
        it(`selling shares results to dividends to seller and not buyer (with intermediary payment and selling of shares and intermediate releasing) ${testPct} ${testTransferPct} ${releasePct}`, async () => {
          const ownerBalance = await e.balanceOf(owner.address);
          const shareFrac = ownerBalance.div(await e.totalSupply());
          await (await e.transfer(addr1.address, ownerBalance.mul(testPct).div(100))).wait();

          const additionToPool = 100000;
          const shareOfAddition = shareFrac.mul(additionToPool);
          await (await rewardToken.transfer(e.address, additionToPool)).wait();

          const pending = await e.pendingPayment(owner.address);
          await (await e.release(pending.mul(releasePct).div(100))).wait();

          expect(await e.pendingPayment(owner.address))
            .to.equal(pending.mul(shareFrac).mul(100 - releasePct).div(100));

          await e.connect(addr1)
            .transfer(addr2.address,
                      (await e.balanceOf(addr1.address)).mul(testTransferPct).div(100)
          );

          expect(await rewardToken.balanceOf(addr1.address))
            .to.equal(shareOfAddition.mul(testPct).div(100));

          expect(await e.pendingPayment(addr1.address)).to.equal(0);
          expect(await e.pendingPayment(addr2.address)).to.equal(0);

          await (await rewardToken.transfer(e.address, additionToPool)).wait();

          expect(await e.pendingPayment(addr1.address))
            .to.equal(shareOfAddition.mul(testPct).div(100).mul(100 - testTransferPct).div(100));

          expect(await e.pendingPayment(addr2.address))
            .to.equal(shareOfAddition.mul(testPct).div(100).mul(      testTransferPct).div(100));
        });
      }
    }
  }
  */
});
