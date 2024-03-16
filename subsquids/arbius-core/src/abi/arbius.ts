import * as ethers from 'ethers'
import {LogEvent, Func, ContractBase} from './abi.support'
import {ABI_JSON} from './arbius.abi'

export const abi = new ethers.Interface(ABI_JSON);

export const events = {
    ContestationSubmitted: new LogEvent<([addr: string, task: string] & {addr: string, task: string})>(
        abi, '0x6958c989e915d3e41a35076e3c480363910055408055ad86ae1ee13d41c40640'
    ),
    ContestationVote: new LogEvent<([addr: string, task: string, yea: boolean] & {addr: string, task: string, yea: boolean})>(
        abi, '0x1aa9e4be46e24e1f2e7eeb1613c01629213cd42965d2716e18531b63e552e411'
    ),
    ContestationVoteFinish: new LogEvent<([id: string, start_idx: number, end_idx: number] & {id: string, start_idx: number, end_idx: number})>(
        abi, '0x71d8c71303e35a39162e33a402c9897bf9848388537bac7d5e1b0d202eca4e66'
    ),
    ExitValidatorMinUnlockTimeChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0x7bf73d8c24113d60e7de7e92ae237284cf5a6f8dfe31e8eee1c6d9c8890e13c9'
    ),
    Initialized: new LogEvent<([version: number] & {version: number})>(
        abi, '0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498'
    ),
    MaxContestationValidatorStakeSinceChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0xdb340415b83e58bab317964518d523baabcc1571de3b5d8fe6ebd52c704d31a9'
    ),
    MinClaimSolutionTimeChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0xed28aed8b87631da9bc750c8885c00f9beda7f694a23bb732d987aa80214a63f'
    ),
    MinContestationVotePeriodTimeChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0x3a559dce5761b4b2e6099b6dc8d51f7eb190932dc5797d8090daf1a42cd58e7d'
    ),
    MinRetractionWaitTimeChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0x2cf38ed7da57dd510fa6ecbfb991949cdde5c808acbe85cfa940b642def628ed'
    ),
    ModelRegistered: new LogEvent<([id: string] & {id: string})>(
        abi, '0xa4b0af38d049ba81703a0d0e46cc2ff39681210302134046237111a8fb7dee72'
    ),
    OwnershipTransferred: new LogEvent<([previousOwner: string, newOwner: string] & {previousOwner: string, newOwner: string})>(
        abi, '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0'
    ),
    PausedChanged: new LogEvent<([paused: boolean] & {paused: boolean})>(
        abi, '0xd83d5281277e107f080e362699d46082adb74e7dc6a9bccbc87d8ae9533add44'
    ),
    PauserTransferred: new LogEvent<([to: string] & {to: string})>(
        abi, '0x5a85b4270fc1e75035e6cd505418ce65e0bcc36cc7eb9ce9e6f8c6181d4cb577'
    ),
    RetractionFeePercentageChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0x248f32867b202a570ffbb94e864b6075503b4961c00317f152604ee3b8de4dda'
    ),
    SignalCommitment: new LogEvent<([addr: string, commitment: string] & {addr: string, commitment: string})>(
        abi, '0x09b4c028a2e50fec6f1c6a0163c59e8fbe92b231e5c03ef3adec585e63a14b92'
    ),
    SignalSupport: new LogEvent<([addr: string, model: string, supported: boolean] & {addr: string, model: string, supported: boolean})>(
        abi, '0xd17ce9337eb398b61971ca3d8c9933fc401b9669a0607afe3452612583d7c5b8'
    ),
    SlashAmountPercentageChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0x4d3fce9ddc8266ead559213cbaaa8ebcfa0c837a2c9a1e814bae160b615d30dd'
    ),
    SolutionClaimed: new LogEvent<([addr: string, task: string] & {addr: string, task: string})>(
        abi, '0x0b76b4ae356796814d36b46f7c500bbd27b2cce1e6059a6fa2bebfd5a389b190'
    ),
    SolutionFeePercentageChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0xa9dfc7ca3151b504bdbe971426324a888f97e7e7a52929484c01dff8168058ab'
    ),
    SolutionMineableRateChange: new LogEvent<([id: string, rate: bigint] & {id: string, rate: bigint})>(
        abi, '0x0321e8a918b4c47bf3677852c070983825f30a47bc8d9416691454fa6a727d63'
    ),
    SolutionStakeAmountChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0xa7597266328022d189bdbb20244e37e01bd5972bf8fa6a76c9b76cb666b23fbc'
    ),
    SolutionSubmitted: new LogEvent<([addr: string, task: string] & {addr: string, task: string})>(
        abi, '0x957c18b5af8413899ea8a576a4d3fb16839a02c9fccfdce098b6d59ef248525b'
    ),
    StartBlockTimeChanged: new LogEvent<([startBlockTime: bigint] & {startBlockTime: bigint})>(
        abi, '0xa15d6b0930a82638ac4775bfd1b2e9f1e86be67e1bd3a09fa8a77a8f079769d7'
    ),
    TaskRetracted: new LogEvent<([id: string] & {id: string})>(
        abi, '0x446efbf8d207f3e2ede58a6bbde7028a4e308488b6293e6461fbb7c288326e76'
    ),
    TaskSubmitted: new LogEvent<([id: string, model: string, fee: bigint, sender: string] & {id: string, model: string, fee: bigint, sender: string})>(
        abi, '0xc3d3e0544c80e3bb83f62659259ae1574f72a91515ab3cae3dd75cf77e1b0aea'
    ),
    TreasuryRewardPercentageChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0x4cedc026426414a08f6f21ca64d85564bf602162bb3463dd2d3e17b58c1da589'
    ),
    TreasuryTransferred: new LogEvent<([to: string] & {to: string})>(
        abi, '0x6bdb9ceff405d990c9b60be9f719fbb80889d5f064e8fd76efd5bea353e90712'
    ),
    ValidatorDeposit: new LogEvent<([addr: string, validator: string, amount: bigint] & {addr: string, validator: string, amount: bigint})>(
        abi, '0x8d4844488c19a90828439e71d14ebad860806d04f8ef8b25a82179fab2699b89'
    ),
    ValidatorMinimumPercentageChanged: new LogEvent<([amount: bigint] & {amount: bigint})>(
        abi, '0xb2ba28b5b5aed3444b23a8597a249678dd98e0062432ef1b0f9a6caa39ceb0ad'
    ),
    ValidatorWithdraw: new LogEvent<([addr: string, to: string, count: bigint, amount: bigint] & {addr: string, to: string, count: bigint, amount: bigint})>(
        abi, '0x109aeff667601aad33abcb7c5df1617754eefd18253d586a95c198cb479b5bd4'
    ),
    ValidatorWithdrawCancelled: new LogEvent<([addr: string, count: bigint] & {addr: string, count: bigint})>(
        abi, '0xf9d5cfcdfe9803069225971ba315f4302add9b477c3441cc363bc38fdb065b90'
    ),
    ValidatorWithdrawInitiated: new LogEvent<([addr: string, count: bigint, unlockTime: bigint, amount: bigint] & {addr: string, count: bigint, unlockTime: bigint, amount: bigint})>(
        abi, '0xcc7e0e76b20394ef965d71c4111d21e1b322bb8775dc2c7acd29eb0d3c3dd96d'
    ),
    VersionChanged: new LogEvent<([version: bigint] & {version: bigint})>(
        abi, '0x8c854a81cb5c93e7e482d30fb9c6f88fdbdb320f10f7a853c2263659b54e563f'
    ),
}

