import * as fs from 'fs';
import { Readable } from 'stream';
import { ethers, Contract, Wallet, BigNumber } from 'ethers';
import { base64 } from '@scure/base';
import axios from 'axios';
import * as http_client from 'ipfs-http-client';
import Config from './config.json';
import { log } from './log';
import {
  dbGetJobs,
  dbGetTask,
  dbGetTaskInput,
  dbGetInvalidTask,
  dbGetSolution,
  dbGetContestation,
  dbGetContestationVotes,
  dbStoreTask,
  dbStoreInvalidTask,
  dbStoreTaskInput,
  dbStoreSolution,
  dbStoreContestation,
  dbStoreContestationVote,
  dbStoreFailedJob,
  dbQueueJob,
  dbDeleteJob,
  dbClearJobsByMethod,
  dbUpdateTaskSetRetracted,
} from './db';

import {
  // AnythingV3Model,
  // ZeroscopeModel,
  Kandinsky2Model,
  getModelById,
  checkModelFilter,
  hydrateInput,
} from './models';

import { pinFileToIPFS, pinFilesToIPFS } from './ipfs';

import {
  sleep,
  now,
  taskid2Seed,
  expretry,
  generateCommitment,
} from './utils';

import {
  MiningConfig,
  Task,
  Solution,
  Job,
  Model,
  QueueJobProps,
  DBTask,
  DBInvalidTask,
  DBSolution,
  DBContestation,
  DBContestationVote,
  DBTaskInput,
  DBJob,
} from './types';

import { c } from './mc';

import { replicate } from './ml';

import {
  wallet,
  arbius,
  token,
  // governor,
  solver,
  getBlockNumber,
  depositForValidator,
  getValidatorStaked,
} from './blockchain';

// type interfaces;
interface LookupResult {
  model: string;
  cid: string;
}

interface TaskInput {
  data: string;
}

interface SolutionDetails {
  cid: string;
}

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.DEBUG);

const mathpercent = 100;

async function lookupAndInsertTask(taskid: string): Promise<Task> {
  return new Promise(async (resolve, reject) => {
    log.debug(`lookupAndInsertTask ${taskid}`);
    const existing = await dbGetTask(taskid);
    if (existing) {
      log.debug(`Task (${taskid}) already in db`);
      return resolve({
        model:     existing.modelid,
        fee:       BigNumber.from(existing.fee),
        owner:     existing.address,
        blocktime: BigNumber.from(existing.blocktime),
        version:   existing.version,
        cid:       existing.cid,
      });
    }

    log.debug(`looking up task from blockchain ${taskid}`);
    const {
      model,
      fee,
      owner,
      blocktime,
      version,
      cid,
    } = await expretry(async () => await arbius.tasks(taskid));

    log.debug(`lookupAndInsertTask inserting ${taskid}`);
    await dbStoreTask({
      taskid,
      modelid: model,
      fee,
      owner,
      blocktime,
      version,
      cid,
    });

    resolve({
      model,
      fee,
      owner,
      blocktime,
      version,
      cid,
    });
  });
}


async function lookupAndInsertTaskInput(
  taskid: string,
  cid: string,
  txid: string,
  modelTemplate: any,
) {
  let input: any;

  const cachedInput = await dbGetTaskInput(taskid, cid);
  if (cachedInput !== null) {
    log.debug(`Task (${taskid}) CID (${cid}) loaded from cache`);
    input = JSON.parse(cachedInput.data);
    return input;
  }

  log.debug(`Task (${taskid}) CID (${cid}) being loaded from TXID (${txid})`);
  // will be populated from task cid when downloaded
  let preprocessed_str = null;
  let preprocessed_obj = null;

  const tx = await expretry(async () => await arbius.provider.getTransaction(txid));
  if (! tx) {
    throw new Error('unable to retrieve tx');
  }
  const parsed = arbius.interface.parseTransaction(tx);

  try {
    preprocessed_str = Buffer.from(parsed.args.input_.substring(2), 'hex').toString();
    preprocessed_obj = JSON.parse(preprocessed_str);
  } catch (e) {
    log.warn(`Task (${taskid}) request was unable to be parsed`);
    await dbStoreInvalidTask(taskid);
    return;
  }

  const hydrated = hydrateInput(preprocessed_obj, modelTemplate);
  if (hydrated.err) {
    log.warn(`Task (${taskid}) hydration error ${hydrated.errmsg}`);
    await dbStoreInvalidTask(taskid);
    return;
  }

  input = hydrated.input;
  input.seed = taskid2Seed(taskid);
  await dbStoreTaskInput(taskid, cid, input);

  await dbQueueJob({
    method: 'pinTaskInput',
    priority: 10,
    waituntil: 0,
    concurrent: true,
    data: {
      taskid,
      input: preprocessed_str,
    },
  });

  return input;
}

