'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useChainId, useBalance, usePublicClient, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AAWalletDisplay, useAAWallet } from '@/lib/arbius-wallet'
import { parseEther, encodePacked, keccak256, formatEther } from 'viem'
import { arbitrum } from 'viem/chains'
import { ARBIUS_CONFIG, MODELS, IPFS_GATEWAY } from '@/config/arbius'
import { PLAYGROUND_MODELS, MODEL_FEES, BASE_MINER_FEE, MODEL_MINER_FEES, type ModelCategory } from '@/config/playground'
import { Send, Loader2, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import arbiusLogoRound from '@/app/assets/images/arbius_logo_round.png'
import baseTokenAbi from '@/abis/baseTokenV1.json'

type TaskStatus = 'pending' | 'submitted' | 'completed' | 'failed'

interface Task {
  id: string
  model: string
  prompt: string
  status: TaskStatus
  txHash?: string
  taskId?: string
  result?: {
    cid: string
    outputs: Array<{ type: string; url: string }>
  }
  timestamp: number
}

export default function PlaygroundPage() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { smartAccountAddress, derivedAccount, estimateGas, error: aaWalletError } = useAAWallet()
  const publicClient = usePublicClient()

  const [selectedCategory, setSelectedCategory] = useState<ModelCategory>('text')
  const [selectedModel, setSelectedModel] = useState<string>('qwen_qwq_32b')
  const [prompt, setPrompt] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null)
  const [estimatedGasCost, setEstimatedGasCost] = useState<bigint | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Check AA wallet balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: smartAccountAddress as `0x${string}` | undefined,
    chainId,
  })

  const { data: aiusBalance, refetch: refetchAiusBalance } = useBalance({
    address: smartAccountAddress as `0x${string}` | undefined,
    token: ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]?.baseTokenAddress as `0x${string}` | undefined,
    chainId,
  })

  // Listen for AA wallet balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log('AA wallet balance updated event received')
      refetchEthBalance()
      refetchAiusBalance()
    }

    window.addEventListener('aa-wallet-balance-updated', handleBalanceUpdate)
    console.log('Added aa-wallet-balance-updated listener')
    return () => {
      window.removeEventListener('aa-wallet-balance-updated', handleBalanceUpdate)
      console.log('Removed aa-wallet-balance-updated listener')
    }
  }, [])

  // Update selected model when category changes
  useEffect(() => {
    const modelsInCategory = PLAYGROUND_MODELS[selectedCategory]
    if (modelsInCategory.length > 0 && !modelsInCategory.includes(selectedModel as any)) {
      setSelectedModel(modelsInCategory[0])
    }
  }, [selectedCategory, selectedModel])

  useEffect(() => {
    const container = document.getElementById('chat-container')
    if (container && chatEndRef.current) {
      container.scrollTop = container.scrollHeight
    }
  }, [tasks])

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('arbius_playground_tasks')
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (e) {
        console.error('Failed to load tasks:', e)
      }
    }
  }, [])

  // Save tasks to localStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('arbius_playground_tasks', JSON.stringify(tasks))
    }
  }, [tasks])

  // Calculate total cost for selected model
  const calculateTotalCost = (modelName: string) => {
    const modelFee = parseEther(MODEL_FEES[modelName] || '0')
    const minerFee = parseEther(MODEL_MINER_FEES[modelName] || BASE_MINER_FEE)
    return modelFee + minerFee
  }

  const totalCost = calculateTotalCost(selectedModel)
  const modelFee = MODEL_FEES[selectedModel] || '0'
  const minerFee = MODEL_MINER_FEES[selectedModel] || BASE_MINER_FEE

  // Estimate gas for submitTask transaction
  useEffect(() => {
    const estimateTaskGas = async () => {
      if (!smartAccountAddress || !estimateGas || !chainId) {
        setEstimatedGasCost(null)
        return
      }

      const engineAddress = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]?.engineAddress
      if (!engineAddress || engineAddress === '0x0000000000000000000000000000000000000000') {
        setEstimatedGasCost(null)
        return
      }

      // Get model ID
      const modelId = MODELS[selectedModel as keyof typeof MODELS]?.id || MODELS.kandinsky2.id

      // Build submitTask transaction data
      const input = encodePacked(['string'], ['test prompt'])
      const data = encodePacked(
        ['bytes4', 'uint8', 'address', 'bytes32', 'uint256', 'bytes'],
        [
          '0x' + keccak256(encodePacked(['string'], ['submitTask(uint8,address,bytes32,uint256,bytes)'])).slice(2, 10) as `0x${string}`,
          1, // version
          smartAccountAddress as `0x${string}`,
          modelId,
          totalCost,
          input,
        ]
      )

      try {
        const gasEstimate = await estimateGas(engineAddress as `0x${string}`, data, BigInt(0))
        if (gasEstimate && publicClient) {
          const gasPrice = await publicClient.getGasPrice()
          // Add 20% buffer
          const gasCostWithBuffer = (gasEstimate * gasPrice * BigInt(120)) / BigInt(100)
          setEstimatedGasCost(gasCostWithBuffer)
        }
      } catch (err) {
        console.error('Failed to estimate gas:', err)
        // Fallback to default estimate
        setEstimatedGasCost(parseEther('0.0001'))
      }
    }

    estimateTaskGas()
  }, [selectedModel, smartAccountAddress, estimateGas, chainId, totalCost, publicClient])

  // Check network and balances before submission
  useEffect(() => {
    // Check if on correct network first
    if (isConnected && chainId !== arbitrum.id) {
      setBalanceWarning('wrong-network')
      return
    }

    if (!smartAccountAddress || !ethBalance || !aiusBalance) {
      setBalanceWarning(null)
      return
    }

    const requiredETH = estimatedGasCost || parseEther('0.0001')

    if (aiusBalance.value < totalCost && ethBalance.value < requiredETH) {
      setBalanceWarning('Your AA wallet needs AIUS tokens for fees and ETH for gas. Send funds to your AA wallet address.')
    } else if (aiusBalance.value < totalCost) {
      setBalanceWarning(`Your AA wallet needs at least ${formatEther(totalCost)} AIUS. Send AIUS to your AA wallet address.`)
    } else if (ethBalance.value < requiredETH) {
      setBalanceWarning('Your AA wallet needs ETH for gas. Send ETH to your AA wallet address.')
    } else {
      setBalanceWarning(null)
    }
  }, [smartAccountAddress, ethBalance, aiusBalance, totalCost, estimatedGasCost, isConnected, chainId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim() || !isConnected || !derivedAccount || !smartAccountAddress) {
      return
    }

    if (balanceWarning) {
      return
    }

    setIsSubmitting(true)

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newTask: Task = {
      id: taskId,
      model: selectedModel,
      prompt: prompt.trim(),
      status: 'pending',
      timestamp: Date.now(),
    }

    setTasks((prev) => [...prev, newTask])
    setPrompt('')

    try {
      // Get engine address for current chain
      const engineAddress = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]?.engineAddress

      if (!engineAddress || engineAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Arbius Engine not deployed on this network')
      }

      // Get model ID
      const modelId = MODELS[selectedModel as keyof typeof MODELS]?.id || MODELS.kandinsky2.id

      // Encode input based on model type
      const input = encodePacked(['string'], [prompt.trim()])

      // Sign and submit transaction using AA wallet
      const tx = await derivedAccount.signTransaction({
        to: engineAddress,
        data: encodePacked(
          ['bytes4', 'uint8', 'address', 'bytes32', 'uint256', 'bytes'],
          [
            '0x' + keccak256(encodePacked(['string'], ['submitTask(uint8,address,bytes32,uint256,bytes)'])).slice(2, 10) as `0x${string}`,
            1, // version
            smartAccountAddress as `0x${string}`,
            modelId,
            totalCost,
            input,
          ]
        ),
        value: BigInt(0),
        chainId,
      })

      // Update task with tx hash
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'submitted', txHash: tx as string }
            : t
        )
      )

      // TODO: Watch for TaskSubmitted event and update with actual taskId
      // TODO: Poll IPFS for results

      // Simulate completion for demo
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed',
                  result: {
                    cid: 'QmExample...',
                    outputs: [
                      {
                        type: 'text',
                        url: `${IPFS_GATEWAY}/ipfs/QmExample...`,
                      },
                    ],
                  },
                }
              : t
          )
        )
      }, 3000)
    } catch (err) {
      console.error('Task submission error:', err)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: 'failed' } : t
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTaskResult = (task: Task) => {
    switch (task.status) {
      case 'pending':
      case 'submitted':
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{task.status === 'pending' ? 'Preparing...' : 'Processing...'}</span>
          </div>
        )

      case 'failed':
        return (
          <div className="text-sm text-red-600">
            Failed to process task
          </div>
        )

      case 'completed':
        if (!task.result) return null

        return (
          <div className="space-y-2">
            {task.result.outputs.map((output, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                {output.type === 'image' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <ImageIcon className="h-3 w-3" />
                      <span>Image Output</span>
                    </div>
                    <Image
                      src={output.url}
                      alt="Generated output"
                      className="w-full rounded"
                      width={512}
                      height={512}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span>Text Output</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{output.url}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-6xl flex-col px-4 pt-24 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Playground</h1>
          <p className="text-gray-700">
            Chat with AI models on the Arbius network
          </p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-3">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
            <AAWalletDisplay arbiusLogoSrc={arbiusLogoRound.src} />
          </div>
        )}
      </div>

      {/* Model Selector */}
      <div className="mb-4 flex items-center gap-3">
        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as ModelCategory)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring-primary/20"
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>

        {/* Model Buttons */}
        <div className="flex flex-wrap gap-2">
          {PLAYGROUND_MODELS[selectedCategory].map((modelName) => {
            const modelInfo = MODELS[modelName as keyof typeof MODELS]
            const isSelected = selectedModel === modelName
            return (
              <button
                key={modelName}
                type="button"
                onClick={() => setSelectedModel(modelName)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {modelInfo?.name || modelName.replace(/_/g, ' ').toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat History */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4" id="chat-container">
        {tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>No tasks yet. Enter a prompt to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div key={task.id} className="space-y-3">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg bg-purple-100 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 text-xs text-purple-700">
                      <span className="font-medium">{MODELS[task.model as keyof typeof MODELS]?.name || task.model}</span>
                      <span>•</span>
                      <span>{new Date(task.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-900">{task.prompt}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3">
                    {renderTaskResult(task)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      {!isConnected ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8">
          <div className="text-center">
            <p className="mb-4 text-gray-600">Connect your wallet to start using the playground</p>
            <ConnectButton />
          </div>
        </div>
      ) : (
        <>
          {aaWalletError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Failed to initialize AA wallet</p>
                  <p className="mt-1 text-xs text-red-700">
                    You need to sign a message to create your AA wallet. Please refresh the page and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              disabled={isSubmitting || !!balanceWarning || !!aaWalletError}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isSubmitting || !!balanceWarning || !!aaWalletError}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </>
      )}

      {/* Cost Info / Wrong Network Warning */}
      {isConnected && !aaWalletError && (
        <>
          {balanceWarning === 'wrong-network' ? (
            <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Wrong Network</p>
                  <p className="mt-1 text-xs text-red-800">
                    Playground only works on <strong>Arbitrum One</strong>. Please switch networks to continue.
                  </p>
                  <button
                    onClick={() => switchChain({ chainId: arbitrum.id })}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.5 21.5L14 8L21.5 21.5H6.5Z" fill="currentColor"/>
                      <path d="M14 13L10.5 19H17.5L14 13Z" fill="#213147"/>
                    </svg>
                    Switch to Arbitrum One
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`mt-4 rounded-lg border p-4 text-xs ${
              balanceWarning
                ? 'border-orange-200 bg-orange-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              {balanceWarning && (
                <div className="mb-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">{balanceWarning}</p>
                    <p className="mt-1 text-xs text-orange-700">
                      AA Wallet Address: <code className="rounded bg-orange-100 px-1 py-0.5 font-mono">{smartAccountAddress}</code>
                    </p>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <span className={balanceWarning ? 'text-orange-700' : 'text-gray-600'}>
                    Estimated cost per task:
                  </span>
                  <div className="text-right">
                    <span className={`font-mono font-semibold ${balanceWarning ? 'text-orange-900' : 'text-gray-900'}`}>
                      {formatEther(totalCost)} AIUS + ~{formatEther(estimatedGasCost || parseEther('0.0001'))} ETH
                    </span>
                    <div className={`mt-1 text-xs ${balanceWarning ? 'text-orange-600' : 'text-gray-500'}`}>
                      ({modelFee} model fee + {minerFee} miner fee)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <p>
          <strong>How it works:</strong> Your prompt is submitted to the Arbius network using your AA wallet.
          Miners process the task and results are retrieved from IPFS.
        </p>
      </div>
    </div>
  )
}
