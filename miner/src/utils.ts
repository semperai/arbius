import { ethers, BigNumber } from 'ethers';
import { log } from './log';


export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export function now(): number {
  return Math.floor((+new Date)/1000);
}

// torch.generator().manual_seed allows 2^64-1
// but for easy interop with existing tooling we reduce this
export function taskid2Seed(taskid: string): number {
  // Number.MAX_SAFE_INT-15 to keep things easy
  const m = 0x1FFFFFFFFFFFF0;
  return BigNumber.from(taskid).mod(m).toNumber();
}

export async function expretry<T>(
  fn: () => Promise<T>,
  tries: number = 10,
  base: number = 1.5,
): Promise<T|null> {
  for (let retry=0; retry<tries; ++retry) {
    try {
      return await fn();
    } catch (e) {
      const seconds = base**retry;
      log.warn(`retry request failed, retrying in ${seconds}`);
      log.debug(JSON.stringify(e));
      await sleep(1000 * seconds);
    }
  }
  log.error(`retry request failed ${tries} times`);

  return null;
}

// expects hex values
export function generateCommitment(address: string, taskid: string, cid: string): string {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'bytes32', 'bytes'],
      [address, taskid, cid]
    )
  );
}
