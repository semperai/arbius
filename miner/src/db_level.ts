import {
    Level
} from "level"
import { MiningConfig } from './types';
import { log } from './log';
import { now, taskid2Seed } from './utils';
import {
  QueueJobProps,
  StoreTaskProps,
  StoreSolutionProps,
  StoreContestationProps,
  StoreContestationVoteProps,
  Job,
  DBTask,
  DBTaskTxid,
  DBTaskInput,
  DBInvalidTask,
  DBSolution,
  DBJob,
  DBContestation,
  DBContestationVote,
} from './types';
import * as fs from "fs";


let db: Level;

export async function initializeDatabase(c: MiningConfig) {
    db = new Level(c.db_path);
  
    console.log("LevelDB initialized successfuly!")

  }
  
  export async function dbGetTask(taskid: string): Promise<DBTask> {
    const response = await db.get("TASKS_"+taskid);
    return JSON.parse(Buffer.from(response, 'base64').toString());
  }

  export async function dbGetSolution(taskid: string): Promise<DBSolution|null> {
    const response = await db.get("SOLUTIONS_"+taskid);
    return JSON.parse(Buffer.from(response, 'base64').toString());
  }

export async function dbGetContestation(taskid: string): Promise<DBContestation|null> {
    const response = await db.get("CONTESTATION_"+taskid);
    return JSON.parse(Buffer.from(response, 'base64').toString());
}
export async function dbGetInvalidTask(taskid: string): Promise<DBInvalidTask|null> {
    const response = await db.get("INVALID_"+taskid);
    return JSON.parse(Buffer.from(response, 'base64').toString());
}

export async function dbGetContestationVotes(taskid: string): Promise<DBContestationVote[]> {
    const response = await db.get("CONTESTATION_VOTES_"+taskid);
    return JSON.parse(Buffer.from(response, 'base64').toString());
}
export async function dbGetTaskTxid(
    taskid: string,
  ): Promise<string|null> {
    try {
      const response = await db.get("TASK_TXID_"+taskid);
      return Buffer.from(response, 'base64').toString();
    } catch (e) {
      return null;
    }
}
export async function dbGetTaskInput(
    taskid: string,
    cid: string,
  ): Promise<DBTaskInput|null> {
    try {
      const response = await db.get("TASK_INPUT_"+taskid+"_"+cid);
      return JSON.parse(Buffer.from(response, 'base64').toString());
    } catch (e) {
      return null;
    }
}
async function dbGetJob(jobid: number): Promise<DBJob|null> {
    try {
      const response = await db.get("JOB_"+jobid);
      return JSON.parse(Buffer.from(response, 'base64').toString());
    } catch (e) {
      return null;
    }
}



export async function dbStoreTask({
    taskid,
    modelid,
    fee,
    owner,
    blocktime,
    version,
    cid,
  }: StoreTaskProps): Promise<DBTask|null> {

    try {
      await db.put("TASKS_"+taskid, Buffer.from(JSON.stringify({
        id: taskid,
        modelid,
        fee,
        address: owner,
        blocktime,
        version,
        cid,
        retracted: false,
      })).toString('base64'));
      return await dbGetTask(taskid);
    } catch (e) {
      return null;
    }
}
export async function dbStoreInvalidTask(
    taskid: string,
  ): Promise<DBInvalidTask|null> {
    const existing = await dbGetInvalidTask(taskid);
    if (existing != null) {
      log.warn(`dbStoreInvalidTask: Invalid task ${taskid} already exists`);
      return {
        taskid,
      }
    }
    try {
      await db.put("INVALID_"+taskid, Buffer.from(JSON.stringify({
        taskid,
      })).toString('base64'));
      return await dbGetInvalidTask(taskid);
    } catch (e) {
      return null;
    }
}

export async function dbStoreFailedJob(
    job: DBJob,
  ): Promise<boolean|null> {
    try {
      await db.put("FAILEDJOB_"+job.id, Buffer.from(JSON.stringify(job)).toString('base64'));
      return true;
    } catch (e) {
      return null;
    }
}
export async function dbUpdateTaskSetRetracted(taskid: string): Promise<boolean> {
    const task = await dbGetTask(taskid);
    if (task == null) {
      log.error(`dbUpdateTaskSetRetracted: Task ${taskid} not found`);
      return false;
    }
    try {
      await db.put("TASKS_"+taskid, Buffer.from(JSON.stringify({
        ...task,
        retracted: true,
      })).toString('base64'));
      return true;
    } catch (e) {
      return false;
    }
}
export async function dbQueueJob({
    method,
    priority,
    waituntil,
    concurrent,
    data,
  }: QueueJobProps): Promise<Job> {
    const jobid = now();
      await db.put("JOB_"+jobid, Buffer.from(JSON.stringify({
        id: jobid,
        method,
        priority,
        waituntil,
        concurrent,
        data,
      })).toString('base64'));
      return {
        method,
        priority,
        waituntil,
        concurrent,
        data,
      }
   
}

export async function dbDeleteJob(jobid: number): Promise<void> {
    await db.del("JOB_"+jobid);
}
export async function dbClearJobsByMethod(method: string): Promise<void> {
    for await (let [key,value] of  db.iterator({gte: "JOB_", lte: "JOB~"})) {
        const job = JSON.parse(Buffer.from(value, 'base64').toString());
        if (job.method == method) {
            await db.del(key);
        }
    }

}

export async function dbStoreTaskTxid(
    taskid: string,
    txid: string,
  ): Promise<boolean> {
    try {
      await db.put("TASK_TXID_"+taskid, Buffer.from(txid).toString('base64'));
      return true;
    } catch (e) {
      return false;
    }
}

export async function dbStoreTaskInput(
    taskid: string,
    cid: string,
    input: any
  ): Promise<boolean> {
    try {
      await db.put("TASK_INPUT_"+taskid+"_"+cid, Buffer.from(JSON.stringify({
        taskid,
        cid,
        data: input,
      })).toString('base64'));
      return true;
    } catch (e) {
      return false;
    }
}

export async function dbStoreSolution({
    taskid,
    validator,
    blocktime,
    claimed,
    cid,
  }: StoreSolutionProps): Promise<boolean> {
    try {
      await db.put("SOLUTIONS_"+taskid, Buffer.from(JSON.stringify({
        taskid,
        validator,
        blocktime,
        claimed,
        cid,
      })).toString('base64'));
      return true;
    } catch (e) {
      return false;
    }
}
export async function dbStoreContestation({
    taskid,
    validator,
    blocktime,
    finish_start_index,
  }: StoreContestationProps): Promise<boolean> {

    try {
      await db.put("CONTESTATION_"+taskid, Buffer.from(JSON.stringify({
        taskid,
        validator,
        blocktime,
        finish_start_index,
      })).toString('base64'));
      return true;
    } catch (e) {
      return false;
    }
}
export async function dbStoreContestationVote({
    taskid,
    validator,
    yea,
  }: StoreContestationVoteProps): Promise<boolean> {
 
    try {
      await db.put("CONTESTATION_VOTES_"+taskid, Buffer.from(JSON.stringify(
        {
          taskid,
          validator,
          yea,
        }
      )).toString('base64'));
      return true;
    } catch (e) {
      return false;
    }
}

export {db}