export const functions = {
    accruedFees: new Func<[], {}, bigint>(
        abi, '0x682c2058'
    ),
    baseToken: new Func<[], {}, string>(
        abi, '0xc55dae63'
    ),
    cancelValidatorWithdraw: new Func<[count_: bigint], {count_: bigint}, []>(
        abi, '0xcbd2422d'
    ),
    claimSolution: new Func<[taskid_: string], {taskid_: string}, []>(
        abi, '0x77286d17'
    ),
    commitments: new Func<[_: string], {}, bigint>(
        abi, '0x839df945'
    ),
    contestationVoteFinish: new Func<[taskid_: string, amnt_: number], {taskid_: string, amnt_: number}, []>(
        abi, '0x8b4d7b35'
    ),
    contestationVoteNays: new Func<[_: string, _: bigint], {}, string>(
        abi, '0x303fb0d6'
    ),
    contestationVoteYeas: new Func<[_: string, _: bigint], {}, string>(
        abi, '0xd1f0c941'
    ),
    contestationVoted: new Func<[_: string, _: string], {}, boolean>(
        abi, '0xd2780940'
    ),
    contestationVotedIndex: new Func<[_: string], {}, bigint>(
        abi, '0x17f3e041'
    ),
    contestations: new Func<[_: string], {}, ([validator: string, blocktime: bigint, finish_start_index: number, slashAmount: bigint] & {validator: string, blocktime: bigint, finish_start_index: number, slashAmount: bigint})>(
        abi, '0xd33b2ef5'
    ),
    diffMul: new Func<[t: bigint, ts: bigint], {t: bigint, ts: bigint}, bigint>(
        abi, '0x1f88ea1c'
    ),
    exitValidatorMinUnlockTime: new Func<[], {}, bigint>(
        abi, '0xa53e2525'
    ),
    generateCommitment: new Func<[sender_: string, taskid_: string, cid_: string], {sender_: string, taskid_: string, cid_: string}, string>(
        abi, '0x393cb1c7'
    ),
    generateIPFSCID: new Func<[content_: string], {content_: string}, string>(
        abi, '0x40e8c56d'
    ),
    getPsuedoTotalSupply: new Func<[], {}, bigint>(
        abi, '0x7881c5e6'
    ),
    getReward: new Func<[], {}, bigint>(
        abi, '0x3d18b912'
    ),
    getSlashAmount: new Func<[], {}, bigint>(
        abi, '0x3d57f5d9'
    ),
    getValidatorMinimum: new Func<[], {}, bigint>(
        abi, '0x2258d105'
    ),
    hashModel: new Func<[o_: ([fee: bigint, addr: string, rate: bigint, cid: string] & {fee: bigint, addr: string, rate: bigint, cid: string}), sender_: string], {o_: ([fee: bigint, addr: string, rate: bigint, cid: string] & {fee: bigint, addr: string, rate: bigint, cid: string}), sender_: string}, string>(
        abi, '0x218a3048'
    ),
    hashTask: new Func<[o_: ([model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string] & {model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string}), sender_: string, prevhash_: string], {o_: ([model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string] & {model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string}), sender_: string, prevhash_: string}, string>(
        abi, '0x1466b63a'
    ),
    initialize: new Func<[baseToken_: string, treasury_: string], {baseToken_: string, treasury_: string}, []>(
        abi, '0x485cc955'
    ),
    initiateValidatorWithdraw: new Func<[amount_: bigint], {amount_: bigint}, bigint>(
        abi, '0x0a985737'
    ),
    lastContestationLossTime: new Func<[_: string], {}, bigint>(
        abi, '0x218e6859'
    ),
    maxContestationValidatorStakeSince: new Func<[], {}, bigint>(
        abi, '0x8e6d86fd'
    ),
    minClaimSolutionTime: new Func<[], {}, bigint>(
        abi, '0x92809444'
    ),
    minContestationVotePeriodTime: new Func<[], {}, bigint>(
        abi, '0x7b36006a'
    ),
    minRetractionWaitTime: new Func<[], {}, bigint>(
        abi, '0x00fd7082'
    ),
    models: new Func<[_: string], {}, ([fee: bigint, addr: string, rate: bigint, cid: string] & {fee: bigint, addr: string, rate: bigint, cid: string})>(
        abi, '0xe236f46b'
    ),
    owner: new Func<[], {}, string>(
        abi, '0x8da5cb5b'
    ),
    paused: new Func<[], {}, boolean>(
        abi, '0x5c975abb'
    ),
    pauser: new Func<[], {}, string>(
        abi, '0x9fd0506d'
    ),
    pendingValidatorWithdrawRequests: new Func<[_: string, _: bigint], {}, ([unlockTime: bigint, amount: bigint] & {unlockTime: bigint, amount: bigint})>(
        abi, '0xd2992baa'
    ),
    pendingValidatorWithdrawRequestsCount: new Func<[_: string], {}, bigint>(
        abi, '0xd2307ae4'
    ),
    prevhash: new Func<[], {}, string>(
        abi, '0xc17ddb2a'
    ),
    registerModel: new Func<[addr_: string, fee_: bigint, template_: string], {addr_: string, fee_: bigint, template_: string}, string>(
        abi, '0x4ff03efa'
    ),
    renounceOwnership: new Func<[], {}, []>(
        abi, '0x715018a6'
    ),
    retractTask: new Func<[taskid_: string], {taskid_: string}, []>(
        abi, '0x003f9dd6'
    ),
    retractionFeePercentage: new Func<[], {}, bigint>(
        abi, '0x72dc0ee1'
    ),
    reward: new Func<[t: bigint, ts: bigint], {t: bigint, ts: bigint}, bigint>(
        abi, '0xa4fa8d57'
    ),
    setExitValidatorMinUnlockTime: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0xc3187978'
    ),
    setMaxContestationValidatorStakeSince: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0xaa59e7e7'
    ),
    setMinClaimSolutionTime: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x2f9b03e4'
    ),
    setMinContestationVotePeriodTime: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0xb66badbf'
    ),
    setMinRetractionWaitTime: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x7683dbfb'
    ),
    setPaused: new Func<[paused_: boolean], {paused_: boolean}, []>(
        abi, '0x16c38b3c'
    ),
    setRetractionFeePercentage: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x5b851daa'
    ),
    setSlashAmountPercentage: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x36f83c4f'
    ),
    setSolutionFeePercentage: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x1b2cf4b8'
    ),
    setSolutionMineableRate: new Func<[model_: string, rate_: bigint], {model_: string, rate_: bigint}, []>(
        abi, '0x93f1f8ac'
    ),
    setSolutionStakeAmount: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0xdbb3c97d'
    ),
    setStartBlockTime: new Func<[startBlockTime_: bigint], {startBlockTime_: bigint}, []>(
        abi, '0xa8f837f3'
    ),
    setTreasuryRewardPercentage: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x605cecf6'
    ),
    setValidatorMinimumPercentage: new Func<[amount_: bigint], {amount_: bigint}, []>(
        abi, '0x28c2d36c'
    ),
    setVersion: new Func<[version_: bigint], {version_: bigint}, []>(
        abi, '0x408def1e'
    ),
    signalCommitment: new Func<[commitment_: string], {commitment_: string}, []>(
        abi, '0x506ea7de'
    ),
    signalSupport: new Func<[model_: string, support_: boolean], {model_: string, support_: boolean}, []>(
        abi, '0x49094d4d'
    ),
    slashAmountPercentage: new Func<[], {}, bigint>(
        abi, '0xdc06a89f'
    ),
    solutionFeePercentage: new Func<[], {}, bigint>(
        abi, '0xf1b8989d'
    ),
    solutions: new Func<[_: string], {}, ([validator: string, blocktime: bigint, claimed: boolean, cid: string] & {validator: string, blocktime: bigint, claimed: boolean, cid: string})>(
        abi, '0x75c70509'
    ),
    solutionsStake: new Func<[_: string], {}, bigint>(
        abi, '0xb4dc35b7'
    ),
    solutionsStakeAmount: new Func<[], {}, bigint>(
        abi, '0x9b975119'
    ),
    startBlockTime: new Func<[], {}, bigint>(
        abi, '0x0c18d4ce'
    ),
    submitContestation: new Func<[taskid_: string], {taskid_: string}, []>(
        abi, '0x671f8152'
    ),
    submitSolution: new Func<[taskid_: string, cid_: string], {taskid_: string, cid_: string}, []>(
        abi, '0x56914caf'
    ),
    submitTask: new Func<[version_: number, owner_: string, model_: string, fee_: bigint, input_: string], {version_: number, owner_: string, model_: string, fee_: bigint, input_: string}, string>(
        abi, '0x08745dd1'
    ),
    targetTs: new Func<[t: bigint], {t: bigint}, bigint>(
        abi, '0xcf596e45'
    ),
    tasks: new Func<[_: string], {}, ([model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string] & {model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string})>(
        abi, '0xe579f500'
    ),
    transferOwnership: new Func<[to_: string], {to_: string}, []>(
        abi, '0xf2fde38b'
    ),
    transferPauser: new Func<[to_: string], {to_: string}, []>(
        abi, '0x4421ea21'
    ),
    transferTreasury: new Func<[to_: string], {to_: string}, []>(
        abi, '0xd8a6021c'
    ),
    treasury: new Func<[], {}, string>(
        abi, '0x61d027b3'
    ),
    treasuryRewardPercentage: new Func<[], {}, bigint>(
        abi, '0xc31784be'
    ),
    validatorCanVote: new Func<[addr_: string, taskid_: string], {addr_: string, taskid_: string}, bigint>(
        abi, '0x83657795'
    ),
    validatorDeposit: new Func<[validator_: string, amount_: bigint], {validator_: string, amount_: bigint}, []>(
        abi, '0x93a090ec'
    ),
    validatorMinimumPercentage: new Func<[], {}, bigint>(
        abi, '0x96bb02c3'
    ),
    validatorWithdraw: new Func<[count_: bigint, to_: string], {count_: bigint, to_: string}, []>(
        abi, '0x763253bb'
    ),
    validatorWithdrawPendingAmount: new Func<[_: string], {}, bigint>(
        abi, '0x1b75c43e'
    ),
    validators: new Func<[_: string], {}, ([staked: bigint, since: bigint, addr: string] & {staked: bigint, since: bigint, addr: string})>(
        abi, '0xfa52c7d8'
    ),
    version: new Func<[], {}, bigint>(
        abi, '0x54fd4d50'
    ),
    voteOnContestation: new Func<[taskid_: string, yea_: boolean], {taskid_: string, yea_: boolean}, []>(
        abi, '0x1825c20e'
    ),
    withdrawAccruedFees: new Func<[], {}, []>(
        abi, '0xada82c7d'
    ),
}