async function eventHandlerTaskSubmitted(
  taskid: string,
  evt: ethers.Event,
) {
  log.debug('Event.TaskSubmitted', taskid);

  const task = await lookupAndInsertTask(taskid);
  const txid = evt.transactionHash;

  const queued = await dbQueueJob({
    method: 'task',
    priority: 10,
    waituntil: 0,
    concurrent: true,
    data: {
      taskid,
      txid,
    },
  });
  console.log(queued);
}

async function eventHandlerTaskRetracted(taskid: string, evt: ethers.Event) {
  log.debug('Event.TaskRetracted', taskid);

  return new Promise(async (resolve, reject) => {
    const existing = await dbGetTask(taskid);
    if (! existing) {
      log.debug(`Task (${taskid}) not in db, looking up`);
      await lookupAndInsertTask(taskid);
    }

    const {
      model,
      fee,
      owner,
      blocktime,
      version,
      cid,
    } = await expretry(async () => await arbius.tasks(taskid));

    await dbUpdateTaskSetRetracted(taskid);
  });
}

async function eventHandlerSolutionSubmitted(taskid: string, evt: ethers.Event) {
  try {
    const existing = await dbGetSolution(taskid);
    if (existing) {
      log.debug(`Solution (${taskid}) already in db`);
      return true;
    }

    const { owner } = await expretry(async () => await arbius.tasks(taskid));
    console.log(`Owner of the solution ${owner}`);

    // triggeres to check the transaction for valid CID
    if (Math.random() < mathpercent) {
      const lookup = (await expretry(() => lookupAndInsertTask(taskid))) as LookupResult;
      if (!lookup) {
        throw new Error("could not look up task -> eventHandlerSolutionSubmitted");
      }
      const { model, cid: inputCid } = lookup;

      const m = getModelById(EnabledModels, model);
      if (!m) {
        log.error(`Task (${taskid}) could not find model (${model}) -> eventHandlerSolutionSubmitted`);
        return false;
      }

      const taskInput = (await dbGetTaskInput(taskid, inputCid)) as TaskInput | null;
      if (!taskInput) {
        log.warn(`Task (${taskid}) input not found in db -> eventHandlerSolutionSubmitted`);
        return false;
      }

      const input = JSON.parse(taskInput.data);
      const cid = await m.getcid(c, m, taskid, input);

      const solution = (await expretry(() => arbius.solutions(taskid))) as SolutionDetails;
      if (solution.cid !== cid) {
        log.info(`Solution found with cid ${solution.cid} does not match ours ${cid} -> eventHandlerSolutionSubmitted`);
        await contestSolution(taskid);
      } else {
        log.info(`Solution CID matches our local CID for ${taskid} -> eventHandlerSolutionSubmitted`);
      }
    }

    const { validator, blocktime, claimed, cid } = await expretry(async () => await arbius.solutions(taskid));

    const invalidTask = await dbGetInvalidTask(taskid);
    if (invalidTask != null) {
      await contestSolution(taskid);
    }

    await dbStoreSolution({ taskid, validator, blocktime, claimed, cid });
    return true;
  } catch (e) {
    log.error("An error occurred in eventHandlerSolutionSubmitted", e);
    throw e; // Ensure the caller can handle the thrown error.
  }
}


