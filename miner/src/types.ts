import { BigNumber } from 'ethers';

export interface MiningConfig {
  log_path: string|null;
  db_path: string;
  cache_path: string;
  stake_buffer_percent: number;
  stake_buffer_topup_percent: number;
  evilmode: boolean;
  read_only: boolean;

  blockchain: {
    private_key: string;
    rpc_url: string;
    use_delegated_validator: boolean;
    delegated_validator_address: string;
  };

  rpc: {
    host: string;
    port: number;
  };

  automine: {
    enabled: boolean;
    delay: number;
    version: number;
    model: string;
    fee: string; // string for bignum
    input: {
      prompt: string;
    };
  };

  ml: {
    strategy: "cog"|"replicate";
    cog: {
      [key: string]: {
        url: string;
      }
    };
    replicate: {
      api_token: string;
    };
  };

  ipfs: {
    strategy: "http_client"|"pinata";
    http_client: {
      url: string;
    }
    pinata: {
      jwt: string;
    };
  }

  prob: {
    task: number;
    contestation_vote_finish: number;
    contestation_submitted: number;
    solution_submitted: number;
    task_retracted: number;
  }
}

export interface Task {
  model: string;
  fee: BigNumber;
  owner: string;
  blocktime: BigNumber;
  version: number;
  cid: string;
}

export interface Solution {
  validator: string;
  blocktime: BigNumber;
  claimed: boolean;
  cid: string;
}

export interface Job {
  priority: number;
  waituntil: number;
  concurrent: boolean;
  method: string;
  data: string;
}

export interface MiningFilter {
  minfee:  BigNumber;
  mintime: number;
  owner?:  string;
}

export interface Model {
  // modelid
  id: string;
  // which template to use for generating response
  template: any;
  // does model generate mining rewards
  mineable: boolean;
  // these iterated over each task to check if it fits filter
  filters: MiningFilter[];

  // function that uses ml strategy and returns list of files
  getfiles: (m: Model, taskid: string, input: any) => Promise<string[]>;

  // function that mines and returns cid
  getcid: (MiningConfig: any, m: Model, taskid: string, input: any) => Promise<string|null>;
}

export interface DBTask {
  id: string;
  modelid: string;
  fee: string;
  address: string;
  blocktime: string;
  version: number;
  cid: string;
  retracted: boolean;
};

export interface DBInvalidTask {
  taskid: string;
};

export interface DBSolution {
  id: number;
  taskid: string;
  validator: string;
  blocktime: string;
  claimed: boolean;
  cid: string;
};

export interface DBContestation {
  id: number;
  taskid: string;
  validator: string;
  blocktime: string;
  finish_start_index: boolean;
};

export interface DBContestationVote {
  id: number;
  taskid: string;
  validator: string;
  yea: boolean;
}

export interface DBTaskTxid {
  taskid: string;
  txid: string;
}

export interface DBTaskInput {
  taskid: string;
  cid: string;
  data: string;
}

export interface DBJob {
  id: number;
  priority: number;
  waituntil: number;
  concurrent: boolean;
  method: string;
  data: string;
}

export interface FilterResult {
  modelEnabled: boolean;
  filterPassed: boolean;
  modelTemplate: any;
}

export interface QueueJobProps {
  method: string;
  priority: number;
  waituntil: number;
  concurrent: boolean;
  data: any;
}

export interface StoreTaskProps {
  taskid: string;
  modelid: string;
  fee: BigNumber;
  owner: string;
  blocktime: BigNumber;
  version: number;
  cid: string;
}

export interface StoreSolutionProps {
  taskid: string;
  validator: string;
  blocktime: BigNumber;
  claimed: boolean;
  cid: string;
}

export interface StoreContestationProps {
  taskid: string;
  validator: string;
  blocktime: BigNumber;
  finish_start_index: number;
}

export interface StoreContestationVoteProps {
  taskid: string;
  validator: string;
  yea: boolean;
}

export interface InputHydrationResult {
  input: any|null;
  err: boolean;
  errmsg: string;
}
