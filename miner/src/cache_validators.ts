import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";
import { initializeLogger, log } from "./log";
import { initializeMiningConfig, c } from "./mc";
import { initializeBlockchain, wallet, arbius } from "./blockchain";
import { expretry } from "./utils";

const maxBlocks = 10_000;

type ValidatorDeposit = {
  addr: string,
  validator: string,
  amount: ethers.BigNumber,
}

type Validator = {
  validator: string,
  balance: ethers.BigNumber,
}

const getLogs = async (startBlock: number, endBlock: number) => {
  const deposits: ValidatorDeposit[] = [];

  let fromBlock = startBlock;
  let toBlock = endBlock - fromBlock + 1 > maxBlocks ? fromBlock + maxBlocks - 1 : endBlock;

  while (toBlock <= endBlock) {
    log.debug(`Processing block [${fromBlock.toString()} to ${toBlock.toString()}]`);

    const events = await expretry(async () => await arbius.provider.getLogs({
      address: arbius.address,
      topics: [
        [
          arbius.interface.getEventTopic("ValidatorDeposit"),
        ],
      ],
      fromBlock,
      toBlock,
    }));

    events!.map((event: ethers.providers.Log) => {
      const parsedLog = arbius.interface.parseLog(event);
      switch (parsedLog.name) {
        case "ValidatorDeposit":
          log.debug(`Found deposit submitted: ${parsedLog.args.addr} -> ${parsedLog.args.validator} -> ${parsedLog.args.amount.toString()}`);
          deposits.push({
            addr: parsedLog.args.addr,
            validator: parsedLog.args.validator,
            amount: parsedLog.args.amount,
          });
          break;
          break;
      }
    });

    log.debug(`Total deposits: ${deposits.length}`);

    if (toBlock === endBlock) break;
    fromBlock = toBlock + 1;
    toBlock = endBlock - fromBlock + 1 > maxBlocks ? fromBlock + maxBlocks - 1 : endBlock;
  }

  const uniqueValidators = new Set(deposits.map((deposit) => deposit.validator));

  const validators: Validator[] = [];
  for (const validator of Array.from(uniqueValidators)) {
    log.debug(`Fetching balance for ${validator}`);
    const balance = await expretry(async () => (await arbius.validators(validator)).staked.toString());
    validators.push({ validator, balance });
  }

  return { validators };
};

async function main(configPath: string, startBlock?: string, endBlock?: string) {
  try {
    const mconf = JSON.parse(readFileSync(configPath, "utf8"));
    initializeMiningConfig(mconf);
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }

  initializeLogger(null);

  await initializeBlockchain();

  if (! startBlock) {
    startBlock = '51380392';
  }
  if (! endBlock) {
    endBlock = ""+(await wallet.provider.getBlockNumber());
  }
  const { validators } = await getLogs(Number(startBlock), Number(endBlock));

  log.debug(`${validators.length} validators found}`);
  writeFileSync("validators.json", JSON.stringify(validators, null, 2));
}

if (process.argv.length < 3) {
  log.error("usage: yarn scan:deposits MiningConfig.json [startBlock] [endBlock]");
  process.exit(1);
}

main(process.argv[2], process.argv[3], process.argv[4]);
