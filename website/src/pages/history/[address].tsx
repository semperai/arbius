import {
  useState,
  useEffect,
  useRef,
} from 'react';
import { useRouter } from 'next/router'
import Link from 'next/link';
import Image from 'next/image';
import {
  useNetwork,
  useAccount,
  useContractReads,
  useContractInfiniteReads,
  paginatedIndexesConfig,
} from 'wagmi'
import { ethers } from 'ethers'

import Config from '@/config.json';
import EngineArtifact from '@/artifacts/V2_EngineV2.sol/V2_EngineV2.json';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Layout from '@/components/Layout';
import ConnectWallet from '@/components/ConnectWallet';
import RenderSolution from '@/components/RenderSolution';
import { getModelTemplate } from '@/models';
import { Template } from '@/types/Template';

import MiningImg from '@/../public/mining-icon.png';

import { cidify } from '@/utils';

interface LogTask {
  txid: string;
  timestamp: number;
  taskid: string;
  model: string;
  fee: ethers.BigNumber;
}

interface History {
  txid: string;
  taskid: string;

  fee: ethers.BigNumber;
  blocktime: Date;
  modelid: string;
  version: number;
  template: any;

  hassolution: boolean;
  solutionblocktime: Date;
  solutioncid: string;
}

interface TTask {
  blocktime: ethers.BigNumber;
  cid: string;
  fee: ethers.BigNumber;
  model: string;
  owner: string;
  version: number;
}

interface TSolution {
  validator: string;
  blocktime: ethers.BigNumber;
  claimTaskReward: boolean;
  claimed: boolean;
  cid: string;
}


