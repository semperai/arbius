import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";
import { initializeLogger, log } from "./log";
import { initializeMiningConfig, c } from "./mc";
import { initializeBlockchain, wallet, arbius } from "./blockchain";
import { expretry } from "./utils";

const maxBlocks = 10_000;

type Contestation = {
  address: string;
  task: string;
  fromBlock: number;
  toBlock: number;
}
type ContestationVote = {
  address: string;
  task: string;
  yea: boolean;
}

const getLogs = async (startBlock: number, endBlock: number) => {
  const contestations: Contestation[] = [];
  const contestationVotes: ContestationVote[] = [];

  let fromBlock = startBlock;
  let toBlock = endBlock - fromBlock + 1 > maxBlocks ? fromBlock + maxBlocks - 1 : endBlock;

  while (toBlock <= endBlock) {
    log.debug(`Processing block [${fromBlock.toString()} to ${toBlock.toString()}]`);

    const events = await expretry(async () => await arbius.provider.getLogs({
      address: arbius.address,
      topics: [
        [
          arbius.interface.getEventTopic("ContestationSubmitted"),
          arbius.interface.getEventTopic("ContestationVote"),
        ],
      ],
      fromBlock,
      toBlock,
    }));

    events!.map((event: ethers.providers.Log) => {
      const parsedLog = arbius.interface.parseLog(event);
      switch (parsedLog.name) {
        case "ContestationSubmitted":
          log.debug(`Found contestation submitted: ${parsedLog.args.task}`);
          contestations.push({
            address: parsedLog.args.addr,
            task: parsedLog.args.task,
            fromBlock,
            toBlock,
          });
          break;
        case "ContestationVote":
          log.debug(`Found contestation vote: ${parsedLog.args.task}`);
          contestationVotes.push({
            address: parsedLog.args.addr,
            task: parsedLog.args.task,
            yea: parsedLog.args.yea,
          });
          break;
      }
    });

    log.debug(`Total contestations: ${contestations.length}`);

    if (toBlock === endBlock) break;
    fromBlock = toBlock + 1;
    toBlock = endBlock - fromBlock + 1 > maxBlocks ? fromBlock + maxBlocks - 1 : endBlock;
  }

  return {
    contestations,
    contestationVotes,
  };
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
  const {
    contestations,
    contestationVotes,
  
  }= await getLogs(Number(startBlock), Number(endBlock));

  log.debug(`${contestations.length} contested tasks found}`);
  writeFileSync("contestations.json", JSON.stringify(contestations, null, 2));
  writeFileSync("contestationVotes.json", JSON.stringify(contestationVotes, null, 2));
}

if (process.argv.length < 3) {
  log.error("usage: yarn scan:contested MiningConfig.json [startBlock] [endBlock]");
  process.exit(1);
}

main(process.argv[2], process.argv[3], process.argv[4]);
