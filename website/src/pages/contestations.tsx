import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import Link from 'next/link';
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

const GET_RECENT_CONTESTATIONS = gql`
  query GetRecentContestations {
    contestationSubmitteds(limit: 100, orderBy: timestamp_DESC, where: {network_eq: "nova"}) {
      id
      taskID
      timestamp
      address
      txHash
    }
  }
`;

export default function ContestationsPage() {
  const { address } = useAccount()

  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));

  const {
    loading: contestationsLoading,
    error:   contestationsError,
    data:    contestationsData,
  } = useQuery(GET_RECENT_CONTESTATIONS);

  console.log('contestations', contestationsData);

  return (
    <Layout title="Contestations">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Contestations
              </h1>
            </div>

            <div className="mt-5">
              <table className="min-w-full divide-y divide-gray-300">
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {contestationsLoading && 'Loading...'}                    {contestationsError && `Error! ${contestationsError.message}`}
                      {contestationsData && contestationsData?.contestationSubmitteds.map((contestation: any) => (
                        <div key={contestation.id} className="whitespace-nowrap py-1 text-sm text-cyan-600">
                          <Link href={`/task/${contestation.taskID}`}>
                            {contestation.taskID}
                          </Link>
                          <br />
                          <Link href={`/validator/${contestation.address}`}>
                            <small>{contestation.address}</small>
                          </Link>
                          <br />
                          <small className="text-gray-600">{contestation.timestamp}</small>
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