export class Contract extends ContractBase {

    accruedFees(): Promise<bigint> {
        return this.eth_call(functions.accruedFees, [])
    }

    baseToken(): Promise<string> {
        return this.eth_call(functions.baseToken, [])
    }

    commitments(arg0: string): Promise<bigint> {
        return this.eth_call(functions.commitments, [arg0])
    }

    contestationVoteNays(arg0: string, arg1: bigint): Promise<string> {
        return this.eth_call(functions.contestationVoteNays, [arg0, arg1])
    }

    contestationVoteYeas(arg0: string, arg1: bigint): Promise<string> {
        return this.eth_call(functions.contestationVoteYeas, [arg0, arg1])
    }

    contestationVoted(arg0: string, arg1: string): Promise<boolean> {
        return this.eth_call(functions.contestationVoted, [arg0, arg1])
    }

    contestationVotedIndex(arg0: string): Promise<bigint> {
        return this.eth_call(functions.contestationVotedIndex, [arg0])
    }

    contestations(arg0: string): Promise<([validator: string, blocktime: bigint, finish_start_index: number, slashAmount: bigint] & {validator: string, blocktime: bigint, finish_start_index: number, slashAmount: bigint})> {
        return this.eth_call(functions.contestations, [arg0])
    }

    diffMul(t: bigint, ts: bigint): Promise<bigint> {
        return this.eth_call(functions.diffMul, [t, ts])
    }

