import { PublicClient, decodeEventLog, parseAbiItem } from 'viem'
import { IPFS_GATEWAY } from '@/config/arbius'

// Event ABIs from V2_EngineV6 contract
const TASK_SUBMITTED_EVENT = parseAbiItem(
  'event TaskSubmitted(bytes32 indexed id, bytes32 indexed model, uint256 fee, address indexed sender)'
)

const SOLUTION_SUBMITTED_EVENT = parseAbiItem(
  'event SolutionSubmitted(address indexed addr, bytes32 indexed task)'
)

export interface TaskSubmittedEvent {
  taskId: string
  model: string
  fee: bigint
  sender: string
  blockNumber: bigint
  transactionHash: string
}

export interface SolutionSubmittedEvent {
  validator: string
  taskId: string
  blockNumber: bigint
  transactionHash: string
}

/**
 * Watch for TaskSubmitted event and extract task ID
 */
export async function watchTaskSubmitted(
  publicClient: PublicClient,
  txHash: string,
  engineAddress: string,
  timeoutMs: number = 30000
): Promise<TaskSubmittedEvent | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })

      if (receipt) {
        // Find TaskSubmitted event in logs
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== engineAddress.toLowerCase()) continue

          try {
            const decoded = decodeEventLog({
              abi: [TASK_SUBMITTED_EVENT],
              data: log.data,
              topics: log.topics,
            })

            if (decoded.eventName === 'TaskSubmitted') {
              return {
                taskId: decoded.args.id as string,
                model: decoded.args.model as string,
                fee: decoded.args.fee as bigint,
                sender: decoded.args.sender as string,
                blockNumber: receipt.blockNumber,
                transactionHash: receipt.transactionHash,
              }
            }
          } catch (e) {
            // Not the event we're looking for, continue
            continue
          }
        }

        // Receipt found but no TaskSubmitted event
        return null
      }
    } catch (error) {
      console.error('Error fetching transaction receipt:', error)
    }

    // Wait 1 second before retry
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error('Timeout waiting for transaction confirmation')
}

/**
 * Watch for SolutionSubmitted event for a specific task
 */
export async function watchSolutionSubmitted(
  publicClient: PublicClient,
  taskId: string,
  engineAddress: string,
  fromBlock: bigint,
  timeoutMs: number = 120000 // 2 minutes
): Promise<SolutionSubmittedEvent | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    try {
      const currentBlock = await publicClient.getBlockNumber()

      // Get logs for SolutionSubmitted event
      const logs = await publicClient.getLogs({
        address: engineAddress as `0x${string}`,
        event: SOLUTION_SUBMITTED_EVENT,
        args: {
          task: taskId as `0x${string}`,
        },
        fromBlock,
        toBlock: currentBlock,
      })

      if (logs.length > 0) {
        const log = logs[0]
        return {
          validator: log.args.addr as string,
          taskId: log.args.task as string,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        }
      }
    } catch (error) {
      console.error('Error watching for solution:', error)
    }

    // Wait 3 seconds before retry
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return null
}

// IPFS gateway fallback list
const IPFS_GATEWAYS = [
  'https://ipfs.arbius.org',
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://gateway.pinata.cloud',
]

/**
 * Fetch task data from IPFS with gateway fallbacks (tries all gateways in parallel)
 */
export async function fetchTaskFromIPFS(cid: string): Promise<any> {
  const fetchPromises = IPFS_GATEWAYS.map(async (gateway) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout per gateway

    try {
      const url = `${gateway}/ipfs/${cid}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`IPFS fetch failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      console.warn(`Failed to fetch from ${gateway}:`, error)
      throw error
    }
  })

  // Race all gateways - return first successful result
  try {
    return await Promise.any(fetchPromises)
  } catch (error) {
    console.error('All IPFS gateways failed:', error)
    throw new Error('Failed to fetch from all IPFS gateways')
  }
}

/**
 * Get task solution CID from contract
 */
export async function getTaskSolutionCid(
  publicClient: PublicClient,
  engineAddress: string,
  taskId: string,
  engineAbi: any
): Promise<string | null> {
  try {
    const solution = await publicClient.readContract({
      address: engineAddress as `0x${string}`,
      abi: engineAbi,
      functionName: 'solutions',
      args: [taskId],
    }) as any

    if (solution && solution.cid) {
      // Convert bytes to IPFS CID (assuming CIDv0 or CIDv1)
      const cidBytes = solution.cid as `0x${string}`
      // Remove 0x prefix and decode
      const cidHex = cidBytes.slice(2)

      // For CIDv0 (Qm...), it starts with 0x1220 (sha256 multihash)
      if (cidHex.startsWith('1220')) {
        const hashHex = cidHex.slice(4)
        // Convert to base58 (simplified - in production use multibase library)
        // For now, return the hex representation
        return `bafkrei${hashHex.slice(0, 50)}` // Placeholder
      }

      return cidHex
    }

    return null
  } catch (error) {
    console.error('Error getting solution CID:', error)
    return null
  }
}

/**
 * Poll for task completion and return result
 */
export async function pollTaskCompletion(
  publicClient: PublicClient,
  taskId: string,
  engineAddress: string,
  engineAbi: any,
  fromBlock: bigint,
  maxAttempts: number = 40, // 2 minutes with 3s intervals
  intervalMs: number = 3000
): Promise<any | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Check if solution exists on-chain
      const solutionCid = await getTaskSolutionCid(publicClient, engineAddress, taskId, engineAbi)

      if (solutionCid) {
        // Fetch result from IPFS
        const result = await fetchTaskFromIPFS(solutionCid)
        return result
      }

      // Also check for SolutionSubmitted event
      const solutionEvent = await watchSolutionSubmitted(
        publicClient,
        taskId,
        engineAddress,
        fromBlock,
        intervalMs
      )

      if (solutionEvent) {
        // Try to get solution CID again
        const cid = await getTaskSolutionCid(publicClient, engineAddress, taskId, engineAbi)
        if (cid) {
          const result = await fetchTaskFromIPFS(cid)
          return result
        }
      }
    } catch (error) {
      console.error(`Polling attempt ${i + 1} failed:`, error)
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return null
}