async function eventHandlerContestationSubmitted(
  validator: string,
  taskid: string,
  evt: ethers.Event,
) {
  log.error("eventHandlerContestationSubmitted", validator, taskid);
  return new Promise(async (resolve, reject) => {

    const canVoteStatus = await expretry(async () => await arbius.validatorCanVote(validator, taskid));
    const canVote = canVoteStatus == 0x0; // success code

    if (! canVote) {
      log.debug(`Contestation ${taskid} cannot vote (code ${canVoteStatus})`);
      return;
    }

    const existing = await dbGetContestation(taskid);

    if (existing) {
      log.debug(`Contestation ${taskid} already in db -> eventHandlerContestationSubmitted`);
      return resolve(true);
    }

    // Fetch contestation details (original line had a naming conflict)
    const contestationDetails = await expretry(async () => await arbius.contestations(taskid));

    const lookup = await expretry(async () => await lookupAndInsertTask(taskid));
    if (!lookup) {
      log.error("could not look up task -> eventHandlerContestationSubmitted");
      return reject(new Error("Could not look up task -> eventHandlerContestationSubmitted"));
    }
    const { model, cid: inputCid } = lookup;

    const m = getModelById(EnabledModels, model);

    if (m === null) {
      log.error(`Task (${taskid}) could not find model (${model}) -> eventHandlerContestationSubmitted`);
      return;
    }

    const taskInput = await dbGetTaskInput(taskid, inputCid);

    if (!taskInput) {
      log.warn(`Task (${taskid}) input not found in db -> eventHandlerContestationSubmitted`);
      return;
    }
    const input = JSON.parse(taskInput.data);
    const expectedCid = await m.getcid(c, m, taskid, input);

    // Fetch contested solution details
    const solution = await expretry(async () => await arbius.solutions(taskid));

    // Compare CIDs and decide on voting
    if (solution.cid !== expectedCid) {
      await voteOnContestation(taskid, true); // Assuming true votes for the contestation
      log.info(`Contested CID does not match expected CID for ${taskid}. Voting in favor.  -> eventHandlerContestationSubmitted`);
      await voteOnContestation(taskid, true);
    } else {
      // we may not want to vote to save gas idk?????
      log.info(`Contested CID matches expected CID for ${taskid}. No action taken.  -> eventHandlerContestationSubmitted`);
      await voteOnContestation(taskid, false);
    }

    // Store contestation details in db
    await dbStoreContestation({
      taskid,
      validator: contestationDetails.validator,
      blocktime: contestationDetails.blocktime,
      finish_start_index: contestationDetails.finish_start_index,
    });

    resolve(true);
  }).catch((e) => {
    log.error("An error occurred -> eventHandlerContestationSubmitted ", e);
    throw e;
  });
}


async function eventHandlerContestationVote(
  validator: string,
  taskid: string,
  yea: boolean,
  evt: ethers.Event,
) {
  log.error('Event.ContestationVote', validator, taskid, yea);

  return new Promise(async (resolve, reject) => {
    {
      const rows = await dbGetContestationVotes(taskid);
      for (let row of rows) {
        if (row.validator === validator) {
          log.debug(`Contestation Vote ${taskid}-${validator} already in db`);
          return resolve(true);
        }
      }
    }

    await dbStoreContestationVote({
      taskid,
      validator,
      yea,
    });
  });
}

/*
async function eventHandlerGovernanceProposalCreated(
  proposalId: string,
  evt: ethers.Event,
) {
  log.debug('Event.ProposalCreated', proposalId);
  const txid = evt.transactionHash;

  const tx = await expretry(async () => await governor.provider.getTransaction(txid));
  if (! tx) {
    throw new Error('unable to retrieve tx');
  }
  const parsed = governor.interface.parseTransaction(tx);
  log.debug('parsed', parsed);

  const description = parsed.args[3];
  log.debug('description', description);

  await dbQueueJob({
    method: 'pinGovernanceProposal',
    priority: 100,
    waituntil: 0,
    concurrent: true,
    data: {
      proposalId,
      description,
    },
  });
}

async function processPinGovernanceProposal(
  proposalId: string,
  description: string,
) {
  const cid = await expretry(async () => await pinFileToIPFS(
    c,
    Buffer.from(description, 'utf-8'),
    `proposal-${proposalId}.md`,
  ));

  log.debug(`Governance proposal ${proposalId} pinned with ${cid}`);
}
*/

async function processPinTaskInput(
  taskid: string,
  input: string,
) {
  const cid = await expretry(async () => await pinFileToIPFS(
    c,
    Buffer.from(input, 'utf-8'),
    `task-${taskid}.json`,
  ));

  log.debug(`Task input ${taskid} pinned with ${cid}`);
}

