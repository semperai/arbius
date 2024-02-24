import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useWaitForTransaction,
  usePrepareContractWrite,
  useContractWrite,
  useContractEvent,
  useProvider,
} from 'wagmi'
import { ethers } from 'ethers'
import Config from '@/config.json';
import EngineArtifact from '@/artifacts/V2_EngineV2.sol/V2_EngineV2.json';
import { JSONTree } from 'react-json-tree';
import { base58 } from '@scure/base';

import RenderSolution from '@/components/RenderSolution';

import { Template, TemplateInput, TemplateOutput } from '@/types/Template';
import { jsonTheme } from '@/constants';
import { sleep } from '@/utils';


interface Props {
  input: string;
  fee: ethers.BigNumber;
  modelid: string;
  version: number;
  template: Template;
}

export default function TaskLoader({ input, fee, modelid, version, template }: Props) {
  const { address } = useAccount()
  const provider = useProvider();
  const engine = new ethers.Contract(Config.v2_engineAddress, EngineArtifact.abi, provider);

  const [watchTaskid, setWatchTaskid] = useState();
  const [cid, setCid] = useState<string>();
  const [validator, setValidator] = useState('');
  const [blocktime, setBlocktime] = useState(ethers.BigNumber.from(0));
  const [receipt, setReceipt] = useState<ethers.providers.TransactionReceipt>();

  const { config: submitTaskConfig } = usePrepareContractWrite({
    address: cid ? undefined : Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'submitTask',
    args: [
      version,
      address,
      modelid,
      fee,
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input)),
    ],
    enabled: Boolean(input),
  });

  const {
    data: submitTaskData,
    isIdle: submitTaskIsIdle,
    isError: submitTaskIsError,
    isLoading: submitTaskIsLoading,
    isSuccess: submitTaskIsSuccess,
    write: submitTaskWrite
  } = useContractWrite(submitTaskConfig)

  const {
    data: submitTaskTxData,
    isError: submitTaskTxIsError,
    isLoading: submitTaskTxIsLoading,
  } = useWaitForTransaction({
    hash: cid ? undefined : submitTaskData?.hash,
  })

  useEffect(() => {
    if (! receipt && submitTaskTxData) {
      setReceipt(submitTaskTxData);
    }
  }, [submitTaskTxData]);

  /*
  const { config: retractTaskConfig } = usePrepareContractWrite({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'retractTask',
    args: [
      watchTaskid,
    ],
    enabled: Boolean(watchTaskid && !responseCid),
  });

  const {
    data: retractTaskData,
    isIdle: retractTaskIsIdle,
    isError: retractTaskIsError,
    isLoading: retractTaskIsLoading,
    isSuccess: retractTaskIsSuccess,
    write: retractTaskWrite
  } = useContractWrite(retractTaskConfig)

  const {
    data: retractTaskTxData,
    isError: retractTaskTxIsError,
    isLoading: retractTaskTxIsLoading,
  } = useWaitForTransaction({
    hash: retractTaskData?.hash,
  })
  */

  useContractEvent({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'SolutionSubmitted',
    listener(sender, taskid) {
      console.debug('Event.SolutionSubmitted', sender, taskid)

      async function f(tries: number = 0) {
        if (cid) {
          return;
        }

        console.debug(`Event.SolutionSubmitted try ${tries}`);
        if (tries > 10) {
          console.debug('tried too many times');
          return;
        }

        if (! watchTaskid) {
          await sleep(1000);
          f(tries + 1);
          return;
        }

        if (taskid === watchTaskid) {
          const solution = await engine.solutions(watchTaskid)
          const { validator, blocktime, cid: responseCid } = solution;
          setValidator(validator);
          setBlocktime(blocktime);
          setCid(base58.encode(ethers.utils.arrayify(responseCid)));
        }
      }

      f();
    },
  })

  useEffect(() => {
    if (submitTaskIsIdle
    && !submitTaskIsLoading
    && !submitTaskIsError
    && !submitTaskIsSuccess
    ) {
      submitTaskWrite?.();
    }
    if (!watchTaskid && submitTaskTxData) {
      console.debug('submitTaskTxData', submitTaskTxData);
      for (const log of submitTaskTxData.logs) {
        let parsedLog;
        try {
          parsedLog = engine.interface.parseLog(log);
          console.debug('parsedLog', parsedLog);
        } catch (e) {
          console.debug('parsedLog failed', JSON.stringify(e));
          continue;
        }

        if (parsedLog.name === 'TaskSubmitted') {
          const {id: taskid, fee, model, sender } = parsedLog.args;
          setWatchTaskid(taskid);
        }
      }
    }
  });

  /*
  function retractTask() {
    async function f() {
      retractTaskWrite?.();
    }

    f();
  }
  */

  return (
    <>
      <div className='max-w shadow-sm ring-1 ring-gray-200 m-auto'>
        { cid ? (
          <>
            <RenderSolution template={template} cid={cid} />
            <div>
              <JSONTree
                data={{
                  taskid: watchTaskid,
                  request: {
                    input: JSON.parse(input),
                    fee: fee.toString(),
                    modelid,
                    version,
                    txReceipt: receipt,
                  },
                  response: {
                    validator,
                    cid,
                    blocktime: blocktime.toString(),
                  },
                  template,
                }}
                hideRoot={false}
                theme={jsonTheme}
                invertTheme={true}
                shouldExpandNodeInitially={(keyPath, data, level) => false}
              />
            </div>
          </>
        )/* : retractTaskTxData ? (
          <>
            <div className="p-2">
              <p>Task retracted</p>
            </div>
          </>
        )*/ : (
          <>
            <div className="max-w-[90vw]">
              <div className="flex flex-row justify-left">
                <div className="bg-slate-50 p-3 rounded-md">
                  Fee: {ethers.utils.formatEther(fee)}
                </div>

                <p className="p-3">
                  { submitTaskIsError ? 'Error occurred, (did you reject tx?), please try again' : '' }
                  { submitTaskIsLoading ? 'Please confirm in wallet' : '' }
                  { submitTaskIsSuccess ? `Waiting for task to be mined` : '' }
                </p>

                {/*
                <div className={submitTaskIsSuccess ? '' : 'hidden'}>
                  <button
                    className="rounded-md bg-slate-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 m-2"
                    onClick={retractTask}
                  >
                    Cancel <small>(10% fee applies)</small>
                  </button>
                </div>
                */}
              </div>
              <div className="overflow-x-auto">
                { (submitTaskIsSuccess && watchTaskid) ? (
                    <Link
                      href={`/task/${watchTaskid}`}
                      target="_blank"
                      className="text-xs"
                    >
                      {watchTaskid}
                    </Link>
                ) : '' }
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
