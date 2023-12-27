import Link from 'next/link';
import { useState, useEffect } from 'react';
import { JSONTree } from 'react-json-tree';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

import {
  useBlockNumber,
  useNetwork,
  useContractRead,
  useAccount,
  useContractEvent,
} from 'wagmi'
import { ethers } from 'ethers'

import Config from '@/config.json';
import EngineArtifact from '@/artifacts/EngineV1.sol/EngineV1.json';

import Layout from '@/components/Layout';
import TotalSupply from '@/components/TotalSupply';
import ExpectedTotalSupply from '@/components/ExpectedTotalSupply';
import TaskReward from '@/components/TaskReward';

import { jsonTheme } from '@/constants';

interface Event {
  key: string;
  title: string;
  date: Date;
  data: any;
}

export default function ExplorerPage() {
  const { chain } = useNetwork()
  const { address } = useAccount()


  const [search, setSearch] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));
  const [loadedHistorical, setLoadedHistorical] = useState(false);

  const [events, setEvents] = useState([] as Event[]);

  const genkey = () => `evt-${Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString()}`;

  const {
    data: blockNumber,
    isError: blockNumberIsError,
    isLoading: blockNumberIsLoading,
  } = useBlockNumber({
    enabled: events.length === 0,
  });

  useEffect(() => {
    async function f() {
      if (loadedHistorical || ! blockNumber) {
        return;
      }
      console.log('blockNumber', blockNumber);

      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(Config.engineAddress, EngineArtifact.abi, provider);

      const blocktime = 1;
      let hevents: Event[] = [];

      const esigs = [
        'TaskSubmitted(bytes32,bytes32,uint256,address)',
        'SolutionSubmitted(address,bytes32)',
        'SolutionClaimed(address,bytes32)',
        'ContestationSubmitted(address,bytes32)',
        'ContestationVote(address,bytes32)',
      ];
      let logs = (await contract.queryFilter({
          address: contract.address,
          topics: [ esigs.map((esig) => ethers.utils.id(esig)) ],
        },
        blockNumber-128,
        'latest',
      ))
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .map((log) => ({
        ...log,
        ...contract.interface.parseLog(log)
      }));

      for (let log of logs) {
        const key = genkey();
        const date = new Date(+(new Date) - (blocktime*1000 * (blockNumber - log.blockNumber)));

        switch (log.name) {
          case 'TaskSubmitted':
            hevents.push({
              key,
              date,
              title: 'TaskSubmitted',
              data: {
                task:   log.args?.id,
                model:  log.args?.model,
                fee:    log.args?.fee.toString(),
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
                yea:  log.args?.yea,
              },
            });
            break;
        }
      }

      setEvents(events => [...hevents, ...events] as Event[]);

      setLoadedHistorical(true);
    }

    f();

  }, [blockNumber]);

  /*
  // TODO re-write to use ethers and be more optimized
  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ModelRegistered',
    listener(id) {
      console.debug('Event.ModelRegistered', id)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'ModelRegistered',
        data: {
          id,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'SolutionMineableStatusChange',
    listener(id, enabled) {
      console.debug('Event.SolutionMineableStatusChange', id, enabled)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'SolutionMineableStatusChange',
        data: {
          id,
          enabled,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ValidatorDeposit',
    listener(addr, validator, amount) {
      console.debug('Event.ValidatorDeposit', addr, validator, amount)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'ValidatorDeposit',
        data: {
          addr,
          validator,
          amount,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ValidatorWithdrawInitiated',
    listener(addr, count, unlockTime, amount) {
      console.debug('Event.ValidatorWithdrawInitiated', addr, count, unlockTime, amount)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'ValidatorWithdrawInitiated',
        data: {
          addr,
          count,
          unlockTime,
          amount,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ValidatorWithdrawCancelled',
    listener(addr, count) {
      console.debug('Event.ValidatorWithdrawCancelled', addr, count)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'ValidatorWithdrawCancelled',
        data: {
          addr,
          count,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ValidatorWithdraw',
    listener(addr, to, count, amount) {
      console.debug('Event.ValidatorWithdraw', addr, to, count, amount)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'ValidatorWithdraw',
        data: {
          addr,
          to,
          count,
          amount,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'TaskSubmitted',
    listener(id, model, fee, sender) {
      console.debug('Event.TaskSubmitted', id, model, fee, sender)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'TaskSubmitted',
        data: {
          id,
          model,
          fee: (fee as ethers.BigNumber).toString(),
          sender,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'TaskRetracted',
    listener(id) {
      console.debug('Event.TaskRetracted', id)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'TaskRetracted',
        data: {
          id,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'SolutionSubmitted',
    listener(addr, taskid) {
      console.debug('Event.SolutionSubmitted', addr, taskid)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'SolutionSubmitted',
        data: {
          addr,
          taskid,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'SolutionClaimed',
    listener(addr, taskid) {
      console.debug('Event.SolutionClaimed', taskid)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'SolutionClaimed',
        data: {
          addr,
          taskid,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ContestationSubmitted',
    listener(addr, taskid) {
      console.debug('Event.ContestationSubmitted', addr, taskid)
      const e = {
        key: genkey(),
        date: new Date(),
        title: 'ContestationSubmitted',
        data: {
          addr,
          taskid,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'ContestationVote',
    listener(addr, taskid, yea) {
      console.debug('Event.ContestationVote', addr, taskid, yea)
      const e: Event = {
        key: genkey(),
        date: new Date(),
        title: 'ContestationVote',
        data: {
          addr,
          taskid,
          yea,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })

  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'SignalSupport',
    listener(addr, modelid, supported) {
      console.debug('Event.SignalSupport', addr, modelid, supported)
      const e: Event = {
        key: genkey(),
        date: new Date(),
        title: 'ContestationVote',
        data: {
          addr,
          modelid,
          supported,
        },
      };
      setEvents(events => [e, ...events] as Event[]);
    },
  })
  */

  return (
    <Layout title="Explorer">
      <main>
        <div className="px-4 py-5 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Network Stats
            </h1>
          </div>
          <div className="text-slate-800">
            <div className="mt-5">
              <TotalSupply />
            </div>

            <div className="mt-5">
              <ExpectedTotalSupply />
            </div>

            <div className="mt-5">
              <TaskReward />
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Look up Task
            </h1>
          </div>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Enter the task id to view all information regarding it.
            </p>
          </div>

          <div className="mt-5 flex justify-end sm:w-full lg:w-1/2">
            <input
              type="text"
              name="task"
              id="task"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-full border-0 px-4 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-cyan-800 sm:text-sm sm:leading-6 bg-white dark:bg-[#26242d]"
              placeholder="0x..."
            />

            <Link href={`/task/${search}`}>
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ml-5"
                disabled={search.length === 0}
              >
                <MagnifyingGlassIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              </button>
            </Link>
          </div>

        </div>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Recent Activity
              </h1>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Live feed of network activity.
              </p>
            </div>

            <div className="mt-5 text-black">
              <div>
                <strong>Activity:</strong>
              </div>
              
              { events.slice(0, 100).map((evt) => (
                <div key={evt.key} className="border mt-2">
                  <div className="text-md bg-slate-50 p-2 pl-0">
                    <span className="text-sm p-5 pl-3">
                      <span className="bg-slate-100 p-1 rounded-md">
                        {evt.date.toLocaleTimeString()} {evt.date.toLocaleDateString()} 
                      </span>
                    </span>

                    {evt.title}

                    {evt.data.task && (
                      <Link
                        href={`/task/${evt.data.task}`}
                        className="text-cyan-700 float-right"
                        target="_blank"
                      >
                        view task
                      </Link>
                    ) }
                  </div>
                  <JSONTree
                    data={evt.data}
                    hideRoot={false}
                    theme={jsonTheme}
                    invertTheme={true}
                    shouldExpandNodeInitially={(keyPath, data, level) => false}
                    />
                </div>
              )) }

              { (events.length === 0) ? (
                <div key={'evt-0'}>
                  waiting for event...
                </div>
               ) : '' }
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
