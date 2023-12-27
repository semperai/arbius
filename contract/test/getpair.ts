import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { GetPairFor as GetPairForContract } from "../typechain/GetPairFor";
import { ERC20 } from "../typechain/ERC20";

const WETHeth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETHnova = '0x722e8bdd2ce80a4422e880164f2079488e115365';
const USDTeth = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const DAInova = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1';

const SushiswapInitCodeHash = ethers.utils.hexlify('0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303');
const UniswapInitCodeHash   = ethers.utils.hexlify('0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f');

const UniswapFactoryAddressEth = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const SushiswapFactoryAddressEth = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';
const SushiswapFactoryAddressNova = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';

describe("GetPairFor", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;

  let getPairFor: GetPairForContract;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];

    const GetPairFor = await ethers.getContractFactory(
      "GetPairFor"
    );
    getPairFor = await GetPairFor.deploy();
    await getPairFor.deployed();
  });

  describe('test pairs', () => {
    it("eth univ2 weth/usdt pair", async () => {
      expect(
        await getPairFor.pairFor(WETHeth, USDTeth, UniswapFactoryAddressEth, UniswapInitCodeHash)
      ).to.equal('0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852');
    });
    it("eth sushiv2 weth/usdt pair", async () => {
      expect(
        await getPairFor.pairFor(WETHeth, USDTeth, SushiswapFactoryAddressEth, SushiswapInitCodeHash)
      ).to.equal('0x06da0fd433C1A5d7a4faa01111c044910A184553');
    });
    it("nova sushiv2 weth/dai pair", async () => {
      expect(
        await getPairFor.pairFor(WETHnova, DAInova, SushiswapFactoryAddressNova, SushiswapInitCodeHash)
      ).to.equal('0x5c7966CebD4027266bd5163a8aB04331Ade9C78c');
    });
  });
});