async function processContestationVoteFinish(
  taskid: string,
) {
  log.error('processContestationVoteFinish', taskid);

  let total = 0;

  // TODO update when we have more than 10000 miners
  for (let idx=0; idx<10000; idx++) {
    const a = await expretry(async () => await arbius.contestationVoteYeas(taskid, idx), 1, 0);
    log.debug('yeas', 'a', a, 'idx', idx);
    if (!a || a == "0x0000000000000000000000000000000000000000") {
      break;
    }
    ++total;
  }

  for (let idx=0; idx<10000; idx++) {
    const a = await expretry(async () => await arbius.contestationVoteNays(taskid, idx), 1, 0);
    log.debug('nays', 'a', a, 'idx', idx);
    if (!a || a == "0x0000000000000000000000000000000000000000") {
      break;
    }
    ++total;
  }
  log.debug('total', total);

  const finishStartIndex = await expretry(async () => await arbius.contestations(taskid)).then((x) => x.finish_start_index);
  log.debug('finishStartIndex', finishStartIndex);

  if (finishStartIndex >= total) {
    log.debug(`ContestationVoteFinish ${taskid} already finished`);
    return;
  }

  // how many to process at time
  const amnt = 16;
  await expretry(async () => arbius.contestationVoteFinish(taskid, amnt), 3, 1.25);
  log.debug(`ContestationVoteFinish ${taskid} finished`);
}

async function processValidatorStake() {
  const etherBalance = await arbius.provider.getBalance(wallet.address);
  log.debug(`BCHK Ether balance: ${ethers.utils.formatEther(etherBalance)}`);

  if (etherBalance.lt(ethers.utils.parseEther("0.01"))) {
    log.warn(`BCHK Low Ether balance`);
  }

  const staked = await getValidatorStaked();
  log.debug(`BCHK AIUS Staked: ${ethers.utils.formatEther(staked)}`);

  const validatorMinimum = await expretry(async () => await arbius.getValidatorMinimum());
  log.debug(`BCHK Validator Minimum: ${ethers.utils.formatEther(validatorMinimum)}`);

  // schedule checking every 10 mins
  await dbQueueJob({
    method: 'validatorStake',
    priority: 100,
    waituntil: now()+600,
    concurrent: false,
    data: {
      validatorMinimum,
    },
  });

  const minWithTopupBuffer = validatorMinimum
    .mul(100)
    .div(100 - c.stake_buffer_topup_percent);

  if (staked.gte(minWithTopupBuffer)) {
    log.debug(`BCHK Have sufficient stake`);
    return;
  }

  const minWithBuffer = validatorMinimum
    .mul(100)
    .div(100 - c.stake_buffer_percent);

  const depositAmount = minWithBuffer.sub(staked);
  log.debug(`BCHK Deposit Amount ${ethers.utils.formatEther(depositAmount)}`);

  const balance = await expretry(async () => await token.balanceOf(wallet.address));
  if (balance.lt(depositAmount)) {
    log.error(`BCHK Balance ${ethers.utils.formatEther(balance)} less than deposit amount ${ethers.utils.formatEther(depositAmount)}`);
    throw new Error('unable to stake required balance');
  }

  const allowance = await expretry(async () => await token.allowance(
    wallet.address,
    solver.address, // could be engine or delegated validator
  ));
  log.debug(`BCHK Allowance Amount ${ethers.utils.formatEther(allowance)}`);

  if (allowance.lt(balance)) {
    const allowanceAmount = ethers.constants.MaxUint256.sub(allowance);

    log.debug(`BCHK Increasing allowance`);
    await expretry(async () => {
      const tx = await expretry(async () => await token.approve(
        solver.address,
        allowanceAmount,
      ));
      const receipt = await tx.wait();
      log.info(`BCHK Allowance increased in ${receipt.transactionHash}`);
    });
  }

  log.debug(`BCHK Depositing for validator stake ${ethers.utils.formatEther(depositAmount)}`);
  await expretry(async () => {
    const receipt = await depositForValidator(depositAmount);
    log.info(`BCHK Deposited in ${receipt.transactionHash}`);
  });

  const postDepositStaked = await getValidatorStaked();
  log.debug(`BCHK Post staked: ${ethers.utils.formatEther(postDepositStaked)}`);
}

async function processAutomine() {
  try {
    const tx = await solver.submitTask(
      c.automine.version,
      wallet.address,
      c.automine.model,
      BigNumber.from(c.automine.fee),
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(c.automine.input))),
      {
        gasLimit: 2_500_000,
      }
    );

    const receipt = await tx.wait();
    log.info(`Automine submitTask ${receipt.transactionHash}`);
  } catch (e) {
    log.error(`Automine submitTask failed ${JSON.stringify(e)}`);
  }

  if (c.automine.enabled) {
    await dbQueueJob({
      method: 'automine',
      priority: 5,
      waituntil: now()+c.automine.delay,
      concurrent: false,
      data: {
      },
    });
  }
}

