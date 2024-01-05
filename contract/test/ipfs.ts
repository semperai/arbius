import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { EngineV1 as Engine } from "../typechain/EngineV1";
import * as fs from 'fs';



describe("IPFS Unit Tests", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer:   SignerWithAddress;
  let treasury:   SignerWithAddress;

  let baseToken: BaseToken;
  let engine: Engine;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];
    treasury   = signers[0];

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );
    baseToken = (await upgrades.deployProxy(BaseToken, [
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    const Engine = await ethers.getContractFactory(
      "EngineV1"
    );
    engine = (await upgrades.deployProxy(Engine, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as Engine;
    await engine.deployed();
  });

  describe("ipfs", () => {
    it("check hashes", async () => {
      const a = '0x'+fs.readFileSync(`${__dirname}/ipfs_a.bin`, 'hex');
      const b = '0x'+fs.readFileSync(`${__dirname}/ipfs_b.bin`, 'hex');
      const c = '0x'+fs.readFileSync(`${__dirname}/ipfs_c.bin`, 'hex');
      const d = '0x'+fs.readFileSync(`${__dirname}/ipfs_d.bin`, 'hex');

      expect(await engine.generateIPFSCID(a)).to.equal("0x1220e844b8764c00d4a76ac03930a3d8f32f3df59aea3ed0ade4c3bc38a3b23a31d9");
      expect(await engine.generateIPFSCID(b)).to.equal("0x1220f782bf27d7dfa16c5556ae0e19d41a73fc380a28455abcedecd70460505f022b");
      expect(await engine.generateIPFSCID(c)).to.equal("0x1220c32cae42b7d6ed6efd2512fd7dac6530cbd96cbcc19a3d1c336ace8e401f1c3a");
      expect(await engine.generateIPFSCID(d)).to.equal("0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8");
    });

    it("register model", async () => {
      const template = '0x'+fs.readFileSync(`${__dirname}/ipfs_d.bin`, 'hex');
      console.log('TEMPLATE', template);

      const addr = await deployer.getAddress();
      const fee = ethers.utils.parseEther('0');

      const expected_cid = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
      const expected_rate = BigNumber.from(0);
      const modelid = await engine.hashModel({
        addr,
        fee,
        cid: expected_cid,
        rate: expected_rate,
      }, await deployer.getAddress());

      await expect(engine
        .connect(deployer)
        .registerModel(addr, fee, template)
      ).to.emit(engine, "ModelRegistered")
      .withArgs(modelid);

      const model = await engine.models(modelid);

      expect(model.addr).to.equal(addr);
      expect(model.fee).to.equal(fee);
      expect(model.cid).to.equal(expected_cid);
      expect(model.rate).to.equal(expected_rate);
    });
  });
});