    exitValidatorMinUnlockTime(): Promise<bigint> {
        return this.eth_call(functions.exitValidatorMinUnlockTime, [])
    }

    generateCommitment(sender_: string, taskid_: string, cid_: string): Promise<string> {
        return this.eth_call(functions.generateCommitment, [sender_, taskid_, cid_])
    }

    generateIPFSCID(content_: string): Promise<string> {
        return this.eth_call(functions.generateIPFSCID, [content_])
    }

    getPsuedoTotalSupply(): Promise<bigint> {
        return this.eth_call(functions.getPsuedoTotalSupply, [])
    }

    getReward(): Promise<bigint> {
        return this.eth_call(functions.getReward, [])
    }

    getSlashAmount(): Promise<bigint> {
        return this.eth_call(functions.getSlashAmount, [])
    }

    getValidatorMinimum(): Promise<bigint> {
        return this.eth_call(functions.getValidatorMinimum, [])
    }

    hashModel(o_: ([fee: bigint, addr: string, rate: bigint, cid: string] & {fee: bigint, addr: string, rate: bigint, cid: string}), sender_: string): Promise<string> {
        return this.eth_call(functions.hashModel, [o_, sender_])
    }

    hashTask(o_: ([model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string] & {model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string}), sender_: string, prevhash_: string): Promise<string> {
        return this.eth_call(functions.hashTask, [o_, sender_, prevhash_])
    }