// can be run concurrently as its just downloading
async function processTask(
  taskid: string,
  txid: string,
) {
  const {
    model,
    fee,
    owner,
    blocktime,
    version,
    cid,
  }= await lookupAndInsertTask(taskid);

  // we are version 0
  if (version !== 0) {
    log.debug(`Task (${taskid}) has version other than 0`);
    // ensure any task mined with non-0 is contested
    // this is looked up when new solutions are seen
    await dbStoreInvalidTask(taskid);
    return;
  }

  const {
    modelEnabled,
    modelTemplate,
    filterPassed,
  } = checkModelFilter(EnabledModels, {
    model,
    now: now(),
    fee,
    blocktime,
    owner,
  });

  if (! modelEnabled) {
    log.debug(`Task (${taskid}) is using non-enabled Model (${model})`);
    return;
  }

  if (! filterPassed) {
    log.debug(`Task (${taskid}) does not pass filter`);
    return;
  }

  // this will be populated
  let input = await lookupAndInsertTaskInput(taskid, cid, txid, modelTemplate);

  log.debug(`Task (${taskid}) input ${JSON.stringify(input, null, 2)}`);

  await dbQueueJob({
    method: 'solve',
    priority: 20,
    waituntil: 0,
    concurrent: false,
    data: {
      taskid,
    },
  });
}

async function processSolve(taskid: string) {
  // TODO defer solution lookup for faster generation
  const {
    validator: solutionValidator,
    blocktime: solutionBlocktime,
    claimed: solutionClaimed,
    cid: solutionCid
  } = await expretry(async () => await arbius.solutions(taskid));
  const { owner } = await expretry(async () => await arbius.tasks(taskid));

  if (solutionValidator != "0x0000000000000000000000000000000000000000") {
    log.debug(`Task (${taskid}) already has solution`);
    // TODO we may want to not do this right now for checking cid for solutions? maybe?
    return; // TODO some % of the time we should attempt any way
  }

  const lookup = await expretry(async () => await lookupAndInsertTask(taskid));
  if (!lookup) {
    throw new Error("could not look up task");
  }
  const { model, cid: inputCid } = lookup;

  const m = getModelById(EnabledModels, model);
  if (m === null) {
    log.error(`Task (${taskid}) could not find model (${model})`);
    return;
  }

  // TODO if we have txid here we could do lookupAndInsertTaskInput
  const taskInput = await dbGetTaskInput(taskid, inputCid);
  if (taskInput === null) {
    log.warn(`Task (${taskid}) input not found in db`);
    return;
  }

  const input = JSON.parse(taskInput.data);

  const cid = await m.getcid(c, m, taskid, input);
  if (!cid) {
    log.error(`Task (${taskid}) CID could not be generated`);
    return;
  }
  log.info(`CID ${cid} generated`);

  const commitment = generateCommitment(wallet.address, taskid, cid);

  try {
    const tx = await arbius.signalCommitment(commitment, {
      gasLimit: 450_000,
    });
    // const receipt = await tx.wait(); // we dont wait here to be faster
    log.info(`Commitment signalled in ${tx.hash}`);
  } catch (e) {
    log.error(`Commitment submission failed ${JSON.stringify(e)}`);
    return;
  }

  // we will retry in case we didnt wait long enough for commitment
  // if this fails otherwise, it could be because another submitted solution
  await expretry(
    async () => {
      try {
        log.debug(`Submitting solution ${taskid} ${cid}`);
        const tx = await solver.submitSolution(taskid, cid, {
          gasLimit: 500_000,
        });
        const receipt = await tx.wait();
        log.info(`Solution submitted in ${receipt.transactionHash}`);

        await dbQueueJob({
          method: "claim",
          priority: 50,
          waituntil: now() + 2000 + 120, // 1 min buffer to avoid time drift claim issues
          concurrent: false,
          data: {
            taskid,
          },
        });
      } catch (e) {
        log.debug(JSON.stringify(e));
        const {
          validator: existingSolutionValidator,
          blocktime: existingSolutionBlocktime,
          claimed: existingSolutionClaimed,
          cid: existingSolutionCid,
        } = await expretry(async () => await arbius.solutions(taskid));

        if (existingSolutionValidator == "0x0000000000000000000000000000000000000000") {
          throw new Error(`An unknown error occurred when tried to submit solution for ${taskid} with cid ${cid} -- ${JSON.stringify(e)}`);
        }

        if (existingSolutionCid === cid) {
          log.info(`Solution found for ${taskid} matches our cid ${cid}`);
          return;
        }

        log.info(`Solution found with cid ${existingSolutionCid} does not match ours ${cid}`);
        await contestSolution(taskid);
      }
    },
    3,
    1.25
  );
}

