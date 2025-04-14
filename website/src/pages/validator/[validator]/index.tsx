import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import {
  useAccount,
  useReadContract,
  useWatchContractEvent,
} from 'wagmi';
import { ethers } from 'ethers';
import type { Abi } from 'viem';
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
    contestationVotes(
      orderBy: timestamp_DESC
      where: { address_eq: $address, network_eq: "nova" }
    ) {
      id
      taskID
      yea
      timestamp
      txHash
    }
  }
`;

export default function ValidatorPage() {
  const { address } = useAccount();

  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));

  const router = useRouter();
  const { validator } = router.query;

  const {
    loading: contestationVotesLoading,
    error: contestationVotesError,
    data: contestationVotesData,
  } = useQuery(GET_CONTESTATION_VOTES, {
    variables: { address: validator },
  });

  const {
    data: validatorData,
    isError: validatorIsError,
    isLoading: validatorIsLoading,
  } = useReadContract({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi as Abi,
    functionName: 'validators',
    args: [validator],
  });

  const {
    data: lastContestationLossTimeData,
    isError: lastContestationLossTimeIsError,
    isLoading: lastContestationLossTimeIsLoading,
  } = useReadContract({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi as Abi,
    functionName: 'lastContestationLossTime',
    args: [validator],
  });

  useWatchContractEvent({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi as Abi,
    eventName: 'ValidatorDeposit',
    args: {
      validator: validator,
    },
    onLogs(logs) {
      console.log('New validator deposit!', logs);
    },
  });

  useWatchContractEvent({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi as Abi,
    eventName: 'ValidatorWithdraw',
    args: {
      validator: validator,
    },
    onLogs(logs) {
      console.log('New validator withdraw!', logs);
    },
  });

  return (
    <Layout title='Validator'>
      <main>
        <div className='sm:rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='mx-auto max-w-7xl'>
              <h1 className='text-gray-900 text-3xl font-bold leading-tight tracking-tight'>
                Validator Information
              </h1>
            </div>
            <h2 className='text-gray-400 mt-3 text-base font-normal leading-6'>
              <a
                href={`https://nova.arbiscan.io/address/${validator}`}
                target='_blank'
                className='text-cyan-600'
              >
                {validator}
              </a>
            </h2>

            <div className='mt-5'>
              <table className='min-w-full divide-y divide-gray-300'>
                <thead>
                  <tr>
                    <th
                      scope='col'
                      className='text-md text-gray-900 px-3 py-3.5 text-left font-semibold'
                    >
                      <strong>Validator</strong>
                      <p
                        className={
                          (!validatorData ||
                          (validatorData as Validator).addr ===
                            ethers.constants.HashZero
                            ? ''
                            : 'hidden ') + 'text-gray-400 text-sm font-normal'
                        }
                      >
                        No validator found.
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  <tr>
                    <td className='text-gray-900 px-3 py-3.5 text-left text-sm font-semibold'>
                      <strong>staked</strong>
                    </td>
                    <td className='text-gray-500 whitespace-nowrap px-3 py-4 text-sm'>
                      {ethers.utils.formatEther(
                        (validatorData as Validator)?.staked || '0'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className='text-gray-900 px-3 py-3.5 text-left text-sm font-semibold'>
                      <strong>since</strong>
                    </td>
                    <td className='text-gray-500 whitespace-nowrap px-3 py-4 text-sm'>
                      {renderBlocktime((validatorData as Validator)?.since)}
                    </td>
                  </tr>
                  <tr>
                    <td className='text-gray-900 px-3 py-3.5 text-left text-sm font-semibold'>
                      <strong>last contestation loss time</strong>
                    </td>
                    <td className='text-gray-500 whitespace-nowrap px-3 py-4 text-sm'>
                      {renderBlocktime(
                        (lastContestationLossTimeData as ethers.BigNumber) ||
                          null
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className='min-w-full divide-y divide-gray-300'>
                <thead>
                  <tr>
                    <th
                      scope='col'
                      className='text-md text-gray-900 px-3 py-3.5 text-left font-semibold'
                    >
                      <strong>Contestation Votes</strong>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  <tr>
                    <td className='text-gray-500 whitespace-nowrap px-3 py-4 text-sm'>
                      {contestationVotesLoading && 'Loading...'}{' '}
                      {contestationVotesError &&
                        `Error! ${contestationVotesError.message}`}
                      {contestationVotesData &&
                        contestationVotesData?.contestationVotes.length === 0 &&
                        'No votes found.'}
                      {contestationVotesData &&
                        contestationVotesData?.contestationVotes.length > 0 &&
                        contestationVotesData?.contestationVotes.filter(
                          (vote: any) => vote.yea
                        ).length}{' '}
                      yea,{' '}
                      {contestationVotesData &&
                        contestationVotesData?.contestationVotes.filter(
                          (vote: any) => !vote.yea
                        ).length}{' '}
                      nay
                      {contestationVotesData &&
                        contestationVotesData?.contestationVotes.map(
                          (vote: any) => (
                            <div
                              key={vote.id}
                              className='text-cyan-600 whitespace-nowrap py-1 text-sm'
                            >
                              <a href={`/task/${vote.taskID}`}>
                                {vote.yea ? '👍' : '👎'} - {vote.taskID}
                                <br />
                                <small>{vote.timestamp}</small>
                              </a>
                            </div>
                          )
                        )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
