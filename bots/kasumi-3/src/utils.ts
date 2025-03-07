import { ethers } from 'ethers';
import { base58 } from '@scure/base';
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
  return Number((BigInt(taskid) % BigInt(m)).toString());
}

export async function expretry<T>(
  tag: string,
  fn: () => Promise<T>,
  tries: number = 10,
  base: number = 1.5,
): Promise<T|null> {
  for (let retry=0; retry<tries; ++retry) {
    try {
      return await fn();
    } catch (e) {
      const seconds = base**retry;
      log.warn(`retry request failed (${tag}), retrying in ${seconds}`);
      log.debug(JSON.stringify(e));
      await sleep(1000 * seconds);
    }
  }
  log.error(`retry request failed ${tries} times`);

  return null;
}

// expects hex values
export function generateCommitment(address: string, taskid: string, cid: string): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'bytes32', 'bytes'],
      [address, taskid, cid]
    )
  );
}

export function hydrateInput(
  preprocessedInput: any,
  template: any,
) {
  // this will be populated from preprocessedInput with the template
  let input: any = {};

  function e(errmsg: string) {
    return {
      input,
      err: true,
      errmsg,
    };
  }

  for (const row of template.input) {
    const col = preprocessedInput[row.variable];

    // check required fields are there
    if (row.required) {
      if (typeof col === 'undefined') {
        return e(`input missing required field (${row.variable})`);
      }
    }

    if (typeof col !== 'undefined') {
      // check type matches
      switch(row.type) {
        case 'string':
        case 'string_enum':
          if (typeof(col) !== 'string') {
            return e(`input wrong type (${row.variable})`);
          }
          break;
        case 'int':
        case 'int_enum':
          if (typeof(col) !== 'number' || col !== (col|0)) {
            return e(`input wrong type (${row.variable})`);
          }
          break;
        case 'decimal':
          if (typeof(col) !== 'number' || col !== (col|0)) {
            return e(`input wrong type (${row.variable})`);
          }
          break;
      }

      // check range for numbers
      if (row.type === 'int' || row.type === 'decimal') {
        if (col < row.min || row > col.max) {
          return e(`input out of bounds (${row.variable})`);
        }
      }

      // check inside enum
      if (row.type === 'string_enum' || row.type === 'int_enum') {
        if (! row.choices.includes(col)) {
          return e(`input not in enum (${row.variable})`);
        }
      }

      // ok, everything passed
      input[row.variable] = col;
    }

    if (typeof col === 'undefined') {
      input[row.variable] = row['default'];
    }
  }

  return {
    input,
    err: false,
    errmsg: '',
  };
}

export function cidify(cid: string): string {
  if (! cid) {
    return '';
  }
  return base58.encode(ethers.getBytes(cid));
}
