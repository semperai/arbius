import { ethers } from 'ethers';

// Define TypeScript interfaces for our data structures
export interface Task {
  id: string;
  model: string;
  fee: string;
  owner: string;
  blocktime: Date;
  version: number;
  cid: string;
  solution: Solution;
  contestation: Contestation;
  hasContestation: boolean;
}

export interface Solution {
  validator: string;
  blocktime: Date | null;
  claimed: boolean;
  cid: string | null;
}

export interface Contestation {
  validator: string;
  blocktime: Date | null;
  finish_start_index: number;
  slashAmount: string;
}

export interface Model {
  id: string;
  fee: string;
  addr: string;
  rate: string;
  cid: string;
}

export interface Validator {
  address: string;
  staked: string;
  since: Date | null;
  addr: string;
}

export interface ContractInfo {
  baseToken: string;
  treasury: string;
  paused: boolean;
  accruedFees: string;
  startBlockTime: Date;
  version: number;
  validatorMinimumPercentage: string;
  slashAmountPercentage: string;
  solutionFeePercentage: string;
  retractionFeePercentage: string;
  treasuryRewardPercentage: string;
}

// Arbius ABI - This is a simplified ABI with just the functions we need
const ARBIUS_ABI = [
  // Task functions
  "function tasks(bytes32) view returns (bytes32 model, uint256 fee, address owner, uint64 blocktime, uint8 version, bytes cid)",
  "function solutions(bytes32) view returns (address validator, uint64 blocktime, bool claimed, bytes cid)",
  "function contestations(bytes32) view returns (address validator, uint64 blocktime, uint32 finish_start_index, uint256 slashAmount)",

  // Model functions
  "function models(bytes32) view returns (uint256 fee, address addr, uint256 rate, bytes cid)",

  // Validator functions
  "function validators(address) view returns (uint256 staked, uint256 since, address addr)",

  // Other getters
  "function baseToken() view returns (address)",
  "function treasury() view returns (address)",
  "function paused() view returns (bool)",
  "function accruedFees() view returns (uint256)",
  "function startBlockTime() view returns (uint64)",
  "function version() view returns (uint256)",
  "function validatorMinimumPercentage() view returns (uint256)",
  "function slashAmountPercentage() view returns (uint256)",
  "function solutionFeePercentage() view returns (uint256)",
  "function retractionFeePercentage() view returns (uint256)",
  "function treasuryRewardPercentage() view returns (uint256)",
];

// Contract address on Arbitrum One
// Note: Replace with the actual contract address
const ARBIUS_CONTRACT_ADDRESS = "0xYourArbiusContractAddress";

// Provider setup - using a singleton pattern to avoid multiple providers
let provider: ethers.JsonRpcProvider | null = null;

export async function getProvider(): Promise<ethers.JsonRpcProvider> {
  if (!provider) {
    provider = new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
  }
  return provider;
}

// Contract instance
export async function getContract(): Promise<ethers.Contract> {
  const provider = await getProvider();
  return new ethers.Contract(ARBIUS_CONTRACT_ADDRESS, ARBIUS_ABI, provider);
}

