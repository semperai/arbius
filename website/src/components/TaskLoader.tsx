import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  usePublicClient,
} from 'wagmi';
import { ethers } from 'ethers';
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

export default function TaskLoader({
  input,
  fee,
  modelid,
  version,
  template,
}: Props) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const provider = publicClient ? new ethers.providers.JsonRpcProvider(publicClient.transport.url) : undefined;
  const engine = new ethers.Contract(
    Config.v2_engineAddress,
    EngineArtifact.abi,
    provider
  );

  const [taskid, setTaskid] = useState<string>();
  const [cid, setCid] = useState<string>();
  const [validator, setValidator] = useState('');
  const [blocktime, setBlocktime] = useState(ethers.BigNumber.from(0));

  const { 
    writeContract,
    isPending: submitTaskIsLoading,
    isError: submitTaskIsError,
    isSuccess: submitTaskIsSuccess,
    data: submitTaskData,
  } = useWriteContract();

  const {
    isLoading: submitTaskTxIsLoading,
    isError: submitTaskTxIsError,
    data: submitTaskTxData,
  } = useWaitForTransactionReceipt({
    hash: cid ? undefined : submitTaskData,
  });

  let watchTaskid: string | null = null;
  console.log('submitTaskTxData', submitTaskTxData);
  if (submitTaskTxData) {
    for (const log of submitTaskTxData.logs) {
      let parsedLog;

      try {
        parsedLog = engine.interface.parseLog(log);
      } catch (e) {
        continue;
      }

      if (parsedLog.name === 'TaskSubmitted') {
        const { id: taskid, fee, model, sender } = parsedLog.args;
        watchTaskid = taskid;
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      async function f() {
        const solution = await engine.solutions(watchTaskid);

        const { validator, blocktime, cid: responseCid } = solution;

        if (validator == ethers.constants.AddressZero) {
          return;
        }

        if (responseCid === ethers.constants.HashZero) {
          return;
        }

        setValidator(validator);
        setBlocktime(blocktime);
        setCid(base58.encode(ethers.utils.arrayify(responseCid)));
        setTaskid(watchTaskid!);

        clearInterval(interval);
      }

      if (submitTaskTxData && !cid) {
        if (watchTaskid) {
          f();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitTaskTxData, submitTaskTxIsLoading]);

  useEffect(() => {
    if (!submitTaskIsLoading && !submitTaskIsError && !submitTaskIsSuccess) {
      writeContract({
        address: Config.v2_engineAddress as `0x${string}`,
        abi: EngineArtifact.abi,
        functionName: 'submitTask',
        args: [
          version,
          address,
          modelid,
          fee,
          ethers.utils.hexlify(ethers.utils.toUtf8Bytes(input)),
        ],
      });
    }
  }, [submitTaskIsLoading, submitTaskIsError, submitTaskIsSuccess]);

  return (
    <>
      <div className='max-w m-auto shadow-sm ring-1 ring-gray-200'>
        {cid ? (
          <>
            <RenderSolution template={template} cid={cid} />
            <div>
              <JSONTree
                data={{
                  taskid,
                  request: {
                    input: JSON.parse(input),
                    fee: fee.toString(),
                    modelid,
                    version,
                    txReceipt: submitTaskTxData,
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
        ) : (
          <>
            <div className='max-w-[90vw]'>
              <div className='justify-left flex flex-row'>
                <div className='bg-slate-50 rounded-md p-3'>
                  Fee: {ethers.utils.formatEther(fee)}
                </div>

                <p className='p-3'>
                  {submitTaskIsError
                    ? 'Error occurred, (did you reject tx?), please try again'
                    : ''}
                  {submitTaskIsLoading ? 'Please confirm in wallet' : ''}
                  {submitTaskIsSuccess ? `Waiting for task to be mined` : ''}
                </p>
              </div>
              <div className='overflow-x-auto'>
                {submitTaskIsSuccess && watchTaskid ? (
                  <Link
                    href={`/task/${watchTaskid}`}
                    target='_blank'
                    className='text-xs'
                  >
                    {watchTaskid}
                  </Link>
                ) : (
                  ''
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
