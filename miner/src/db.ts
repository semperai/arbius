import * as fs from 'fs';
import { Database } from 'sqlite3';
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

let db: Database;

export async function initializeDatabase(c: MiningConfig): Promise<any> {
  db = new Database(c.db_path);

  const paths = [
    `sql/models.sql`,
    `sql/tasks.sql`,
    `sql/task_inputs.sql`,
    `sql/solutions.sql`,
    `sql/contestations.sql`,
    `sql/contestation_votes.sql`,
    `sql/jobs.sql`,
    `sql/failed_jobs.sql`,
    `sql/task_txids.sql`,
  ].map((path) => `${__dirname}/${path}`);

  async function loadSqlFile(src: string) {
    return new Promise((resolve, reject) => {
      db.exec(fs.readFileSync(src).toString(), (err: Error|null) => {
        if (err) {
          log.error(`Loading SQL file: ${src} failed: ${JSON.stringify(err)}`);
          return reject(err);
        }

        resolve(true);
      });
    });
  }
  
  return Promise.all(paths.map((path) => loadSqlFile(path)));
}

// gets a task, solution, or contestation
async function dbGetHelperForGenericTasklike<T extends DBTask|DBSolution|DBContestation|DBInvalidTask>(
  taskid: string,
  query: string
): Promise<T|null> {
  return new Promise((resolve, reject) => {
    return db.get(query, [taskid], (err, row) => {
      if (row) resolve(row as T);
      else resolve(null);
    });
  });
}

export async function dbGetTask(taskid: string): Promise<DBTask|null> {
  return await dbGetHelperForGenericTasklike(taskid,
    `SELECT * FROM tasks WHERE id=?`);
}

export async function dbGetSolution(taskid: string): Promise<DBSolution|null> {
  return await dbGetHelperForGenericTasklike(taskid,
    `SELECT * FROM solutions WHERE taskid=?`);
}

export async function dbGetContestation(taskid: string): Promise<DBContestation|null> {
  return await dbGetHelperForGenericTasklike(taskid,
    `SELECT * FROM contestations WHERE taskid=?`);
}

export async function dbGetInvalidTask(taskid: string): Promise<DBInvalidTask|null> {
  return await dbGetHelperForGenericTasklike(taskid,
    `SELECT * FROM invalid_tasks WHERE taskid=?`);
}

export async function dbGetContestationVotes(taskid: string): Promise<DBContestationVote[]> {
  const query = `SELECT * FROM contestation_votes WHERE taskid=?`;
  return new Promise((resolve, reject) => {
    return db.all(query, [taskid], (err, rows) => {
      if (rows) resolve(rows as DBContestationVote[]);
      else reject(err);
    });
  });
}

export async function dbGetTaskTxid(
  taskid: string,
): Promise<string|null> {
  const query = `SELECT * FROM task_txids WHERE taskid=?`
  return new Promise((resolve, reject) => {
    return db.get(query, [taskid], (err, row) => {
      if (row) {
        const txid = (row as DBTaskTxid).txid;
        resolve(txid);
      }
      else resolve(null);
    });
  });
}
export async function dbGetTaskInput(
  taskid: string,
  cid: string,
): Promise<DBTaskInput|null> {
  const query = `SELECT * FROM task_inputs WHERE taskid=? AND cid=?`;
  return new Promise((resolve, reject) => {
    return db.get(query, [taskid, cid], (err, row) => {
      if (row) {
        const input = row as DBTaskInput;

        const data = JSON.parse(input.data);
        data.seed = taskid2Seed(taskid);

        input.data = JSON.stringify(data);

        resolve(input);
      }
      else resolve(null);
    });
  });
}

async function dbGetJob(jobid: number): Promise<DBJob|null> {
  return new Promise((resolve, reject) => {
    return db.get(
      `SELECT * FROM jobs WHERE id=?`,
      [jobid],
      (err, row) => {
      if (row) resolve(row as DBJob);
      else resolve(null);
    });
  });
}

