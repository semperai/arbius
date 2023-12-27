import { base58 } from '@scure/base';
import { ethers } from 'ethers'

export function secondsToDhms(seconds: number) {
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor(seconds % (3600*24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  
  const dDisplay = d > 0 ? d + (d == 1 ? " day" : " days") : "";
  const hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
  const mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
  const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

  if (d > 0) return `${dDisplay}, ${hDisplay}`;
  if (h > 0) return `${hDisplay}, ${mDisplay}`;
  if (m > 0) return `${mDisplay}, ${sDisplay}`;

  return sDisplay;
}

export function cidify(cid: string): string {
  if (! cid) {
    return '';
  }
  return base58.encode(ethers.utils.arrayify(cid));
}

export function formatBalance(b: ethers.BigNumber, m: number = 1e14): string {
    if (! b) {
      return '';
    }

    const remainder = b.mod(m);
    return ethers.utils.formatEther(b.sub(remainder));
}

export function sleep(ms: number) {
  return new Promise((res, rej) => setTimeout(res, ms));
}