async function contestSolution(taskid: string) {
  try {
    log.info(`Attempt to contest ${taskid} solution`);

    const { owner } = await expretry(async () => await arbius.tasks(taskid));
    log.debug(`contestSolution ${taskid} from ${owner}`);
    if (owner === wallet.address) {
      log.error(`Attempting to contest own solution ${taskid}  --- lets not do this`);
      log.error(`Please report this to the developers`);
      return;
    }

    const tx = await solver.submitContestation(taskid);
    const receipt = await tx.wait();
    log.info(`Submitted contestation for ${taskid} in ${receipt.transactionHash}`);
    await dbQueueJob({
      method: 'contestationVoteFinish',
      priority: 200,
      waituntil: now()+5010,
      concurrent: false,
      data: {
        taskid,
      },
    });
  } catch (e) {
    log.debug(JSON.stringify(e));
    // check if someone else submitted a contestation
    const {
      validator: existingContestationValidator,
      blocktime: existingContestationBlocktime,
    } = await expretry(async () => await arbius.contestations(taskid));

    // someone else contested first
    if (existingContestationValidator == "0x0000000000000000000000000000000000000000") {
      log.error(`An unknown error occurred when we tried to contest ${taskid}`);
      return;
    }

    log.info(`Contestation for ${taskid} was already created by ${existingContestationValidator}`);
    // if we are contesting it, then we agree it is invalid
    await voteOnContestation(taskid, true);
  }
}

async function voteOnContestation(taskid: string, yea: boolean) {
  const canVoteStatus = await expretry(async () => await arbius.validatorCanVote(wallet.address, taskid));
  const canVote = canVoteStatus == 0x0; // success code

  if (! canVote) {
    log.debug(`[voteOnContestation] Contestation ${taskid} cannot vote (code ${canVoteStatus})`);
    return;
  }

  try {
    log.info(`Attempt to vote ${yea ? 'YES' : 'NO'} on ${taskid} contestation`);
    const tx = await solver.voteOnContestation(taskid, yea);
    const receipt = await tx.wait();
    log.info(`Contestation vote ${yea ? 'YES' : 'NO'} submitted on ${taskid} in ${receipt.transactionHash}`);
  } catch (e) {
    log.debug(JSON.stringify(e));
    log.error(`Failed voting on contestation ${taskid}`);
  }
}

async function processClaim(taskid: string) {
  const receipt = await expretry(async () => {
    const { claimed } = await expretry(async () => await arbius.solutions(taskid));
    log.debug("processClaim [claimed]", claimed);
    if (claimed) {
      log.warn(`Solution (${taskid}) already claimed`);
      return null;
    }

    const { validator: contestationValidator } = await expretry(async () => await arbius.contestations(taskid));
    log.debug("processClaim [contestationValidator]", contestationValidator);
    if (contestationValidator != "0x0000000000000000000000000000000000000000") {
      log.error(`Contestation found for solution ${taskid}, cannot claim`);

      await dbQueueJob({
        method: 'contestationVoteFinish',
        priority: 200,
        waituntil: now()+240+20,
        concurrent: false,
        data: {
          taskid,
        },
      });

      return null;
    }

    const tx = await arbius.claimSolution(taskid, {
      gasLimit: 300_000,
    });
    const receipt = await tx.wait()
    log.info(`Claim ${taskid} in ${receipt.transactionHash}`);
    return receipt;
  });

  if (receipt == null) {
    log.error(`Failed claiming (${taskid})`);
    return;
  }

  log.debug(`Solution (${taskid}) claimed`);
}

async function mlStrategyReplicate(
  model: Model,
  taskid: string,
  input: any,
  outputTransform: (output: any) => Promise<string[]>, // paths
): Promise<string[]> {
  log.debug(`Replicate for Task (${taskid}) with input ${JSON.stringify(input)}`);
  // this looks like:
  // https://r8.im/ORG/TITLE@sha256:H
  // we want:
  // ORG/TITLE:H
  const modelKey = model.template.meta.docker
    .replace('https://r8.im/', '')
    .replace('@sha256', '');

  log.debug(`Replicate running for Task (${taskid}) Model (${model.template.meta.title}) ${JSON.stringify(input)}`);

  const output = await expretry(async () => await replicate.run(modelKey, {
    input
  }), 5) as string[];
  log.debug(`Replicate output for Task (${taskid}) ${JSON.stringify(output)}`);

  if (! output || output.length < 1) {
    throw Error('output length too small');
  }

  return outputTransform(output!);
}

