import { ethers } from 'ethers';

// Configuration types
export interface MiningConfig {
  log_path: string;
  db_path: string;
  stake_buffer_percent: number;
  stake_buffer_topup_percent: number;
  evilmode: boolean;
  read_only: boolean;
  cache_path: string;
  blockchain: BlockchainConfig;
  rpc: RpcConfig;
  ml: MLConfig;
  ipfs: IPFSConfig;
}

export interface BlockchainConfig {
  rpc_url: string;
}

export interface RpcConfig {
  host: string;
  port: number;
}

export interface MLConfig {
  strategy: 'cog' | 'replicate';
  replicate?: ReplicateConfig;
  cog?: Record<string, CogConfig>;
}

export interface ReplicateConfig {
  api_token: string | null;
}

export interface CogConfig {
  url: string;
}

export interface IPFSConfig {
  strategy: 'pinata' | 'http_client';
  pinata?: PinataConfig;
  http_client?: HttpClientConfig;
}

export interface PinataConfig {
  jwt: string;
}

export interface HttpClientConfig {
  url: string;
}

// Model template types
export interface ModelTemplate {
  meta: ModelMeta;
  input: ModelInput[];
  output: ModelOutput[];
}

export interface ModelMeta {
  title: string;
  description: string;
  git: string;
  docker: string;
  version: number;
}

export interface ModelInput {
  variable: string;
  type: 'string' | 'int' | 'decimal' | 'string_enum' | 'int_enum';
  required: boolean;
  default: string | number;
  description: string;
  min?: number;
  max?: number;
  choices?: (string | number)[];
}

export interface ModelOutput {
  filename: string;
  type: 'text' | 'image' | 'video' | 'audio';
}

// Model configuration
export interface ModelConfig {
  id: string;
  name: string;
  template: ModelTemplate;
  replicateModel?: string; // e.g., "qwen/qwen-image"
  cogUrl?: string;
}

// Task types
export interface TaskData {
  taskid: string;
  modelId: string;
  input: Record<string, any>;
  owner: string;
  fee: bigint;
}

export interface TaskJob {
  id: string;
  taskid: string;
  modelConfig: ModelConfig;
  input: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  error?: string;
  cid?: string;
  chatId?: number;
  messageId?: number;
  telegramId?: number;
  progress?: string;
  wonReward?: boolean;
}

// Hydration result
export interface HydrationResult {
  input: Record<string, any>;
  err: boolean;
  errmsg: string;
}

// Model handler interface
export interface IModelHandler {
  getFiles(taskid: string, input: Record<string, any>): Promise<string[]>;
  getCid(taskid: string, input: Record<string, any>): Promise<string>;
}

// Job queue interface
export interface IJobQueue {
  addJob(job: Omit<TaskJob, 'id' | 'status' | 'createdAt'>): Promise<TaskJob>;
  getJob(id: string): TaskJob | undefined;
  getJobByTaskId(taskid: string): TaskJob | undefined;
  getPendingJobs(): TaskJob[];
  updateJobStatus(id: string, status: TaskJob['status'], updates?: Partial<TaskJob>): void;
  processNext(): Promise<void>;
}

// Contract event types
export interface TaskSubmittedEvent {
  taskid: string;
  modelId: string;
  fee: bigint;
  sender: string;
  input: string;
}

// Service interfaces
export interface IBlockchainService {
  getWalletAddress(): string;
  getBalance(): Promise<bigint>;
  getValidatorStake(): Promise<bigint>;
  submitTask(modelId: string, input: string, fee: bigint): Promise<string>;
  submitSolution(taskid: string, cid: string): Promise<void>;
  signalCommitment(commitment: string): Promise<void>;
  getSolution(taskid: string): Promise<{ validator: string; cid: string }>;
  findTransactionByTaskId(taskid: string): Promise<{ txHash: string; prompt: string; modelId: string } | null>;
}

export interface IIPFSService {
  pinFiles(taskid: string, paths: string[]): Promise<string>;
  pinFile(content: Buffer, filename: string): Promise<string>;
}
