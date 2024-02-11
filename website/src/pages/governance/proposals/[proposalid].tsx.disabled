import { useRouter } from 'next/router'
import Link from 'next/link';
import { RadioGroup } from '@headlessui/react'
import { useState, useEffect } from 'react';
import {
  useAccount,
  useBlockNumber,
  useProvider,
  useNetwork,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { ethers } from 'ethers'
import Layout from '@/components/Layout';
import ConnectWallet from '@/components/ConnectWallet';
import TokenBalance from '@/components/TokenBalance';
import ProposalLoader from '@/components/loaders/ProposalLoader';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import EngineArtifact from '@/artifacts/EngineV1.sol/EngineV1.json';
import GovernorArtifact from '@/artifacts/GovernorV1.sol/GovernorV1.json';
import TimelockArtifact from '@/artifacts/TimelockV1.sol/TimelockV1.json';
// import DelegatedValidatorDeployerArtifact from '@/artifacts/DelegatedValidatorDeployerV1.sol/DelegatedValidatorDeployerV1.json';
import ProxyAdminArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import Config from '@/config.json';
import { secondsToDhms, cidify, formatBalance } from '@/utils';

const ProposalStateEnum = {
  'pending':   0,
  'active':    1,
  'canceled':  2,
  'defeated':  3,
  'succeeded': 4,
  'queued':    5,
  'expired':   6,
  'executed':  7,
};


interface ProposalInfo {
  id: ethers.BigNumber;
  proposer: string;
  eta: ethers.BigNumber;
  startBlock: ethers.BigNumber;
  endBlock: ethers.BigNumber;
  forVotes: ethers.BigNumber;
  againstVotes: ethers.BigNumber;
  abstainVotes: ethers.BigNumber;
  canceled: boolean;
  executed: boolean;
}

interface ProposalActions {
  targets: string[];
  values: ethers.BigNumber[];
  signatures: string[];
  calldatas: string[];
}

interface DecodedCalldata {
  targetAddress: string; 
  targetString: string;
  signature: string;
  inputs: {
    name: string;
    type: string;
    arg: string|ethers.BigNumber;
  }[];
}

interface VoteStat {
  name: string;
  votes: string;
  percent: string;
  percentClasses: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const voteOptions = [
{
  name: 'Against',
  value: 0,
},
{
  name: 'For',
  value: 1,
},
{
  name: 'Abstain',
  value: 2,
}
];

export default function ProposalPage() {
  const { chain, chains } = useNetwork();
  const { address } = useAccount()
  const provider = useProvider();

  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));
  const [voteTypeSelected, setVoteTypeSelected] = useState(voteOptions[0]);
  const [stats, setStats] = useState([] as VoteStat[]);
  const [blockNumber, setBlockNumber] = useState(0);


  const router = useRouter()
  const { proposalid } = router.query

  const {
    data: l2BlockNumber,
    isError: l2BlockNumberIsError,
    isLoading: l2BlockNumberIsLoading,
    refetch: l2BlockNumberRefetch,
  } = useBlockNumber();

  const {
    data: proposalInfo,
    isError: proposalInfoIsError,
    isLoading: proposalInfoIsLoading,
    refetch: proposalInfoRefetch,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'proposals',
    args: [proposalid],
    enabled: Boolean(proposalid),
  });

  const {
    data: proposalActions,
    isError: proposalActionsIsError,
    isLoading: proposalActionsIsLoading,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'getActions',
    args: [proposalid],
    enabled: Boolean(proposalid),
  });

  const {
    data: descriptionHash,
    isError: descriptionHashIsError,
    isLoading: descriptionHashIsLoading,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'descriptionHashes',
    args: [proposalid],
    enabled: Boolean(proposalid),
  });

  const {
    data: quorumVotes,
    isError: quorumVotesIsError,
    isLoading: quorumVotesIsLoading,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'quorumVotes',
  });

  const {
    data: state,
    isError: stateIsError,
    isLoading: stateIsLoading,
    refetch: stateRefetch,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'state',
    args: [proposalid],
    enabled: Boolean(proposalid),
  });

  const {
    data: descriptionCid,
    isError: descriptionCidIsError,
    isLoading: descriptionCidIsLoading,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'descriptionCids',
    args: [proposalid],
    enabled: Boolean(proposalid),
  });

  let getPastVotesBlock = 0;
  if (proposalInfo && blockNumber) {
    getPastVotesBlock = Math.min((proposalInfo as ProposalInfo).startBlock.sub(1).toNumber(), blockNumber-1);
  }
  const {
    data: votingPower,
    isError: votingPowerIsError,
    isLoading: votingPowerIsLoading,
    refetch: votingPowerRefetch,
  } = useContractRead({
    address: Config.baseTokenAddress as `0x${string}`,
    abi: BaseTokenArtifact.abi,
    functionName: 'getPastVotes',
    args: [
      address,
      getPastVotesBlock,
    ],
    enabled: Boolean(proposalid) && Boolean(address),
  });

  const {
    data: hasVoted,
    isError: hasVotedIsError,
    isLoading: hasVotedIsLoading,
    refetch: hasVotedRefetch,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'hasVoted',
    args: [proposalid, address],
    enabled: Boolean(proposalid) && Boolean(address),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      proposalInfoRefetch();
      votingPowerRefetch();
      hasVotedRefetch();
      l2BlockNumberRefetch();
      stateRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function f() {
      if (! provider || !l2BlockNumber || !chain) {
        return;
      }

      // for local testing there is no difference between block.number and block.l1blocknumber
      if (chain.id === 31337) {
        setBlockNumber(l2BlockNumber);
        return;
      }

      // @ts-ignore .send does in fact exist
      const blockData = await provider.send('eth_getBlockByNumber', [
        ethers.utils.hexlify(l2BlockNumber),
        false,
      ]);
      if (! blockData) {
        return;
      }

      const num = parseInt(blockData.l1BlockNumber);
      if (num) {
        setBlockNumber(num);
      }
    }

    f();
  }, [provider, l2BlockNumber, chain]);


  // @ts-ignore
  const [targets, values, signatures, calldatas] = proposalActions ?? [[], [], [], []];

  const decodedCalldata: DecodedCalldata[] = [];
  for (let i=0; i<(targets?targets.length:0); ++i) {
    const target = targets[i];
    const calldata = calldatas[i];

    let iface = null;
    let targetString = 'unknown';
    switch (target) {
      case Config.baseTokenAddress:
        iface = (new ethers.Contract(Config.baseTokenAddress, BaseTokenArtifact.abi)).interface;
        targetString = 'Arbius Token';
        break;
      case Config.engineAddress:
        iface = (new ethers.Contract(Config.engineAddress, EngineArtifact.abi)).interface;
        targetString = 'Engine';
        break;
      case Config.timelockAddress:
        iface = (new ethers.Contract(Config.timelockAddress, TimelockArtifact.abi)).interface;
        targetString = 'Timelock';
        break;
      case Config.governorAddress:
        iface = (new ethers.Contract(Config.governorAddress, GovernorArtifact.abi)).interface;
        targetString = 'Governor';
        break;
      /*
      case Config.delegatedValidatorDeployerAddress:
        iface = (new ethers.Contract(Config.delegatedValidatorDeployerAddress, DelegatedValidatorDeployerArtifact.abi)).interface;
        targetString = 'Delegated Validator Deployer';
        break;
      */
      case Config.proxyAdminAddress:
        iface = (new ethers.Contract(Config.proxyAdminAddress, ProxyAdminArtifact.abi)).interface
        targetString = 'Proxy Admin';
        break;
    }

    if (iface === null) {
      decodedCalldata.push({
        targetAddress: target,
        targetString,
        signature: `cannot decode (do not know target ${target})`,
        inputs: [],
      });
      continue;
    }

    try {
      const { args, name, signature, value, functionFragment } = iface.parseTransaction({
        data: calldata,
      });

      const inputs = [];
      for (let input_idx=0; input_idx<functionFragment.inputs.length; ++input_idx) {
        const { name, type } = functionFragment.inputs[input_idx];
        const arg = args[input_idx];
        inputs.push({
          name,
          type,
          arg,
        });
      }

      decodedCalldata.push({
        targetAddress: target,
        targetString,
        signature,
        inputs,
      });
    } catch (e) {
      decodedCalldata.push({
        targetAddress: target,
        targetString,
        signature: `cannot decode (error decoding)`,
        inputs: [],
      });
      continue;
    }
  }

  useEffect(() => {
    const forVotes = proposalInfo ? (proposalInfo as ProposalInfo).forVotes : ethers.constants.Zero;
    const againstVotes = proposalInfo ? (proposalInfo as ProposalInfo).againstVotes : ethers.constants.Zero;
    const abstainVotes = proposalInfo ? (proposalInfo as ProposalInfo).abstainVotes : ethers.constants.Zero;


    function formatVotePercentage(bn: ethers.BigNumber): string {
      const totalF = formatBalance(forVotes.add(againstVotes).add(abstainVotes), 1e11);
      if (totalF === '0.0') {
        return '0';
      }
      const bnF = formatBalance(bn, 1e11);

      return parseFloat((parseFloat(bnF) / parseFloat(totalF) * 100).toFixed(4)).toString();
    }

    setStats([
      {
        name: 'For',
        votes: formatBalance(forVotes),
        percent: formatVotePercentage(forVotes),
        percentClasses: 'bg-green-50 border-green-100',
      },
      {
        name: 'Against',
        votes: formatBalance(againstVotes),
        percent: formatVotePercentage(againstVotes),
        percentClasses: 'bg-red-50 border-red-100',
      },
      {
        name: 'Abstain',
        votes: formatBalance(abstainVotes),
        percent: formatVotePercentage(abstainVotes),
        percentClasses: 'bg-slate-50 border-slate-100',
      }
    ]);
  }, [proposalInfo]);


  let voteTimePercentage = '0.0%';
  if (blockNumber && proposalInfo) {
    const cur   = blockNumber as number;
    const start = parseInt((proposalInfo as ProposalInfo).startBlock.toString());
    const end   = parseInt((proposalInfo as ProposalInfo).endBlock.toString());
    if (cur < start) {
      voteTimePercentage = '0.0%';
    } else if (cur >= end) {
      voteTimePercentage = '100.0%';
    } else {
      voteTimePercentage = parseFloat(((cur - start) / (end - start) * 100).toFixed(1)) + '%';
    }
  }

  let votingBegins = 0;
  let votingEnds = 0;
  if (proposalInfo) {
    votingBegins = parseInt((proposalInfo as ProposalInfo).startBlock.toString());
    votingEnds = parseInt((proposalInfo as ProposalInfo).endBlock.toString());
  }

  const proposal404 = ! proposalInfo || (proposalInfo as ProposalInfo).id.toHexString() === ethers.constants.HashZero;

  const { config: voteConfig } = usePrepareContractWrite({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: (state === ProposalStateEnum['active'] && !(hasVoted as boolean)) ? 'castVote' : undefined, // disable this if not live yet
    args: [proposalid, voteTypeSelected.value],
  });

  const {
    data: voteData,
    isIdle: voteIsIdle,
    isError: voteIsError,
    isLoading: voteIsLoading,
    isSuccess: voteIsSuccess,
    write: voteWrite,
  } = useContractWrite(voteConfig)


  function badge(title: string, color: string) {
    return (
      <>
        <div className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-200 bg-white">
          <svg className={`h-1.5 w-1.5 fill-${color}-500`} viewBox="0 0 6 6" aria-hidden="true">
            <circle cx={3} cy={3} r={3} />
          </svg>
          {title}
        </div>
      </>
    );
  }


  // @ts-ignore
  return (
    <Layout title="View Proposal">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Proposal Information
              </h1>
            </div>

            {proposal404 && (
              <div className="mt-5">
                Proposal not found
              </div>
            )}

            {! proposal404 && (
              <>
                <div className="mt-8">
                  <span className="bg-slate-50 p-2 px-3 rounded-md text-slate-800">
                    Proposed by: <a target="_blank" href={`https://nova.arbiscan.io/address/${(proposalInfo as ProposalInfo)?.proposer}`}>{(proposalInfo as ProposalInfo)?.proposer}</a>
                  </span>
                </div>

                <div className="mt-8 px-6 py-4 border border-slate-200 rounded-md">
                  <h4 className="sr-only">Progress</h4>

                  <div className="nightwind-prevent-block">
                    {state === ProposalStateEnum['pending']   && badge('Pending',   'gray')}
                    {state === ProposalStateEnum['active']    && badge('Active',    'blue')}
                    {state === ProposalStateEnum['canceled']  && badge('Canceled',  'gray')}
                    {state === ProposalStateEnum['defeated']  && badge('Defeated',  'red')}
                    {state === ProposalStateEnum['succeeded'] && badge('Succeeded', 'green')}
                    {state === ProposalStateEnum['queued']    && badge('Queued',    'purple')}
                    {state === ProposalStateEnum['expired']   && badge('Expired',   'gray')}
                    {state === ProposalStateEnum['executed']  && badge('Executed',  'gray')}
                  </div>
  
                  <p className="text-sm font-medium text-gray-900 pt-2">
                    {(votingBegins > blockNumber) && (
                      <span>Voting begins in {secondsToDhms((votingBegins - blockNumber)*12.1)}</span>
                    )}
                    {(votingBegins < blockNumber && votingEnds > blockNumber) && (
                      <span>Voting ends in {secondsToDhms((votingEnds - blockNumber)*12.1)}</span>
                    )}
                  </p>
                  <div className="mt-6" aria-hidden="true">
                    <div className="overflow-hidden rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-indigo-600" style={{ width: voteTimePercentage }} />
                    </div>
                    <div className="mt-6 hidden grid-cols-2 text-sm font-medium text-gray-600 sm:grid">
                      <div className="">
                        #{(proposalInfo as ProposalInfo)?.startBlock.toString()}
                      </div>
                      <div className="text-right">
                        #{(proposalInfo as ProposalInfo)?.endBlock.toString()}
                      </div>
                    </div>
                  </div>
                </div>
    
                <div>
                  <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-3 md:divide-x md:divide-y-0">
                    {stats.map((item: VoteStat, idx: number) => (
                      <div key={idx} className="px-4 py-5 sm:p-6">
                        <dt className="text-2xl font-semibold text-gray-900">{item.name}</dt>
                        <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                          <div className="flex items-baseline text-2xl font-normal text-slate-600">
                            {item.votes}
                          </div>
    
                          <div
                            className={item.percentClasses + ' border inline-flex items-baseline rounded-full px-2.5 py-0.5 text-normal font-medium md:mt-2 lg:mt-0 text-gray-800'}
                          >
                            {item.percent}%
                          </div>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="mt-8">
                  <span className="p-2 px-3 rounded-md text-slate-800 border border-gray">
                    A quorum of {formatBalance(quorumVotes as ethers.BigNumber)} AIUS is needed
                  </span>
                </div>
    
    
                <div className="mt-5 p-4 border border-slate-200 rounded-md overflow-x-auto">
                  <h2 className="text-xl font-semibold text-gray-800">Decoded Calls</h2>
                  <ul>
                    {decodedCalldata.map((row: DecodedCalldata, idx: number) => (
                      <li key={idx} className="py-2">
                        <div>
                          <span className="font-semibold text-gray-700">{row.targetString}</span>
                          &nbsp;
                          <span className="text-sm text-slate-700 font-normal">
                            <a target="_blank" href={`https://nova.arbiscan.io/address/${row.targetAddress}`}>{row.targetAddress}</a>
                          </span>
                        
                        </div>
    
                        <div className="text-slate-900 text-base font-mono mt-3">
                          {row.signature}
                        </div>
                        <ul>
                          {row.inputs.map((input, iidx) => (
                            <li key={iidx} className="py-3">
                              <span className="bg-slate-100 border-slate-200 border p-2 rounded-md font-mono text-md text-slate-700">
                                {input.type}
                              </span>
    
                              <span className="ml-5 text-slate-700">
                                {input.name}
                              </span>
    
                              <span className="ml-5 font-mono text-slate-700">
                                {input.arg.toString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )) }
                  </ul>
                </div>
    
                <div className="mt-5">
                  <table className="min-w-full divide-y divide-gray-300">
                    <tbody className={(proposal404 ? 'hidden ' : '') + "divide-y divide-gray-200"}>
                      <tr>
                        <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          <strong>Targets</strong>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                          <ul>
                            {targets.map((row: string, idx: number) => (
                              <li key={idx}>
                                <a target="_blank" href={`https://nova.arbiscan.io/address/${row}`}>{row}</a>
                              </li>
                            )) }
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          <strong>Values</strong>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                          <ul>
                            {values.map((row: ethers.BigNumber, idx: number) => (
                              <li key={idx}>{ethers.utils.formatEther(row.toString())}</li>
                            )) }
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          <strong>Signatures</strong>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                          <ul>
                            {signatures.map((row: string, idx: number) => (
                              <li key={idx}>{row}</li>
                            )) }
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          <strong>Calldatas</strong>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                          <ul>
                            {calldatas.map((row: string, idx: number) => (
                              <li key={idx}>{row}</li>
                            )) }
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          <strong>Description hash</strong>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                          {descriptionHash ? (descriptionHash as string) : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          <strong>Description cid</strong>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                          <a
                            target="_blank"
                            href={process.env.NEXT_PUBLIC_IPFS_GATEWAY_CSTR!.replace('%C', cidify(descriptionCid as string))}
                          >
                            {cidify(descriptionCid as string)}
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 px-6 py-4 border border-slate-200 rounded-md proposal-container">
                  { (descriptionCid as string) && (
                    <ProposalLoader
                      src={process.env.NEXT_PUBLIC_IPFS_GATEWAY_CSTR!.replace('%C', cidify(descriptionCid as string))}
                      />
                  ) }
                </div>

                <div className="mt-10 p-4 py-8 border border-slate-200 bg-slate-50 rounded-md">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Vote
                    </h2>
                    <p className="mt-4 text-slate-700">
                      You may only vote once. Ensure you fully understand all calls being made.
                    </p>
                  </div>

                  <RadioGroup value={voteTypeSelected} onChange={setVoteTypeSelected} className="mt-8">
                    <RadioGroup.Label className="sr-only">Select how to vote</RadioGroup.Label>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {voteOptions.map((option) => (
                        <RadioGroup.Option
                          key={option.name}
                          value={option}
                          className={({ active, checked }) =>
                            classNames(
                              'cursor-pointer focus:outline-none',
                              active ? 'ring-2 ring-blue-600 ring-offset-2' : '',
                              checked
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'ring-1 ring-inset ring-gray-300 bg-white text-gray-900 hover:bg-gray-50',
                              'flex items-center justify-center rounded-md py-3 px-3 text-sm font-semibold uppercase sm:flex-1'
                            )
                          }
                        >
                          <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="mt-6">
                    <p className={((votingPower && (votingPower as ethers.BigNumber).eq(0)) ? '' : 'hidden ') + "py-2"}>
                      You do not have any voting power for this, make sure to
                      <Link
                        href="/governance"
                        className="text-cyan-700"
                      >
                        &nbsp;delegate&nbsp;
                      </Link>
                      before voting begins.
                    </p>
                    <div>
                      <button
                        onClick={() => voteWrite?.() }
                        className="rounded-md bg-fuchsia-600 text-white py-2 px-3 text-xl font-semibold shadow-sm border border-fuchsia-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 hover:shadow hover:bg-fuchsia-500 transition ease-out text-slate-800"
                        disabled={state !== ProposalStateEnum['active'] || (hasVoted as boolean) || (Boolean(votingPower) && (votingPower as ethers.BigNumber).eq(0))}
                      >
                        Cast Vote <span className="text-sm">({formatBalance(votingPower as ethers.BigNumber)})</span>
                      </button>
                      <div className="mt-4 ml-2 text-gray-800">
                        <p className={state === ProposalStateEnum['active'] ? 'hidden' : ''}>
                          Voting is not active
                        </p>
                        <p className={hasVoted ? '' : 'hidden'}>
                          You&apos;ve already voted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </Layout>
  )
}