const EnabledModels = [
  /*
  {
    ...AnythingV3Model,
    filters: [
      {
        minfee: ethers.utils.parseEther('0'),
        mintime: 0,
      },
    ],
    getfiles: async (m: Model, taskid: string, input: any) => {
      return await mlStrategyReplicate(m, taskid, input, async (output) => {
        const url = output![0];
        const res = await expretry(async () => await axios.get(url, {
          responseType: 'arraybuffer'
        }));

        if (! res) {
          throw new Error('unable to getfiles');
        }

        const path = 'out-1.png';
        fs.writeFileSync(`${__dirname}/../cache/${path}`, res.data);

        return [path];
      });
    },
  },
  */
  /*
  {
    ...ZeroscopeModel,
    filters: [
      {
        minfee: ethers.utils.parseEther('0'),
        mintime: 0,
      },
    ],
    getfiles: async (m: Model, taskid: string, input: any) => {
      const url = 'http://192.9.239.212:8001/predictions';
      const res = await axios.post(url, { timeout: 120_000, input });

      if (! res) {
        throw new Error('unable to getfiles');
      }

      if (res.data.output.length != 1) {
        throw new Error('unable to getfiles -- data.output length not 1');
      }

      // slice off 
      // data:image/png;base64,
      const b64data = res.data.output[0];
      const data = b64data.replace(/^data:\w+\/\w+;base64,/, "");
      const buf = Buffer.from(data, 'base64');

      const path = 'out-1.mp4';
      fs.writeFileSync(`${__dirname}/../cache/${path}`, buf);

      return [path];
    },
  },
  */
  {
    ...Kandinsky2Model,
    filters: [
      {
        minfee: ethers.utils.parseEther('0'),
        mintime: 0,
      },
    ],
    getfiles: async (m: Model, taskid: string, input: any) => {
      const url = c.ml.cog[Config.models.kandinsky2.id].url;
      const res = await axios.post(url, { input });

      if (! res) {
        throw new Error('unable to getfiles');
      }


      if (res.data.output.length != 1) {
        throw new Error('unable to getfiles -- data.output length not 1');
      }

      // slice off 
      // data:image/png;base64,
      const b64data = res.data.output[0];
      const data = b64data.replace(/^data:\w+\/\w+;base64,/, "");
      const buf = Buffer.from(data, 'base64');

      const path = 'out-1.png';
      fs.writeFileSync(`${__dirname}/../cache/${path}`, buf);

      return [path];
    },
  },
];

export async function processJobs(jobs: DBJob[]) {
  function assembleFn(job: DBJob): () => Promise<void> {
    const decoded = JSON.parse(job.data);
    switch (job.method) {
      case 'automine':
        return () => processAutomine();
      case 'validatorStake':
        return () => processValidatorStake();
      case 'task':
        return () => processTask(
          decoded.taskid,
          decoded.txid,
        );
      case 'solve':
        return () => processSolve(decoded.taskid);
      case 'claim':
        return () => processClaim(decoded.taskid);
        break;
      /*
      case 'pinGovernanceProposal':
        return () => processPinGovernanceProposal(
          decoded.proposalId,
          decoded.description,
        );
      */
      case 'pinTaskInput':
        return () => processPinTaskInput(
          decoded.taskid,
          decoded.input,
        );
        break;
      case 'contestationVoteFinish':
       return () => processContestationVoteFinish(decoded.taskid);
       break;

      default:
        log.error(`Job (${job.id}) method (${job.method}) has no implementation`);
        process.exit(1);
    }
  }

  async function loop(
    job: DBJob,
    concurrent: boolean,
  ) {
    if (job.concurrent != concurrent) {
      return;
    }

    if (job.waituntil > now()) {
      return;
    }

    log.debug(`Job (${job.id}) [${job.method}] processing`);

    const f = assembleFn(job)()
    .catch(async (e) => {
      await dbStoreFailedJob(job);
    });

    if (! concurrent) {
      await f;
    }

    log.debug(`Job (${job.id}) [${job.method}] processed`);
    await dbDeleteJob(job.id);
  }

  // log.debug(jobs)

  // first process all concurrent jobs
  for (const job of jobs) {
    loop(job, true);
  }

  // process all non-concurrent
  for (const job of jobs) {
    await loop(job, false);
  }
}

