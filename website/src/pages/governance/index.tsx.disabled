import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  useAccount,
  useContractRead,
  useContractReads,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { ethers } from 'ethers'
import Layout from '@/components/Layout';
import GetAIUSButton from '@/components/GetAIUSButton';
import ConnectWallet from '@/components/ConnectWallet';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import GovernorArtifact from '@/artifacts/GovernorV1.sol/GovernorV1.json';
import Config from '@/config.json';

export default function GovernancePage() {
  const { address } = useAccount();

  const [walletConnected, setWalletConnected] = useState(false);

  const [delegateToAddress, setDelegateToAddress] = useState('');

  const [delegateButtonDisabled, setDelegateButtonDisabled] = useState(true);
  const [currentlyDelegatedToString, setCurrentlyDelegatedToString] = useState('');

  const {
    data: currentlyDelegatedTo,
    isError: currentlyDelegatedToIsError,
    isLoading: currentlyDelegatedToIsLoading,
    refetch: currentlyDelegatedToRefetch,
  } = useContractRead({
    address: Config.baseTokenAddress as `0x${string}`,
    abi: BaseTokenArtifact.abi,
    functionName: 'delegates',
    args: [address],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      currentlyDelegatedToRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const { config: delegateConfig } = usePrepareContractWrite({
    address: Config.baseTokenAddress as `0x${string}`,
    abi: BaseTokenArtifact.abi,
    functionName: 'delegate',
    args: [delegateToAddress],
  });

  const {
    data: delegateData,
    isIdle: delegateIsIdle,
    isError: delegateIsError,
    isLoading: delegateIsLoading,
    isSuccess: delegateIsSuccess,
    write: delegateWrite
  } = useContractWrite(delegateConfig)

  const { data: delegateWaitFor } = useWaitForTransaction({
    hash: delegateData?.hash,
  });


  const {
    data: proposalsCreatedLength,
    isError: proposalsCreatedLengthIsError,
    isLoading: proposalsCreatedLengthIsLoading,
  } = useContractRead({
    address: Config.governorAddress as `0x${string}`,
    abi: GovernorArtifact.abi,
    functionName: 'proposalsCreatedLength',
  });

  let proposalsCreatedQueries = [];
  const proposalsCreatedLengthNum = proposalsCreatedLength
    ? (proposalsCreatedLength as ethers.BigNumber).toNumber()
    : 0;
  const maxProposalsToLoad = 20;
  for (
    let i=proposalsCreatedLengthNum-1;
    i >= Math.max(0, proposalsCreatedLengthNum-maxProposalsToLoad);
    --i
  ) {
    console.log('i', i);
    proposalsCreatedQueries.push({
      address: Config.governorAddress as `0x${string}`,
      abi: GovernorArtifact.abi,
      functionName: 'proposalsCreated',
      args: [i],
    });
  }

  const {
    data: proposalsCreated,
    isError: proposalsCreatedIsError,
    isLoading: proposalsCreatedIsLoading,
  } = useContractReads({
    contracts: proposalsCreatedQueries,
  });

  const [proposals, setProposals] = useState([] as ethers.BigNumber[]);

  useEffect(() => {
    if (! proposalsCreated) {
      return;
    }

    console.log('proposalsCreated', proposalsCreated);

    setProposals((proposalsCreated as ethers.BigNumber[]).filter(Boolean));
  }, [proposalsCreated]);


  useEffect(() => {
    setCurrentlyDelegatedToString(currentlyDelegatedTo as string);
  }, [currentlyDelegatedTo]);
  useEffect(() => {
    setDelegateButtonDisabled(!ethers.utils.isAddress(delegateToAddress));
  }, [delegateToAddress]);

  return (
    <Layout title="Governance">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Arbius DAO
              </h1>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Delegate voting to yourself or someone else to participate in Arbius governance. Creating proposals requires 1000 AIUS. Proposals have a 3 day period before voting starts to give people time to prepare delegation. Voting period is 3 days, then a 1 day timelock period after voting is completed. You can view the <a href={`https://nova.arbiscan.io/address/${Config.timelockAddress}`} target="_blank" className="text-cyan-700">treasury here</a>.
              </p>
            </div>
            <div className="mt-8 w-full">
              <div className="flex justify-begin space-x-4">
                <GetAIUSButton />
              </div>
            </div>

            <div className="mt-8">
              <ConnectWallet
                update={setWalletConnected}
              />

              {walletConnected && (
                <>
                  <div className="w-full lg:w-1/2 bg-slate-50 rounded-md p-5 border border-slate-200 text-black">
                    <div className="text-lg">
                      <h1>Delegate Voting Rights</h1>
                    </div>
                    <div className="text-sm mt-4">
                      { (currentlyDelegatedToString === ethers.constants.AddressZero) && (
                        <strong>You are not currently delegated to anyone</strong>
                      ) }
                      { (currentlyDelegatedToString !== ethers.constants.AddressZero) && (
                        <>
                          <strong>Currently delegating to: </strong>{currentlyDelegatedToString}
                        </>
                      ) }
                    </div>
                    <div>
                      <div className="mt-5 grid grid-cols-3 gap-4 justify-end w-full">
                        <div className="col-span-2">
                          <input
                            type="text"
                            name="delegateToAddress"
                            id="delegateToAddress"
                            value={delegateToAddress}
                            onChange={(e) => setDelegateToAddress(e.target.value)}
                            className="block w-full rounded-md border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-cyan-800 sm:text-sm sm:leading-2 bg-white dark:bg-[#26242d]"
                            placeholder="0x..."
                          />
                        </div>
    
                        <div>
                          <button
                            type="button"
                            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 shadow:sm hover:shadow transition"
                            onClick={(e) => setDelegateToAddress(address || '')}
                          >
                            Use My Address
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 shadow-sm hover:shadow disabled:opacity-25 transition"
                        onClick={(e) => delegateWrite?.()}
                        disabled={delegateButtonDisabled}
                      >
                         Delegate
                      </button>
                    </div>
                  </div>
                </>
              ) }

              <div className="mt-10">
                <h2 className="mb-2 font-semibold text-2xl text-black">
                  Proposals
                </h2>
                <ul>
                  {proposals.map((row, idx) => (
                    <li key={idx} className="py-1">
                      <Link
                        href={`/governance/proposals/${(row as ethers.BigNumber).toHexString()}`}
                        className="font-mono text-cyan-600"
                      >
                        {(row as ethers.BigNumber).toHexString()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}

