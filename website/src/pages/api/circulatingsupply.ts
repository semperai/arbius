import * as fs from 'fs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import Config from '@/config.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ msg: 'method not allowed' });
    return;
  }

  const novaProvider = new ethers.providers.JsonRpcProvider(
    'https://nova.arbitrum.io/rpc'
  );
  const ethProvider = new ethers.providers.JsonRpcProvider(
    'https://eth.llamarpc.com'
  );
  const oneProvider = new ethers.providers.JsonRpcProvider(
    'https://arb1.arbitrum.io/rpc'
  );

  const novaContract = new ethers.Contract(
    Config.v2_baseTokenAddress,
    BaseTokenArtifact.abi,
    novaProvider
  );
  const ethContract = new ethers.Contract(
    Config.v2_baseTokenAddress,
    BaseTokenArtifact.abi,
    ethProvider
  );
  const oneContract = new ethers.Contract(
    Config.baseTokenAddress,
    BaseTokenArtifact.abi,
    oneProvider
  );

  const engineBalanceNova = await novaContract.balanceOf(
    Config.v2_engineAddress
  );
  const engineBalanceOne = await oneContract.balanceOf(Config.engineAddress);
  const converterBalanceEth = await ethContract.balanceOf(
    Config.l1OneToOneAddress
  );
  const converterBalanceNova = await novaContract.balanceOf(
    Config.l2OneToOneAddress
  );
  const daoBalanceEth = await ethContract.balanceOf(
    '0xF20D0ebD8223DfF22cFAf05F0549021525015577'
  );
  const daoBalanceOne = await oneContract.balanceOf(
    '0xF20D0ebD8223DfF22cFAf05F0549021525015577'
  );
  const gysrBalance = await ethContract.balanceOf(
    '0xA8f103eEcfb619358C35F98c9372B31c64d3f4A1'
  );

  const unlocked = ethers.utils
    .parseEther('1000000')
    .sub(engineBalanceNova)
    .sub(engineBalanceOne)
    .sub(converterBalanceEth)
    .sub(converterBalanceNova)
    .sub(daoBalanceEth)
    .sub(daoBalanceOne)
    .sub(gysrBalance);

  try {
    res.status(200).send(ethers.utils.formatEther(unlocked));
  } catch (e) {
    res.status(500);
  }
}