async function versionCheck() {
  const minerVersion = BigNumber.from('0');
  const arbiusVersion = await arbius.version();
  if (arbiusVersion.lte(minerVersion)) {
    log.info(`Arbius version (${arbiusVersion}) fits miner version (${minerVersion})`);
  } else {
    log.error(`version mismatch, have miner version ${minerVersion.toString()} and arbius is ${arbiusVersion.toString()} - upgrade your miner`);
    process.exit(1);
  }
}

export async function main() {
  // need extra for ethers
  log.debug("Setting max file listeners to 100 for ethers");
  process.setMaxListeners(100);

  // we dont care about old ones
  log.debug("Clearing old automatically added retry jobs");
  dbClearJobsByMethod('validatorStake');
  dbClearJobsByMethod('automine');
  dbClearJobsByMethod("task");
  dbClearJobsByMethod("solve");

  log.debug("Bootup check");
  await versionCheck();
  if (c.evilmode) {
    for (let i=0; i<20; ++i) {
      log.warn('YOU HAVE EVIL MODE ENABLED, YOU WILL BE SLASHED');
      log.warn('KILL YOUR MINER IMMEDIATELY IF NOT ON TESTNET');
    }
  } else {
    const m = getModelById(EnabledModels, Config.models.kandinsky2.id);
    if (m === null) {
      process.exit(1);
      return;
    }
    const input = {prompt: "arbius test cat", seed: 1337};
    const taskid = 'startup-test-taskid';
    const cid = await m.getcid(c, m, taskid, input);
    const expected = '0x12201bdab4164320cc8621282982c55eb76e14427aa5793278b37b6108f63fb5d577';
    if (cid === expected) {
      log.info(`Model (${Config.models.kandinsky2.id}) CID (${cid}) matches expected CID (${expected})`);
    } else {
      log.error(`Model (${Config.models.kandinsky2.id}) CID (${cid}) does not match expected CID (${expected})`);
      log.info(`If you are running a100 this is a bug, please report with system details at https://github.com/semperai/arbius`);
      log.info(`Join our telegram https://t.me/arbius_ai`);
      process.exit(1);
    }
  }

  await dbQueueJob({
    method: 'validatorStake',
    priority: 30,
    waituntil: 0,
    concurrent: false,
    data: {},
  });

  if (c.automine.enabled) {
    await dbQueueJob({
      method: 'automine',
      priority: 5,
      waituntil: 0,
      concurrent: false,
      data: {
      },
    });
  }

  arbius.on('VersionChanged', async(
    version: ethers.BigNumber,
    evt:     ethers.Event,
  ) => {
    log.debug('Event.VersionChanged', version.toString());
    await versionCheck();
  });

  arbius.on('TaskSubmitted', (
    taskid:  string,
    modelid: string,
    fee:     BigNumber,
    sender:  string,
    evt:     ethers.Event,
  ) => eventHandlerTaskSubmitted(taskid, evt));

  arbius.on('TaskRetracted', (
    taskid:  string,
    evt:     ethers.Event,
  ) => eventHandlerTaskRetracted(taskid, evt));

  arbius.on('SolutionSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => eventHandlerSolutionSubmitted(taskid, evt));

  arbius.on('ContestationSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => eventHandlerContestationSubmitted(validator, taskid, evt));

  arbius.on('ContestationVote', (
    validator: string,
    taskid:    string,
    yea:       boolean,
    evt:       ethers.Event,
  ) => eventHandlerContestationVote(validator, taskid, yea, evt));

  /*
  governor.on('ProposalCreated', (
    proposalId:  string,
    proposer:    string,
    targets:     string,
    values:      string,
    signatures:  string,
    calldatas:   string,
    voteStart:   BigNumber,
    voteEnd:     BigNumber,
    description: string,
    evt:         ethers.Event,
  ) => eventHandlerGovernanceProposalCreated(proposalId, evt));
  */

  // job processor / main loop
  while (true) {
    const jobs = await dbGetJobs();
    if (jobs.length === 0) {
      await sleep(100);
      continue;
    }

    let hasActiveJobs = false;
    for (const job of jobs) {
      if (job.waituntil < now()) {
        hasActiveJobs = true;
        break;
      }
    }

    if (! hasActiveJobs) {
      await sleep(100);
      continue;
    }

    log.debug(`Job queue has ${jobs.length} jobs`);
    // log.debug(jobs);
    await processJobs(jobs);
  }
}
