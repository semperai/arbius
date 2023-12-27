import { c } from './mc';
import { log } from './log';
import { dbQueueJob, dbGetJobs, dbDeleteJob } from './db';

import bodyParser from 'body-parser';
import express, { Express, Request, Response } from 'express';

const app: Express = express();
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Arbius Miner RPC');
});

app.post('/api/jobs/queue', async (req: Request, res: Response) => {
  try {
    const rfields = [
      ['method', 'string'],
      ['priority', 'number'],
      ['waituntil', 'number'],
      ['concurrent', 'boolean'],
      ['data', 'object'],
    ];
    rfields.forEach(([field, etype]) => {
      if (typeof req.body[field] === 'undefined') {
        throw new Error(`missing required field (${field})`);
      }
      if (typeof req.body[field] !== etype) {
        throw new Error(`expected (${field}) to be type (${etype}), got (${typeof req.body[field]})`);
      }
    });

    await dbQueueJob({
      method:     req.body.method,
      priority:   req.body.priority,
      waituntil:  req.body.waituntil,
      concurrent: req.body.concurrent,
      data:       req.body.data,
    });

    return res.json({ status: 'ok' });
  } catch (e: any) {
    return res.json({ status: 'fail', e: e.toString() });
  }
});

app.post('/api/jobs/get', async (req: Request, res: Response) => {
  try {
    let limit = 100_000;

    if (typeof req.body.limit !== 'undefined') {
      const parsedLimit = parseInt(req.body.limit);
      if (isNaN(parsedLimit)) {
        throw new Error('limit NaN');
      }

      limit = parsedLimit;
    }

    const jobs = await dbGetJobs(limit);
    return res.json({ status: 'ok', jobs });
  } catch (e: any) {
    return res.json({ status: 'fail', e: e.toString() });
  }
});

app.post('/api/jobs/delete', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.body.id);
    if (isNaN(id)) {
      throw new Error('id NaN');
    }
    await dbDeleteJob(req.body.id);
    return res.json({ status: 'ok' });
  } catch (e: any) {
    console.log(e);
    return res.json({ status: 'fail', e: e.toString() });
  }
});

app.post('/api/db/run', async (req: Request, res: Response) => {
  try {
    await dbQueueJob({
      method:     req.body.method,
      priority:   req.body.priority,
      waituntil:  req.body.waituntil,
      concurrent: req.body.concurrent,
      data:       req.body.data,
    });

    return res.json({ status: 'ok' });
  } catch (e) {
    return res.json({ status: 'fail', e: JSON.stringify(e) });
  }
});

export async function initializeRPC(): Promise<any> {
  return new Promise((resolve, reject) => {
    app.listen(c.rpc.port, c.rpc.host, () => {
      log.debug(`RPC server listening on ${c.rpc.host}:${c.rpc.port}`);
      resolve(true);
    });
  });
}