export default function HistoryPage() {
  const router = useRouter()
  const { address } = router.query

  const [walletConnected, setWalletConnected] = useState(false);
  const [logTasks, setLogTasks] = useState<LogTask[]>([]);
  const [history, setHistory] = useState<History[]>([]);

  const iface = (new ethers.Contract(Config.v2_engineAddress, EngineArtifact.abi)).interface;
  console.log(iface);

  const perPage = 12;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(logTasks.length / perPage);

  function paginationButton(n: number) {
    return (
      <button
        aria-current="page"
        className={n === page
          ? "relative z-10 inline-flex items-center bg-cyan-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        }
        onClick={() => setPage(n)}
      >
        {n+1}
      </button>
    )
  }


  function paginationDivider() {
    return (
      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
        ...
      </span>
    );
  }

  let paginationChildren = [];
  for (let i=0; i<totalPages; ++i) {
    paginationChildren.push(paginationButton(i));
  }

  if (page > 4) {
    // remove paginationChildren between 3..page-3
    let a = paginationChildren.slice(0, 2)
    let b = paginationChildren.slice(page-2, page)
    let c = paginationChildren.slice(page, totalPages);
    paginationChildren = [
      ...a,
      paginationDivider(),
      ...b,
      ...c
    ];
  }

  if (paginationChildren.length > 10) {
    while (paginationChildren.length > 10) {
      let a = paginationChildren.slice(0, 8);
      let b = paginationChildren.slice(9, paginationChildren.length);

      paginationChildren = [
        ...a,
        ...b,
      ];
    }
    let a = paginationChildren.slice(0, 8);
    let b = paginationChildren.slice(8, paginationChildren.length);

    paginationChildren = [
      ...a,
      paginationDivider(),
      ...b,
    ];
  }

  if (paginationChildren.length > 8) {
    let a = Math.floor((0 + page) / 2);
    let b = Math.floor((page + totalPages) / 2);
    let furthestidx = Math.floor((0 + page) / 2);

  }

  useEffect(() => {
    async function f() {
      if (! address) {
        return;
      }

      let list = [];
      // TODO this is limited to 5000 images now
      // arbiscan only allows 5 requests per second per ip
      for (let page=1; page<6; ++page) {
        const url = `https://api-nova.arbiscan.io/api?module=logs&action=getLogs&fromBlock=8512985&address=${Config.v2_engineAddress}&topic0=${ethers.utils.id('TaskSubmitted(bytes32,bytes32,uint256,address)')}&topic0_3_opr=and&topic3=${ethers.utils.hexZeroPad(address as string, 32)}&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_APIKEY!}&offset=1000&page=${page}`;
        const res = await fetch(url);
        const j = await res.json();
        console.log(j);

        for (const {data, topics, transactionHash, timeStamp} of j.result) {
          const log = iface.parseLog({ data, topics });
          // console.log(log);
          list.push({
            txid:      transactionHash,
            timestamp: parseInt(timeStamp, 16),
            taskid:    log.args.id,
            model:     log.args.model,
            fee:       log.args.fee,
          });
        }

        // last page
        if (j.result.length < 1000) {
          break;
        }
      }

      list = list.reverse();

      setLogTasks(list);
      console.log('list', list);
    }
    
    f();
  }, [address]);

  const taskLookupConfig = {
    address: Config.v2_engineAddress,
    abi: EngineArtifact.abi,
    functionName: 'tasks',
  };

  let iota = [];
  for (let i=0; i < Math.min(logTasks.length - (page * perPage), perPage); ++i) {
    iota.push(i);
  }

  const {
    data: tasksData,
  } = useContractReads({
    enabled: logTasks.length > 0,
    // @ts-ignore
    contracts: ((logTasks.length > 0) ? iota : []).map((i) => {
      return {
        address: Config.v2_engineAddress,
        abi: EngineArtifact.abi,
        functionName: 'tasks',
        args: [
          logTasks[(page * perPage) + i].taskid,
        ],
      };
    }),
  });

  const {
    data: solutionsData,
  } = useContractReads({
    enabled: logTasks.length > 0,
    // @ts-ignore
    contracts: ((logTasks.length > 0) ? iota : []).map((i) => {
      return {
        address: Config.v2_engineAddress,
        abi: EngineArtifact.abi,
        functionName: 'solutions',
        args: [
          logTasks[(page * perPage) + i].taskid,
        ],
      };
    }),
  });

  useEffect(() => {
    if (! logTasks || logTasks.length === 0 || ! tasksData || ! solutionsData) {
      return;
    }

    let list = [];
    for (let t=0; t<tasksData.length && t<solutionsData.length; ++t) {
      const logTasksIndex = (page*perPage) + t;
      const task     = tasksData[t] as TTask;
      const solution = solutionsData[t] as TSolution;
      console.log('task', task);
      console.log('solution', solution);

      const txid = logTasks[logTasksIndex].txid;
      const taskid = logTasks[logTasksIndex].taskid;
      const fee = task.fee;
      const blocktime = new Date(task.blocktime.toNumber() * 1000);
      const modelid = task.model;
      const version = task.version;

      // console.log(modelid);
      const template = getModelTemplate(modelid);
      const hassolution = solution.validator !== ethers.constants.AddressZero;
      const solutionblocktime = new Date(solution.blocktime.toNumber() * 1000);
      const solutioncid = cidify(solution.cid);

      list.push({
        txid,
        taskid,
        fee,
        blocktime,
        modelid,
        version,
        template,
        hassolution,
        solutionblocktime,
        solutioncid,
      });
    }

    setHistory(list);
  }, [logTasks, tasksData, solutionsData]);

  return (
    <Layout title="History">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                History
              </h1>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                View past generations. Click on them to view technical details.
              </p>
            </div>

            <div className="mt-5">
              <ConnectWallet
                update={setWalletConnected}
              />
            </div>

            <div className="mt-5">
              <div className="flex flex-1 justify-between sm:hidden mb-5">
                <button
                  className={(page === 0 ? 'opacity-50' : '') + " relative inline-flex items-center rounded-md border border-gray-300 bg-cyan-500 px-4 py-2 text-sm font-medium text-white"}
                  onClick={() => setPage(page-1)}
                  disabled={page === 0}
                >
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  className={(page >= totalPages-1 ? 'opacity-50' : '') + " relative inline-flex items-center rounded-md border border-gray-300 bg-cyan-500 px-4 py-2 text-sm font-medium text-white"}
                  onClick={() => setPage(page+1)}
                  disabled={page >= totalPages-1}
                >
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <ul
                role="list"
                className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
              >
                {history.map((u) => (
                  <li key={u.taskid} className="relative">
                    <Link href={`/task/${u.taskid}`} target="_blank">
                      <div className="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">

                        {(u.hassolution && u.template) ? (
                          <RenderSolution
                            template={u.template as Template}
                            cid={u.solutioncid}
                          />
                        ) : (! u.hassolution) ? (
                          <Image
                            src={MiningImg}
                            alt="Still mining..."
                            className="opacity-50"
                            />
                        ) : (
                          <Image
                            src={MiningImg}
                            alt="No renderer"
                            className="opacity-50"
                            />
                        )}
                      </div>
                    </Link>
                    <p
                      className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
                      {u.blocktime.toLocaleTimeString()} {u.blocktime.toLocaleDateString()}
                      {u.hassolution && (
                        <span className="text-gray-500 text-xs"> ({Math.floor((u.solutionblocktime.getTime() - u.blocktime.getTime())/1000)}s)</span>
                      )}
                    </p>
                   </li>
                 ))}
              </ul>

              <div className="flex items-center justify-between border-t border-gray-200 bg-white dark:bg-[#16141d] dark:border-transparent px-4 py-3 sm:px-6 mt-20">
                {logTasks.length > 0 && (
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      className={(page === 0 ? 'opacity-50' : '') + " relative inline-flex items-center rounded-md border border-gray-300 bg-cyan-500 px-4 py-2 text-sm font-medium text-white"}
                      onClick={() => setPage(page-1)}
                      disabled={page === 0}
                    >
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      className={(page >= totalPages-1 ? 'opacity-50' : '') + " relative inline-flex items-center rounded-md border border-gray-300 bg-cyan-500 px-4 py-2 text-sm font-medium text-white"}
                      onClick={() => setPage(page+1)}
                      disabled={page >= totalPages-1}
                    >
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium font-semibold">{(logTasks.length > 0) ? page*perPage + 1 : 0}</span> to <span className="font-medium font-semibold">{Math.min((page+1)*perPage, logTasks.length)}</span> of{' '}
                      <span className="font-medium font-semibold">{logTasks.length}</span> results
                      <br />
                      <Link href="https://nova.arbiscan.io/apis" className="text-gray-400">Powered by nova.arbiscan.io</Link>
                    </p>
                  </div>
                  {logTasks.length > 0 && (
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          onClick={() => setPage(page-1)}
                          disabled={page === 0}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {paginationChildren}

                        <button
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          onClick={() => setPage(page+1)}
                          disabled={page >= totalPages-1}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