    lastContestationLossTime(arg0: string): Promise<bigint> {
        return this.eth_call(functions.lastContestationLossTime, [arg0])
    }

    maxContestationValidatorStakeSince(): Promise<bigint> {
        return this.eth_call(functions.maxContestationValidatorStakeSince, [])
    }

    minClaimSolutionTime(): Promise<bigint> {
        return this.eth_call(functions.minClaimSolutionTime, [])
    }

    minContestationVotePeriodTime(): Promise<bigint> {
        return this.eth_call(functions.minContestationVotePeriodTime, [])
    }

    minRetractionWaitTime(): Promise<bigint> {
        return this.eth_call(functions.minRetractionWaitTime, [])
    }

    models(arg0: string): Promise<([fee: bigint, addr: string, rate: bigint, cid: string] & {fee: bigint, addr: string, rate: bigint, cid: string})> {
        return this.eth_call(functions.models, [arg0])
    }

    owner(): Promise<string> {
        return this.eth_call(functions.owner, [])
    }

    paused(): Promise<boolean> {
        return this.eth_call(functions.paused, [])
    }

    pauser(): Promise<string> {
        return this.eth_call(functions.pauser, [])
    }

    pendingValidatorWithdrawRequests(arg0: string, arg1: bigint): Promise<([unlockTime: bigint, amount: bigint] & {unlockTime: bigint, amount: bigint})> {
        return this.eth_call(functions.pendingValidatorWithdrawRequests, [arg0, arg1])
    }

