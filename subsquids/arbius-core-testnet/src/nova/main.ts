import {TypeormDatabase} from '@subsquid/typeorm-store'
import {
    TaskSubmitted,
    TaskRetracted,
    SolutionSubmitted,
    SolutionClaimed,
    ContestationSubmitted,
    ContestationVote,
    ContestationVoteFinish,
    ModelRegistered,
    ValidatorDeposit,
    ValidatorWithdrawInitiated,
    ValidatorWithdrawCancelled,
    ValidatorWithdraw,
} from '../model'
import * as arbius from '../abi/arbius'
import {processor, NOVA_ENGINE_ADDRESS} from './processor'

processor.run(new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: 'nova_processor',
}), async (ctx) => {
    const taskSubmitted:          TaskSubmitted[]          = []
    const taskRetracted:          TaskRetracted[]          = []
    const solutionSubmitted:      SolutionSubmitted[]      = []
    const solutionClaimed:        SolutionClaimed[]        = []
    const contestationSubmitted:  ContestationSubmitted[]  = []
    const contestationVotes:      ContestationVote[]       = []
    const contestationVoteFinish: ContestationVoteFinish[] = []
    const modelRegistered:        ModelRegistered[]        = []
    const validatorDeposits:      ValidatorDeposit[]       = []
    const validatorWithdrawInitiated: ValidatorWithdrawInitiated[] = []
    const validatorWithdrawCancelled: ValidatorWithdrawCancelled[] = []
    const validatorWithdraw:      ValidatorWithdraw[]      = []


    for (const c of ctx.blocks) {
        for (const log of c.logs) {
            if (log.address !== NOVA_ENGINE_ADDRESS) continue;

            if (log.topics[0] === arbius.events.TaskSubmitted.topic) {
              const {
                id: taskID,
                model: modelID,
                fee,
                sender,
              } = arbius.events.TaskSubmitted.decode(log)
              taskSubmitted.push(
                  new TaskSubmitted({
                      id: log.id,
                      network: 'nova',
                      block: c.header.height,
                      timestamp: new Date(c.header.timestamp),
                      taskID,
                      modelID,
                      fee,
                      sender,
                      txHash: log.transactionHash
                  })
              )
            }
            else if (log.topics[0] === arbius.events.TaskRetracted.topic) {
              const {
                id: taskID,
              } = arbius.events.TaskRetracted.decode(log)
              taskRetracted.push(
                  new TaskRetracted({
                      id: log.id,
                      network: 'nova',
                      block: c.header.height,
                      timestamp: new Date(c.header.timestamp),
                      taskID,
                      txHash: log.transactionHash
                  })
              )
            }
            else if (log.topics[0] === arbius.events.SolutionSubmitted.topic) {
              const {
                task: taskID,
                addr: validator,
              } = arbius.events.SolutionSubmitted.decode(log)
              solutionSubmitted.push(
                  new SolutionSubmitted({
                      id: log.id,
                      network: 'nova',
                      block: c.header.height,
                      timestamp: new Date(c.header.timestamp),
                      taskID,
                      validator,
                      txHash: log.transactionHash
                  })
              )
            }
            else if (log.topics[0] === arbius.events.SolutionClaimed.topic) {
              const {
                task: taskID,
                addr: validator,
              } = arbius.events.SolutionClaimed.decode(log)
              solutionClaimed.push(
                  new SolutionClaimed({
                      id: log.id,
                      network: 'nova',
                      block: c.header.height,
                      timestamp: new Date(c.header.timestamp),
                      taskID,
                      validator,
                      txHash: log.transactionHash
                  })
              )
            }
            else if (log.topics[0] === arbius.events.ContestationSubmitted.topic) {
              const {
                addr: address,
                task: taskID,
              } = arbius.events.ContestationSubmitted.decode(log)
              contestationSubmitted.push(
                  new ContestationSubmitted({
                      id: log.id,
                      network: 'nova',
                      block: c.header.height,
                      timestamp: new Date(c.header.timestamp),
                      address,
                      taskID,
                      txHash: log.transactionHash
                  })
              )
            }
            else if (log.topics[0] === arbius.events.ContestationVote.topic) {
                  const {
                    addr: address,
                    task: taskID,
                    yea,
                  } = arbius.events.ContestationVote.decode(log)
                  contestationVotes.push(
                      new ContestationVote({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          address,
                          taskID,
                          yea,
                          txHash: log.transactionHash
                      })
                  )
            }
            else if (log.topics[0] === arbius.events.ContestationVoteFinish.topic) {
                  const {
                    id: taskID,
                    start_idx: startIndex,
                    end_idx: endIndex,
                  } = arbius.events.ContestationVoteFinish.decode(log)
                  contestationVoteFinish.push(
                      new ContestationVoteFinish({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          taskID,
                          startIndex,
                          endIndex,
                          txHash: log.transactionHash
                      })
                  )
            }
            else if (log.topics[0] === arbius.events.ModelRegistered.topic) {
                  const {
                    id: modelID,
                  } = arbius.events.ModelRegistered.decode(log)
                  modelRegistered.push(
                      new ModelRegistered({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          modelID,
                          txHash: log.transactionHash
                      })
                  )
            }
            else if (log.topics[0] === arbius.events.ValidatorDeposit.topic) {
                  const {
                    addr: from,
                    validator,
                    amount,
                  } = arbius.events.ValidatorDeposit.decode(log)
                  validatorDeposits.push(
                      new ValidatorDeposit({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          from,
                          validator,
                          amount,
                          txHash: log.transactionHash
                      })
                  )
            }
            else if (log.topics[0] === arbius.events.ValidatorWithdrawInitiated.topic) {
                  const {
                    addr: validator,
                    count,
                    unlockTime,
                    amount,
                  } = arbius.events.ValidatorWithdrawInitiated.decode(log)
                  validatorWithdrawInitiated.push(
                      new ValidatorWithdrawInitiated({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          validator,
                          count: parseInt(count.toString()),
                          unlockTime: new Date(parseInt(unlockTime.toString())*1000),
                          amount,
                          txHash: log.transactionHash
                      })
                  )
            }
            else if (log.topics[0] === arbius.events.ValidatorWithdrawCancelled.topic) {
                  const {
                    addr: validator,
                    count,
                  } = arbius.events.ValidatorWithdrawCancelled.decode(log)
                  validatorWithdrawCancelled.push(
                      new ValidatorWithdrawCancelled({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          validator,
                          count: parseInt(count.toString()),
                          txHash: log.transactionHash
                      })
                  )
            }
            else if (log.topics[0] === arbius.events.ValidatorWithdraw.topic) {
                  const {
                    addr: validator,
                    to,
                    count,
                    amount,
                  } = arbius.events.ValidatorWithdraw.decode(log)
                  validatorWithdraw.push(
                      new ValidatorWithdraw({
                          id: log.id,
                          network: 'nova',
                          block: c.header.height,
                          timestamp: new Date(c.header.timestamp),
                          validator,
                          to,
                          count: parseInt(count.toString()),
                          amount,
                          txHash: log.transactionHash
                      })
                  )
            }
        }
    }

    await ctx.store.upsert(taskSubmitted)
    await ctx.store.upsert(taskRetracted)
    await ctx.store.upsert(solutionSubmitted)
    await ctx.store.upsert(solutionClaimed)
    await ctx.store.upsert(contestationSubmitted)
    await ctx.store.upsert(contestationVotes)
    await ctx.store.upsert(contestationVoteFinish)
    await ctx.store.upsert(modelRegistered)
    await ctx.store.upsert(validatorDeposits)
    await ctx.store.upsert(validatorWithdrawInitiated)
    await ctx.store.upsert(validatorWithdrawCancelled)
    await ctx.store.upsert(validatorWithdraw)
})
