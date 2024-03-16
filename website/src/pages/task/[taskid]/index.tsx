import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'

import {
  useNetwork,
  useContractRead,
  useAccount,
  useContractEvent,
} from 'wagmi'
import { ethers } from 'ethers'
import { useQuery, gql } from '@apollo/client';



import Layout from '@/components/Layout';
import RenderSolution from '@/components/RenderSolution';
import Config from '@/config.json';
import { cidify } from '@/utils';
import EngineArtifact from '@/artifacts/V2_EngineV2.sol/V2_EngineV2.json';

import Kandinsky2Template from '@/templates/kandinsky2.json';
import { Template } from '@/types/Template';
import { getModelTemplate } from '@/models';

interface Task {
  model: string;
  fee: ethers.BigNumber;
  owner: string;
  blocktime: ethers.BigNumber;
  version: number;
  cid: string;
}

interface Solution {
  validator: string;
  blocktime: ethers.BigNumber;
  claimed: boolean;
  cid: string;
}

interface Contestation {
  validator: string;
  blocktime: ethers.BigNumber;
  finish_start_index: number;
  slashAmount: ethers.BigNumber;
}

interface Model {
  fee: ethers.BigNumber;
  addr: string;
  rate: ethers.BigNumber;
  cid: string;
}

const GET_CONTESTATION_VOTES = gql`
  query GetContestationVotes($id: String!) {
    contestationVotes(where: { taskID_eq: $id, network_eq: "nova"}) {
      id
      address
      yea
      timestamp
      txHash
    }
  }
`;

