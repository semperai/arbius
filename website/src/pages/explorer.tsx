import Link from 'next/link';
import { useState, useEffect } from 'react';
import { JSONTree } from 'react-json-tree';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

import {
  useBlockNumber,
  useContractRead,
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useTransaction,
} from 'wagmi';
import { ethers } from 'ethers';
import type { Abi } from 'viem';

import { getTransactionReceiptData } from '@/app/Utils/getTransactionReceiptData';
import Config from '@/config.one.json';
import engineArtifact from '../app/abis/v2_enginev4.json';

import Layout from '@/components/Layout';
import TotalSupply from '@/components/TotalSupply';
import ExpectedTotalSupply from '@/components/ExpectedTotalSupply';
import TaskReward from '@/components/TaskReward';

import { jsonTheme } from '@/constants';
import ValidatorMinimum from '@/components/ValidatorMinimum';
import ActiveValidatorsCount from '@/components/ActiveValidatorsCount';

interface Event {
  key: string;
  title: string;
  date: Date;
  data: any;
}

export default function Explorer() {
  const [search, setSearch] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));
  const [loadedHistorical, setLoadedHistorical] = useState(false);
  const chainId = useChainId();

  const [events, setEvents] = useState([] as Event[]);

  const genkey = () =>
    `evt-${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()}`;

  const {
    data: blockNumber,
    isError: blockNumberIsError,
    isLoading: blockNumberIsLoading,
  } = useBlockNumber({
    watch: events.length === 0,
  });

  const { data: taskData, isLoading: taskIsLoading, isError: taskIsError } = useReadContract({
    address: Config.engineAddress as `0x${string}`,
    abi: engineArtifact.abi as Abi,
    functionName: 'getTask',
    args: [search],
  });

  useEffect(() => {
    if (!walletConnected || !search) return;
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(
      Config.engineAddress,
      engineArtifact.abi,
      provider
    );
  }, [walletConnected, search]);

  useEffect(() => {
    if (!Config.engineAddress) return;

    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const contract = new ethers.Contract(Config.engineAddress, engineArtifact.abi, provider);

    const handleModelRegistered = (model: string, fee: bigint, sender: string) => {
      console.log('Model registered:', { model, fee, sender });
    };

    const handleSolutionSubmitted = (addr: string, task: string) => {
      console.log('Solution submitted:', { addr, task });
    };

    const handleSolutionClaimed = (addr: string, task: string) => {
      console.log('Solution claimed:', { addr, task });
    };

    contract.on('ModelRegistered', handleModelRegistered);
    contract.on('SolutionSubmitted', handleSolutionSubmitted);
    contract.on('SolutionClaimed', handleSolutionClaimed);

    return () => {
      contract.off('ModelRegistered', handleModelRegistered);
      contract.off('SolutionSubmitted', handleSolutionSubmitted);
      contract.off('SolutionClaimed', handleSolutionClaimed);
    };
  }, []);

  // Convert bigint operations
  const calculateTimeDifference = (time: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return Number(time - now);
  };

  useEffect(() => {
    async function f() {
      if (loadedHistorical || !blockNumber) {
        return;
      }
      console.log('blockNumber', blockNumber);

      const provider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL
      );
      const contract = new ethers.Contract(
        Config.engineAddress,
        engineArtifact.abi,
        provider
      );

      const blocktime = 1;
      let hevents: Event[] = [];

      const esigs = [
        'TaskSubmitted(bytes32,bytes32,uint256,address)',
        'SolutionSubmitted(address,bytes32)',
        'SolutionClaimed(address,bytes32)',
        'ContestationSubmitted(address,bytes32)',
        'ContestationVote(address,bytes32)',
      ];
      let logs = (
        await contract.queryFilter(
          {
            address: contract.address,
            topics: [esigs.map((esig) => ethers.utils.id(esig))],
          },
          Number(blockNumber) - 128,
          'latest'
        )
      )
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .map((log) => ({
          ...log,
          ...contract.interface.parseLog(log),
        }));

      for (let log of logs) {
        const key = genkey();
        const date = new Date(
          +new Date() - blocktime * 1000 * (Number(blockNumber) - log.blockNumber)
        );

        switch (log.name) {
          case 'TaskSubmitted':
            hevents.push({
              key,
              date,
              title: 'TaskSubmitted',
              data: {
                task: log.args?.id,
                model: log.args?.model,
                fee: log.args?.fee.toString(),
                sender: log.args?.sender,
              },
            });
            break;
          case 'SolutionSubmitted':
            hevents.push({
              key,
              date,
              title: 'SolutionSubmitted',
              data: {
                addr: log.args?.addr,
                task: log.args?.task,
              },
            });
            break;
          case 'SolutionClaimed':
            hevents.push({
              key,
              date,
              title: 'SolutionClaimed',
              data: {
                addr: log.args?.addr,
                task: log.args?.task,
              },
            });
            break;
          case 'ContestationSubmitted':
            hevents.push({
              key,
              date,
              title: 'ContestationSubmitted',
              data: {
                addr: log.args?.addr,
                task: log.args?.task,
              },
            });
            break;
          case 'ContestationVote':
            hevents.push({
              key,
              date,
              title: 'ContestationVote',
              data: {
                addr: log.args?.addr,
                task: log.args?.task,
                yea: log.args?.yea,
              },
            });
            break;
        }
      }

      setEvents((events) => [...hevents, ...events] as Event[]);

      setLoadedHistorical(true);
    }

    f();
  }, [blockNumber]);

  return (
    <Layout title='Explorer'>
      <main>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mx-auto max-w-7xl'>
            <h1 className='text-gray-900 text-3xl font-bold leading-tight tracking-tight'>
              Network Stats
            </h1>
          </div>
          <div className='text-slate-800'>
            {/* <div className="mt-5">
              <TotalSupply />
            </div>

            <div className="mt-5">
              <ExpectedTotalSupply />
            </div> */}

            <div className='mt-5'>
              <ValidatorMinimum />
            </div>

            <div className='mt-5'>
              <TaskReward />
            </div>

            <div className='mt-5'>
              <ActiveValidatorsCount />
            </div>
          </div>
        </div>

        <div className='bg-slate-50 border-slate-200 rounded-lg border px-4 py-5 sm:p-6'>
          <div className='mx-auto max-w-7xl'>
            <h1 className='text-gray-900 text-3xl font-bold leading-tight tracking-tight'>
              Look up Task
            </h1>
          </div>
          <div className='text-gray-500 mt-2 max-w-xl text-sm'>
            <p>Enter the task id to view all information regarding it.</p>
          </div>

          <div className='mt-5 flex justify-end sm:w-full lg:w-1/2'>
            <input
              type='text'
              name='task'
              id='task'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-white text-gray-900 block w-full rounded-full border-0 px-4 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-[#26242d] dark:focus:ring-cyan-800 sm:text-sm sm:leading-6'
              placeholder='0x...'
            />

            <Link href={`/task/${search}`}>
              <button
                type='button'
                className='bg-white text-gray-900 ml-5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                disabled={search.length === 0}
              >
                <MagnifyingGlassIcon
                  className='-ml-0.5 h-5 w-5'
                  aria-hidden='true'
                />
              </button>
            </Link>
          </div>
        </div>

        <div className='sm:rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='mx-auto max-w-7xl'>
              <h1 className='text-gray-900 text-3xl font-bold leading-tight tracking-tight'>
                Recent Activity
              </h1>
            </div>
            <div className='text-gray-500 mt-2 max-w-xl text-sm'>
              <p>Live feed of network activity.</p>
            </div>

            <div className='text-black mt-5'>
              <div>
                <strong>Activity:</strong>
              </div>

              {events.slice(0, 100).map((evt) => (
                <div key={evt.key} className='mt-2 border'>
                  <div className='text-md bg-slate-50 p-2 pl-0'>
                    <span className='p-5 pl-3 text-sm'>
                      <span className='bg-slate-100 rounded-md p-1'>
                        {evt.date.toLocaleTimeString()}{' '}
                        {evt.date.toLocaleDateString()}
                      </span>
                    </span>

                    {evt.title}

                    {evt.data.task && (
                      <Link
                        href={`/task/${evt.data.task}`}
                        className='text-cyan-700 float-right'
                        target='_blank'
                      >
                        view task
                      </Link>
                    )}
                  </div>
                  <JSONTree
                    data={evt.data}
                    hideRoot={false}
                    theme={jsonTheme}
                    invertTheme={true}
                    shouldExpandNodeInitially={(keyPath, data, level) => false}
                  />
                </div>
              ))}

              {events.length === 0 ? (
                <div key={'evt-0'}>waiting for event...</div>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