export async function dbGetJobs(limit: number = 10000): Promise<DBJob[]> {
  return new Promise((resolve, reject) => {
    return db.all(`
      SELECT * FROM jobs
      ORDER BY priority DESC
      LIMIT ?
    `, [
      limit,
    ], (err, rows) => {
      if (rows) resolve(rows as DBJob[]);
      else reject(err);
    });
  });
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
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR IGNORE INTO tasks (id, modelid, fee, address, blocktime, version, cid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      taskid,
      modelid,
      fee.toString(),
      owner,
      blocktime.toString(),
      version,
      cid
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve({
        id: taskid,
        modelid,
        fee: fee.toString(),
        address: owner,
        blocktime: blocktime.toString(),
        version,
        cid,
        retracted: false,
      });
    });
  });
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

  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO invalid_tasks (taskid)
      VALUES (?)
    `, [
      taskid,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve({
        taskid,
      });
    });
  });
}

export async function dbStoreFailedJob(
  job: DBJob,
): Promise<boolean|null> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO failed_jobs (method, data)
      VALUES (?, ?)
    `, [
      job.method,
      job.data,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export async function dbUpdateTaskSetRetracted(taskid: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE tasks SET retracted=true WHERE id = ?`, [
      taskid,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export async function dbQueueJob({
  method,
  priority,
  waituntil,
  concurrent,
  data,
}: QueueJobProps): Promise<Job> {
  log.info(`QueueJob ${method} ${priority} ${waituntil} ${concurrent ? 'concurrent' : 'blocking'}`);

  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO jobs (priority, waituntil, concurrent, method, data)
      VALUES (?, ?, ?, ?, ?)
    `, [
      priority,
      waituntil,
      concurrent,
      method,
      JSON.stringify(data),
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve({
        method,
        priority,
        waituntil,
        concurrent,
        data,
      });
    });
  });
}

export async function dbGarbageCollect(): Promise<void> {
  let before = now() - 60;

  let methods = [
    'task',
    'pinTaskInput',
    'solution',
  ];

  for (let method of methods) {
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM jobs
        WHERE method = ? AND waituntil < ?
      `, [
        method,
        before,
      ], (err: Error | null) => {
        if (err) reject(err);
        else     resolve(null);
      });
    });
  }
}

export async function dbDeleteJob(jobid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      DELETE FROM jobs
      WHERE id=?
    `, [
      jobid,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve();
    });
  });
}

export async function dbClearJobsByMethod(method: string): Promise<void> {
  const jobs = await dbGetJobs();
  for (const job of jobs) {
    if (job.method === method) {
      dbDeleteJob(job.id);
    }
  }
}

export async function dbStoreTaskTxid(
  taskid: string,
  txid: string,
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    db.run(`
      INSERT INTO task_txids (taskid, txid)
      VALUES (?, ?)
    `, [
      taskid,
      txid,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export async function dbStoreTaskInput(
  taskid: string,
  cid: string,
  input: any
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    db.run(
      `INSERT INTO task_inputs (taskid, cid, data)
       VALUES (?, ?, ?)
    `, [
      taskid,
      cid,
      JSON.stringify(input),
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export async function dbStoreSolution({
  taskid,
  validator,
  blocktime,
  claimed,
  cid,
}: StoreSolutionProps): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    db.run(
      `INSERT INTO solutions (taskid, validator, blocktime, claimed,  cid)
       VALUES (?, ?, ?, ?, ?)
    `, [
      taskid,
      validator,
      blocktime.toString(),
      claimed,
      cid,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export async function dbStoreContestation({
  taskid,
  validator,
  blocktime,
  finish_start_index,
}: StoreContestationProps): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    db.run(
      `INSERT INTO contestations (taskid, validator, blocktime, finish_start_index)
       VALUES (?, ?, ?, ?)
    `, [
      taskid,
      validator,
      blocktime.toString(),
      finish_start_index,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export async function dbStoreContestationVote({
  taskid,
  validator,
  yea,
}: StoreContestationVoteProps): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    db.run(
      `INSERT INTO contestation_votes (taskid, validator, yea)
       VALUES (?, ?, ?)
    `, [
      taskid,
      validator,
      yea,
    ], (err: Error | null) => {
      if (err) reject(err);
      else     resolve(true);
    });
  });
}

export { db };
