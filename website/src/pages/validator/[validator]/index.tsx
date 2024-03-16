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
import Config from '@/config.json';
import { cidify, renderBlocktime } from '@/utils';
import EngineArtifact from '@/artifacts/V2_EngineV2.sol/V2_EngineV2.json';

interface Validator {
  addr: string;
  staked: ethers.BigNumber;
  since: ethers.BigNumber;
}


const GET_CONTESTATION_VOTES = gql`
  query GetContestationVotes($address: String!) {
    contestationVotes(where: { address_eq: $address, network_eq: "nova"}) {
      id
      taskID
      yea
      timestamp
      txHash
    }
  }
`;

export default function ValidatorPage() {
  const { address } = useAccount()

  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));

  const router = useRouter()
  const { validator } = router.query

  const {
    loading: contestationVotesLoading,
    error:   contestationVotesError,
    data:    contestationVotesData,
  } = useQuery(GET_CONTESTATION_VOTES, {
    variables: { address: validator },
  });

  const {
    data: validatorData,
    isError: validatorIsError,
    isLoading: validatorIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'validators',
    args: [
      validator,
    ],
  });

  const {
    data: lastContestationLossTimeData,
    isError: lastContestationLossTimeIsError,
    isLoading: lastContestationLossTimeIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'lastContestationLossTime',
    args: [
      validator,
    ],
  });


  return (
    <Layout title="Validator">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Validator Information
              </h1>
            </div>
            <h2 className="text-base font-normal leading-6 text-gray-400 mt-3">
              <a href={`https://nova.arbiscan.io/address/${validator}`} target="_blank" className="text-cyan-600">
                {validator}
              </a>
            </h2>

            <div className="mt-5">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-md font-semibold text-gray-900">
                      <strong>Validator</strong>
                      <p className={(! validatorData || (validatorData as Validator).addr === ethers.constants.HashZero  ? '' : 'hidden ') + "text-sm font-normal text-gray-400"}>
                        No validator found.
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>staked</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {ethers.utils.formatEther((validatorData as Validator)?.staked || "0")}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>since</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {renderBlocktime((validatorData as Validator)?.since)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <strong>last contestation loss time</strong>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {renderBlocktime(lastContestationLossTimeData as ethers.BigNumber || null)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-md font-semibold text-gray-900">
                      <strong>Contestation Votes</strong>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {contestationVotesLoading && 'Loading...'}                    {contestationVotesError && `Error! ${contestationVotesError.message}`}
                      {contestationVotesData && contestationVotesData?.contestationVotes.length === 0 && 'No votes found.'}
                      {contestationVotesData && contestationVotesData?.contestationVotes.length > 0 && contestationVotesData?.contestationVotes.filter((vote: any) => vote.yea).length} yea, {contestationVotesData && contestationVotesData?.contestationVotes.filter((vote: any) => !vote.yea).length} nay

                      {contestationVotesData && contestationVotesData?.contestationVotes.map((vote: any) => (
                        <div key={vote.id} className="whitespace-nowrap py-1 text-sm text-cyan-600">
                          <a href={`/task/${vote.taskID}`}>
                            {vote.yea ? '👍' : '👎'} - {vote.taskID}
                            <br />
                            <small>{vote.timestamp}</small>
                          </a>
                        </div>
                      ))}
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
