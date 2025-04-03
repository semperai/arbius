// Model type
export interface Model {
  id: string;
  name: string;
  fee: string | bigint;
  addr: string;
  rate: number;
  usage?: string | number;
  successRate?: number;
  cid?: string;
}

// Task type
export interface Task {
  id: string;
  model: string;
  fee: string | bigint;
  owner: string;
  blocktime: number;
  time?: string; // For display purposes (e.g., "3h ago")
  version: number;
  cid: string;
  status?: 'Completed' | 'Pending' | 'Contested';
  hasSolution?: boolean;
  hasContestation?: boolean;
  solutionClaimed?: boolean;
}

// Solution type
export interface Solution {
  validator: string;
  blocktime: number;
  claimed: boolean;
  claimedAt?: number;
  cid: string;
}

// Contestation type
export interface Contestation {
  validator: string;
  blocktime: number;
  finish_start_index: number;
  slashAmount: string | bigint;
  status: string;
  votesYea: number;
  votesNay: number;
  voteEndTime: number;
  recentVotes?: ContestationVote[];
}

// Vote on a contestation
export interface ContestationVote {
  validator: string;
  vote: 'Yea' | 'Nay';
}

// Validator type
export interface Validator {
  address: string;
  staked: string | bigint;
  since: number;
}

// Model metadata
export interface ModelMeta {
  title: string;
  description: string;
  git?: string;
  docker?: string;
  version: number;
}

// Base input type with common properties
interface BaseInput {
  variable: string;
  required: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: any;
  description: string;
}

// String input type
export interface StringInput extends BaseInput {
  type: 'string';
}

// Integer input type
export interface IntInput extends BaseInput {
  type: 'int';
  min?: number;
  max?: number;
}

// Decimal input type
export interface DecimalInput extends BaseInput {
  type: 'decimal';
  min?: number;
  max?: number;
}

// String enum input type
export interface StringEnumInput extends BaseInput {
  type: 'string_enum';
  choices: string[];
}

// Integer enum input type
export interface IntEnumInput extends BaseInput {
  type: 'int_enum';
  choices: number[];
}

// Union type for all possible input types
export type ModelInput = StringInput | IntInput | DecimalInput | StringEnumInput | IntEnumInput;

// Output file type
export interface ModelOutput {
  filename: string;
  type: 'image' | 'video' | 'text' | 'audio';
}

// Complete model schema
export interface ModelSchema {
  meta: ModelMeta;
  input: ModelInput[];
  output: ModelOutput[];
}
