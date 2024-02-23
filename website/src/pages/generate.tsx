import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

import Config from '@/config.json';
import Link from 'next/link';

import Layout from '@/components/Layout';
import ConnectWallet from '@/components/ConnectWallet';
import TokenBalance from '@/components/TokenBalance';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
import ModelSelector from '@/components/ModelSelector';
import RequestButton from '@/components/RequestButton';
import FeeInput from '@/components/FeeInput';
import TaskLoader from '@/components/TaskLoader';
import InputTemplateRenderer from '@/components/InputTemplateRenderer';
import Kandinsky2Template from '@/templates/kandinsky2.json';
import { Template } from '@/types/Template';
import { getModelTemplate, getModelFee } from '@/models';


interface Task {
  input: string;
  key: string;
  fee: ethers.BigNumber;
  modelid: string;
  version: number;
  template: any;
}

export default function GeneratePage() {
  const { address } = useAccount()
  console.log('address', address);
  const [historyAddress, setHistoryAddress] = useState<string>();
  useEffect(() => setHistoryAddress(address), [address])

  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));
  const [needsAllowance, setNeedsAllowance] = useState(false);

  const [selectedModelId, setSelectedModelId] = useState(Config.models.kandinsky2.id);
  const [template, setTemplate] = useState(Kandinsky2Template);
  const [modelFee, setModelFee] = useState(ethers.BigNumber.from(Config.models.kandinsky2.params.fee));
  const [fee, setFee] = useState('0.01');

  const [requestButtonDisabled, setRequestButtonDisabled] = useState(false);
  const [requestButtonText, setRequestButtonText] = useState('Generate');

  const [tasks, setTasks] = useState([] as Task[]);

  const [inputData, setInputData] = useState(new Map<string, any>());

  useEffect(() => {
    const template = getModelTemplate(selectedModelId);
    const modelFee = getModelFee(selectedModelId);
    setTemplate(template);
    setModelFee(modelFee);


    let m = new Map();

    for (const input of template.input) {
      if (input.required) {
        if (! inputData.get(input.variable)) {
          m.set(input.variable, input.default);
          break;
        }
      }
    }
    console.log(m);

    setInputData(m);

  }, [selectedModelId]);

  // this is needed for next.js ssr
  useEffect(() => {
    // check we have filled all required fields
    let requiredFieldsFilled = true;
    console.log(inputData);
    for (const input of template.input) {
      if (input.required) {
        if (! inputData.get(input.variable)) {
          if (input.default !== '') {
            inputData.set(input.variable, input.default);
          } else {
            requiredFieldsFilled = false;
          }
          break;
        }
      }
    }

    if (walletConnected
    && tokenBalance.gte(modelFee)
    && ! needsAllowance
    && ! isNaN(parseFloat(fee))
    && requiredFieldsFilled
    ) {
      setRequestButtonDisabled(false);
    } else {
      setRequestButtonDisabled(true);
    }

  }, [inputData, walletConnected, needsAllowance, fee]);

  function clickRequest() {
    async function f() {
      setRequestButtonDisabled(true);
      setTimeout(() => {
        setRequestButtonDisabled(false);
      }, 1000);

      // this is what is sent to contract
      const input: any = {};
      inputData.forEach((value, key) => {
        input[key] = value;
      });

      setRequestButtonText('Generate');

      const task = {
        key: `${Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)}`,
        input: JSON.stringify(input),
        fee: ethers.utils.parseUnits(fee, 18),
        modelid: selectedModelId,
        version: 0,
        template,
      };

      console.debug('new task', task);
      setTasks(tasks => ([task, ...tasks] as Task[]).slice(0, 8));
    }

    f();
  }

  return (
    <Layout title="Generate">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Generate
              </h1>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Connect your wallet to be able to make requests.
                <br />
                {historyAddress && (
                  <Link
                    href={`/history/${historyAddress}`}
                    className="text-cyan-700"
                  >
                    View generation history.
                  </Link>
                )}
              </p>
            </div>

            <div className="mt-5">
              <ConnectWallet
                update={setWalletConnected}
              />
              <TokenBalance
                show={false}
                update={setTokenBalance}
                token={Config.baseTokenAddress as `0x${string}`}
              />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <ModelSelector
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                />
            </div>

            <div className="mt-10 grid sm:grid-cols-1 md:grid-cols-2">
              <InputTemplateRenderer
                template={template as Template}
                inputData={inputData}
                setInputData={setInputData}
                />

              <div>
                <div className="mt-6 gap-4 lg:mx-12">
                  <div className="flex flex-row justify-between bg-white dark:bg-transparent sm:p-1 md:p-4 border border-slate-200 rounded-md border-hidden lg:border-solid">
                    <div className="">
                      <IncreaseAllowanceButton
                        updateNeedsAllowance={setNeedsAllowance}
                        token={Config.baseTokenAddress as `0x${string}`}
                        to={Config.engineAddress as `0x${string}`}
                        />
                      {! needsAllowance && (
                        <RequestButton
                          text={requestButtonText}
                          disabled={requestButtonDisabled}
                          onClick={clickRequest}
                          />
                      )}
                    </div>
                    <div className="">
                      <FeeInput
                        value={fee}
                        setValue={setFee}
                        balance={ethers.utils.formatEther(tokenBalance)}
                        modelFee={modelFee}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4">
                  {tasks.map((task) =>
                    <TaskLoader
                      key={task.key}
                      input={task.input}
                      fee={task.fee}
                      modelid={task.modelid}
                      version={task.version}
                      template={task.template}
                      />
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