export default function TaskPage() {
  const { address } = useAccount()

  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));
  const [template, setTemplate] = useState(Kandinsky2Template);

  const router = useRouter()
  const { taskid } = router.query

  const {
    loading: contestationVotesLoading,
    error:   contestationVotesError,
    data:    contestationVotesData,
  } = useQuery(GET_CONTESTATION_VOTES, {
    variables: { id: taskid },
  });

  const {
    data: taskData,
    isError: taskIsError,
    isLoading: taskIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'tasks',
    args: [
      taskid,
    ],
  });

  const {
    data: solutionData,
    isError: solutionIsError,
    isLoading: solutionIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'solutions',
    args: [
      taskid,
    ],
  });

  const {
    data: contestationData,
    isError: contestationIsError,
    isLoading: contestationIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'contestations',
    args: [
      taskid,
    ],
  });

  const {
    data: modelData,
    isError: modelIsError,
    isLoading: modelIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'models',
    args: [
      (taskData as Task)?.model,
    ],
  });

  useEffect(() => {
    if (! taskData) {
      return;
    }

    const template = getModelTemplate((taskData as Task).model);
    setTemplate(template);
  }, [taskData]);


  function renderBlocktime(blocktime: ethers.BigNumber|null) {
    if (! blocktime) {
      return '';
    }
    const d = new Date(blocktime.toNumber() * 1000);
    return `${blocktime.toString()} - ${d.toLocaleTimeString()} ${d.toLocaleDateString()}`;
  }

  return (
    <Layout title="Task">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Task Information
              </h1>
            </div>
            <h2 className="text-base font-normal leading-6 text-gray-400 mt-3">
              {taskid}
            </h2>

            <div>
              {(template && solutionData && (solutionData as Solution).cid !== '0x') ? (
                <div className="my-8">
                  <RenderSolution
                    template={template as Template}
                    cid={cidify((solutionData as Solution)?.cid)}
                  />
                </div>
              ) : ''}
            </div>

            <div className="mt-5">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-md font-semibold text-gray-900">
                      <strong>Task</strong>
                      <p className={(! taskData || (taskData as Task).model === ethers.constants.HashZero  ? '' : 'hidden ') + "text-sm font-normal text-gray-400"}>
                        No task found.
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className={(! taskData || (taskData as Task).model === ethers.constants.HashZero  ? 'hidden ' : '') + "divide-y divide-gray-200"}>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>model</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(taskData as Task)?.model}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>fee</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {ethers.utils.formatEther((taskData as Task)?.fee || '0')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>owner</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a target="_blank" href={`https://nova.arbiscan.io/address/${(taskData as Task)?.owner}`}>{(taskData as Task)?.owner}</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>blocktime</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {renderBlocktime((taskData as Task)?.blocktime)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>version</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(taskData as Task)?.version}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>cid</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a
                        target="_blank"
                        href={process.env.NEXT_PUBLIC_IPFS_GATEWAY_CSTR!.replace('%C', cidify((taskData as Task)?.cid))}
                      >
                        {cidify((taskData as Task)?.cid)}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="min-w-full divide-y divide-gray-300 mt-10">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-md font-semibold text-gray-900">
                      <strong>Solution</strong>
                      <p className={(! solutionData || (solutionData as Solution).validator === ethers.constants.AddressZero  ? '' : 'hidden ') + "text-sm font-normal text-gray-400"}>
                        No solution found.
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className={(! solutionData || (solutionData as Solution).validator === ethers.constants.AddressZero  ? 'hidden ' : '') + "divide-y divide-gray-200"}>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>validator</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a target="_blank" href={`https://nova.arbiscan.io/address/${(solutionData as Solution)?.validator}`}>{(solutionData as Solution)?.validator}</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>blocktime</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {renderBlocktime((solutionData as Solution)?.blocktime)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>claimed</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(solutionData as Solution)?.claimed ? 'true' : 'false'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>cid</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a
                        target="_blank"
                        href={process.env.NEXT_PUBLIC_IPFS_GATEWAY_CSTR!.replace('%C', cidify((solutionData as Solution)?.cid))}
                      >
                        {cidify((solutionData as Solution)?.cid)}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="min-w-full divide-y divide-gray-300 mt-10">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-md font-semibold text-gray-900">
                      <strong>Contestation</strong>
                      <p className={(! contestationData || (contestationData as Contestation).validator === ethers.constants.AddressZero  ? '' : 'hidden ') + "text-sm font-normal text-gray-400"}>
                        No contestation found.
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className={(! contestationData || (contestationData as Contestation).validator === ethers.constants.AddressZero  ? 'hidden ' : '') + "divide-y divide-gray-200"}>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>validator</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a target="_blank" href={`https://nova.arbiscan.io/address/${(contestationData as Contestation)?.validator}`}>{(contestationData as Contestation)?.validator}</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>blocktime</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {renderBlocktime((contestationData as Contestation)?.blocktime)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>finish_start_index</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(contestationData as Contestation)?.finish_start_index}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>slashAmount</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {ethers.utils.formatEther((contestationData as Contestation)?.slashAmount || '0')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>votes</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {contestationVotesLoading && 'Loading...'}                    {contestationVotesError && `Error! ${contestationVotesError.message}`}
                      {contestationVotesData && contestationVotesData?.contestationVotes.length === 0 && 'No votes found.'}
                      {contestationVotesData && contestationVotesData?.contestationVotes.length > 0 && contestationVotesData?.contestationVotes.filter((vote: any) => vote.yea).length} yea, {contestationVotesData && contestationVotesData?.contestationVotes.filter((vote: any) => !vote.yea).length} nay

                      {contestationVotesData && contestationVotesData?.contestationVotes.map((vote: any) => (
                        <div key={vote.id} className="whitespace-nowrap py-1 text-sm text-cyan-600">
                          <a
                            target="_blank"
                            href={`https://nova.arbiscan.io/tx/${vote.txHash}`}
                          >
                            {vote.yea ? '👍' : '👎'} - {vote.address}
                            <br />
                            <small>{vote.timestamp}</small>
                          </a>
                        </div>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className="min-w-full divide-y divide-gray-300 mt-10">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-md font-semibold text-gray-900">
                      <strong>Model</strong>
                      <p className={(! modelData || (modelData as Model).addr === ethers.constants.AddressZero  ? '' : 'hidden ') + "text-sm font-normal text-gray-400"}>
                        No contestation found.
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className={(! modelData || (modelData as Model).addr === ethers.constants.AddressZero  ? 'hidden ' : '') + "divide-y divide-gray-200"}>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>fee</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {ethers.utils.formatEther((modelData as Model)?.fee || '0')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>addr</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a target="_blank" href={`https://nova.arbiscan.io/address/${(modelData as Model)?.addr}`}>{(modelData as Model)?.addr}</a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>rate</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {ethers.utils.formatEther((modelData as Model)?.rate || '0')}x
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>cid</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-cyan-600">
                      <a
                        target="_blank"
                        href={process.env.NEXT_PUBLIC_IPFS_GATEWAY_CSTR!.replace('%C', cidify((modelData as Model)?.cid))}
                      >
                        {cidify((modelData as Model)?.cid)}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </Layout>
  )
}