    pendingValidatorWithdrawRequestsCount(arg0: string): Promise<bigint> {
        return this.eth_call(functions.pendingValidatorWithdrawRequestsCount, [arg0])
    }

    prevhash(): Promise<string> {
        return this.eth_call(functions.prevhash, [])
    }

    retractionFeePercentage(): Promise<bigint> {
        return this.eth_call(functions.retractionFeePercentage, [])
    }

    reward(t: bigint, ts: bigint): Promise<bigint> {
        return this.eth_call(functions.reward, [t, ts])
    }

    slashAmountPercentage(): Promise<bigint> {
        return this.eth_call(functions.slashAmountPercentage, [])
    }

    solutionFeePercentage(): Promise<bigint> {
        return this.eth_call(functions.solutionFeePercentage, [])
    }

    solutions(arg0: string): Promise<([validator: string, blocktime: bigint, claimed: boolean, cid: string] & {validator: string, blocktime: bigint, claimed: boolean, cid: string})> {
        return this.eth_call(functions.solutions, [arg0])
    }

    solutionsStake(arg0: string): Promise<bigint> {
        return this.eth_call(functions.solutionsStake, [arg0])
    }

    solutionsStakeAmount(): Promise<bigint> {
        return this.eth_call(functions.solutionsStakeAmount, [])
    }

    startBlockTime(): Promise<bigint> {
        return this.eth_call(functions.startBlockTime, [])
    }

    targetTs(t: bigint): Promise<bigint> {
        return this.eth_call(functions.targetTs, [t])
    }

    tasks(arg0: string): Promise<([model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string] & {model: string, fee: bigint, owner: string, blocktime: bigint, version: number, cid: string})> {
        return this.eth_call(functions.tasks, [arg0])
    }

    treasury(): Promise<string> {
        return this.eth_call(functions.treasury, [])
    }

    treasuryRewardPercentage(): Promise<bigint> {
        return this.eth_call(functions.treasuryRewardPercentage, [])
    }

    validatorCanVote(addr_: string, taskid_: string): Promise<bigint> {
        return this.eth_call(functions.validatorCanVote, [addr_, taskid_])
    }

    validatorMinimumPercentage(): Promise<bigint> {
        return this.eth_call(functions.validatorMinimumPercentage, [])
    }

    validatorWithdrawPendingAmount(arg0: string): Promise<bigint> {
        return this.eth_call(functions.validatorWithdrawPendingAmount, [arg0])
    }

    validators(arg0: string): Promise<([staked: bigint, since: bigint, addr: string] & {staked: bigint, since: bigint, addr: string})> {
        return this.eth_call(functions.validators, [arg0])
    }

    version(): Promise<bigint> {
        return this.eth_call(functions.version, [])
    }
}
