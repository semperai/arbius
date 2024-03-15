import {assertNotNull} from '@subsquid/util-internal'
import {lookupArchive} from '@subsquid/archive-registry'
import {
    BlockHeader,
    DataHandlerContext,
    EvmBatchProcessor,
    EvmBatchProcessorFields,
    Log as _Log,
    Transaction as _Transaction,
} from '@subsquid/evm-processor'
import {Store} from '@subsquid/typeorm-store'
import * as arbiusabi from '../abi/arbius'

export const NOVA_ENGINE_ADDRESS = '0x3BF6050327Fa280Ee1B5F3e8Fd5EA2EfE8A6472a'.toLowerCase()

export const processor = new EvmBatchProcessor()
    // Lookup archive by the network name in Subsquid registry
    // See https://docs.subsquid.io/evm-indexing/supported-networks/
    .setGateway(lookupArchive('arbitrum-nova'))
    // Chain RPC endpoint is required for
    //  - indexing unfinalized blocks https://docs.subsquid.io/basics/unfinalized-blocks/
    //  - querying the contract state https://docs.subsquid.io/evm-indexing/query-state/
    .setRpcEndpoint({
        // Set via .env for local runs or via secrets when deploying to Subsquid Cloud
        // https://docs.subsquid.io/deploy-squid/env-variables/
        url: assertNotNull(process.env.RPC_ARBITRUM_NOVA_HTTP),
        // More RPC connection options at https://docs.subsquid.io/evm-indexing/configuration/initialization/#set-data-source
        rateLimit: 100
    })
    .setFinalityConfirmation(5)
    .setFields({
        log: {
            transactionHash: true
        }
    })
    .setBlockRange({
        from: 51142045,
    })
    .addLog({
        address: [NOVA_ENGINE_ADDRESS],
        topic0: [
            // arbiusabi.events.TaskSubmitted.topic,
            // arbiusabi.events.TaskRetracted.topic,
            // arbiusabi.events.SolutionSubmitted.topic,
            // arbiusabi.events.SolutionClaimed.topic,
            arbiusabi.events.ContestationSubmitted.topic,
            arbiusabi.events.ContestationVote.topic,
            arbiusabi.events.ContestationVoteFinish.topic,
            arbiusabi.events.ModelRegistered.topic,
            arbiusabi.events.ValidatorDeposit.topic,
            arbiusabi.events.ValidatorWithdrawInitiated.topic,
            arbiusabi.events.ValidatorWithdrawCancelled.topic,
            arbiusabi.events.ValidatorWithdraw.topic,
        ],
    })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
