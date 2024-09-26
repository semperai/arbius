import * as fs from 'fs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers';
import Config from '@/config.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ msg: 'method not allowed' });
    return;
  }

  const novaProvider = new ethers.providers.JsonRpcProvider('https://nova.arbitrum.io/rpc');
  const ethProvider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');

  const novaContract = new ethers.Contract(Config.v2_baseTokenAddress, BaseTokenArtifact.abi, novaProvider);
  const ethContract = new ethers.Contract(Config.v2_baseTokenAddress, BaseTokenArtifact.abi, ethProvider);

  const engineBalance = await novaContract.balanceOf(Config.v2_engineAddress);
  const ethConverterBalance = await ethContract.balanceOf(Config.l1OneToOneAddress);
  const novaConverterBalance = await novaContract.balanceOf(Config.l2OneToOneAddress);
  const daoBalance = await novaContract.balanceOf("0x1298f8a91b046d7fcbd5454cd3331ba6f4fea168");
  const gysrBalance = await ethContract.balanceOf("0xA8f103eEcfb619358C35F98c9372B31c64d3f4A1");

  const unlocked = ethers.utils.parseEther('1000000')
    .sub(engineBalance)
    .sub(ethConverterBalance)
    .sub(novaConverterBalance)
    .sub(daoBalance)
    .sub(gysrBalance)
    .sub(ethers.utils.parseEther('630392'));

  try {
    res.status(200).send(ethers.utils.formatEther(unlocked))
  } catch (e) {
    res.status(500);
  }
}