// Task-related functions
export async function getTask(taskId: string): Promise<Task | null> {
  const contract = await getContract();
  try {
    const task = await contract.tasks(taskId);
    const solution = await contract.solutions(taskId);
    const contestation = await contract.contestations(taskId);

    return {
      id: taskId,
      model: task.model,
      fee: ethers.formatUnits(task.fee, 18), // Assuming 18 decimals
      owner: task.owner,
      blocktime: new Date(Number(task.blocktime) * 1000), // Convert to JS Date
      version: Number(task.version),
      cid: task.cid.length > 2 ? ethers.toUtf8String(task.cid) : '',
      solution: {
        validator: solution.validator,
        blocktime: solution.blocktime > 0 ? new Date(Number(solution.blocktime) * 1000) : null,
        claimed: solution.claimed,
        cid: solution.cid && solution.cid.length > 2 ? ethers.toUtf8String(solution.cid) : null
      },
      contestation: {
        validator: contestation.validator || ethers.ZeroAddress,
        blocktime: contestation.blocktime > 0 ? new Date(Number(contestation.blocktime) * 1000) : null,
        finish_start_index: Number(contestation.finish_start_index),
        slashAmount: ethers.formatUnits(contestation.slashAmount, 18) // Assuming 18 decimals
      },
      hasContestation: contestation.validator !== ethers.ZeroAddress
    };
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
}

// Model-related functions
export async function getModel(modelId: string): Promise<Model | null> {
  const contract = await getContract();
  try {
    const model = await contract.models(modelId);

    return {
      id: modelId,
      fee: ethers.formatUnits(model.fee, 18), // Assuming 18 decimals
      addr: model.addr,
      rate: ethers.formatUnits(model.rate, 18), // Assuming 18 decimals
      cid: model.cid.length > 2 ? ethers.toUtf8String(model.cid) : ''
    };
  } catch (error) {
    console.error("Error fetching model:", error);
    return null;
  }
}

// Validator-related functions
export async function getValidator(address: string): Promise<Validator | null> {
  const contract = await getContract();
  try {
    const validator = await contract.validators(address);

    return {
      address: address,
      staked: ethers.formatUnits(validator.staked, 18), // Assuming 18 decimals
      since: validator.since > 0 ? new Date(Number(validator.since) * 1000) : null,
      addr: validator.addr
    };
  } catch (error) {
    console.error("Error fetching validator:", error);
    return null;
  }
}

// Get contract information
export async function getContractInfo(): Promise<ContractInfo | null> {
  const contract = await getContract();
  try {
    const [
      baseToken,
      treasury,
      paused,
      accruedFees,
      startBlockTime,
      version,
      validatorMinimumPercentage,
      slashAmountPercentage,
      solutionFeePercentage,
      retractionFeePercentage,
      treasuryRewardPercentage
    ] = await Promise.all([
      contract.baseToken(),
      contract.treasury(),
      contract.paused(),
      contract.accruedFees(),
      contract.startBlockTime(),
      contract.version(),
      contract.validatorMinimumPercentage(),
      contract.slashAmountPercentage(),
      contract.solutionFeePercentage(),
      contract.retractionFeePercentage(),
      contract.treasuryRewardPercentage()
    ]);

    return {
      baseToken,
      treasury,
      paused,
      accruedFees: ethers.formatUnits(accruedFees, 18), // Assuming 18 decimals
      startBlockTime: new Date(Number(startBlockTime) * 1000),
      version: Number(version),
      validatorMinimumPercentage: validatorMinimumPercentage.toString(),
      slashAmountPercentage: slashAmountPercentage.toString(),
      solutionFeePercentage: solutionFeePercentage.toString(),
      retractionFeePercentage: retractionFeePercentage.toString(),
      treasuryRewardPercentage: treasuryRewardPercentage.toString()
    };
  } catch (error) {
    console.error("Error fetching contract info:", error);
    return null;
  }
}

// Helper function to parse IPFS CID
export function parseIPFSCid(cid: string | Uint8Array): string | null {
  if (!cid || cid === '0x' || cid === '') return null;
  try {
    return typeof cid === 'string' ? cid : ethers.toUtf8String(cid);
  } catch (error) {
    console.error("Error parsing IPFS CID:", error);
    return null;
  }
}

// Helper to format addresses for display
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper to check if an address is valid
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}

// Helper to check if a task ID is valid
export function isValidTaskId(taskId: string): boolean {
  try {
    // Check if it's a valid 32-byte hex string
    return ethers.isHexString(taskId) && taskId.length === 66; // 0x + 64 chars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
}

// Mock data for development
export function getMockTasks(): Task[] {
  return [
    {
      id: '0x1309128093aa6234231eee34234234eff7778aa8a',
      model: '0x2309128093aa6234231eee34234234eff7778bb8b',
      fee: '0.25',
      owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      blocktime: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      version: 1,
      cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      solution: {
        validator: '0x8B3392483BA26D65E331dB86D4F99574Ff04c2FA',
        blocktime: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
        claimed: false,
        cid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx'
      },
      contestation: {
        validator: ethers.ZeroAddress,
        blocktime: null,
        finish_start_index: 0,
        slashAmount: '0'
      },
      hasContestation: false
    },
    {
      id: '0x2309128093bb6234231fff34234234eff7778cc8c',
      model: '0x3309128093cc6234231ggg34234234eff7778dd8d',
      fee: '0.5',
      owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      blocktime: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      version: 1,
      cid: 'QmX6xDLY7yP2gb7R1fVL9EWJaS8gfC3E5oFMvHTXR8aRbk',
      solution: {
        validator: '0x8B3392483BA26D65E331dB86D4F99574Ff04c2FA',
        blocktime: new Date(Date.now() - 1000 * 60 * 100), // 100 mins ago
        claimed: true,
        cid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx'
      },
      contestation: {
        validator: ethers.ZeroAddress,
        blocktime: null,
        finish_start_index: 0,
        slashAmount: '0'
      },
      hasContestation: false
    },
    {
      id: '0x3309128093cc6234231ggg34234234eff7778dd8d',
      model: '0x2309128093aa6234231eee34234234eff7778bb8b',
      fee: '0.1',
      owner: '0x8B3392483BA26D65E331dB86D4F99574Ff04c2FA',
      blocktime: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      version: 1,
      cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      solution: {
        validator: '0x8B3392483BA26D65E331dB86D4F99574Ff04c2FA',
        blocktime: new Date(Date.now() - 1000 * 60 * 160), // 160 mins ago
        claimed: true,
        cid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx'
      },
      contestation: {
        validator: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        blocktime: new Date(Date.now() - 1000 * 60 * 140), // 140 mins ago
        finish_start_index: 0,
        slashAmount: '0.01'
      },
      hasContestation: true
    }
  ];
}
