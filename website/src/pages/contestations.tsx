import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useTransaction,
  useChainId,
  useWatchContractEvent,
} from 'wagmi';
import { ethers } from 'ethers';
import { useQuery, gql } from '@apollo/client';
import type { Abi } from 'viem';

import Layout from '@/components/Layout';
import Config from '@/config.one.json';
import { cidify, renderBlocktime } from '@/utils';
import engineArtifact from '../app/abis/v2_enginev4.json';

const GET_RECENT_CONTESTATIONS = gql`
  query GetRecentContestations {
    contestationSubmitteds(
      limit: 100
      orderBy: timestamp_DESC
      where: { network_eq: "nova" }
    ) {
      id
      taskID
      timestamp
      address
      txHash
    }
  }
`;

export default function Contestations() {
  const { address, isConnected: walletConnected } = useAccount();
  const chainId = useChainId();
  console.log({ address });

  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));

  const {
    loading: contestationsLoading,
    error: contestationsError,
    data: contestationsData,
  } = useQuery(GET_RECENT_CONTESTATIONS);

  const { data: contestationData, isLoading: contestationIsLoading, isError: contestationIsError } = useReadContract({
    address: Config.engineAddress as `0x${string}`,
    abi: engineArtifact.abi as Abi,
    functionName: 'getContestations',
    args: [],
    query: {
      enabled: walletConnected,
    },
  });

  console.log('contestations', contestationsData);

  return (
    <Layout title='Contestations'>
      <main>
        <div className='sm:rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='mx-auto max-w-7xl'>
              <h1 className='text-gray-900 text-3xl font-bold leading-tight tracking-tight'>
                Contestations
              </h1>
            </div>

            <div className='mt-5'>
              <table className='min-w-full divide-y divide-gray-300'>
                <tbody className='divide-y divide-gray-200'>
                  <tr>
                    <td className='text-gray-500 whitespace-nowrap px-3 py-4 text-sm'>
                      {contestationsLoading && 'Loading...'}{' '}
                      {contestationsError &&
                        `Error! ${contestationsError.message}`}
                      {contestationsData &&
                        contestationsData?.contestationSubmitteds.map(
                          (contestation: any) => (
                            <div
                              key={contestation.id}
                              className='text-cyan-600 whitespace-nowrap py-1 text-sm'
                            >
                              <Link href={`/task/${contestation.taskID}`}>
                                {contestation.taskID}
                              </Link>
                              <br />
                              <Link href={`/validator/${contestation.address}`}>
                                <small>{contestation.address}</small>
                              </Link>
                              <br />
                              <small className='text-gray-600'>
                                {contestation.timestamp}
                              </small>
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
