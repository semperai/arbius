'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { AAWalletDisplay, useAAWallet } from '@/lib/arbius-wallet'
import { parseEther, encodePacked, keccak256 } from 'viem'
import V2_EngineV6ABI from '@/abis/V2_EngineV6.json'
import { ARBIUS_CONFIG, MODELS, IPFS_GATEWAY } from '@/config/arbius'
import { Send, Loader2, Image as ImageIcon, FileText } from 'lucide-react'

const TEMPLATES = [
  'kandinsky2',
  'qwen_qwq_32b',
  'wai_v120',
  'damo',
  'robust_video_matting',
] as const

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
  const { smartAccountAddress, derivedAccount } = useAAWallet()

  const [selectedModel, setSelectedModel] = useState<string>('qwen_qwq_32b')
  const [prompt, setPrompt] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim() || !isConnected || !derivedAccount || !smartAccountAddress) {
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

      // Calculate fee (0.01 AIUS as example)
      const fee = parseEther('0.01')

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
            fee,
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
                    <img
                      src={output.url}
                      alt="Generated output"
                      className="w-full rounded"
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
    <div className="mx-auto flex h-screen max-w-6xl flex-col px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-black-text">AI Playground</h1>
          <p className="text-subtext-two">
            Chat with AI models on the Arbius network
          </p>
        </div>
        {isConnected && <AAWalletDisplay arbiusLogoSrc="/arbius_logo_round.png" />}
      </div>

      {/* Model Selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">Select Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-text focus:outline-none focus:ring-2 focus:ring-purple-text/20"
        >
          {TEMPLATES.map((modelName) => {
            const modelInfo = MODELS[modelName as keyof typeof MODELS]
            return (
              <option key={modelName} value={modelName}>
                {modelInfo?.name || modelName.replace(/_/g, ' ').toUpperCase()}
              </option>
            )
          })}
        </select>
      </div>

      {/* Chat History */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
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
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isConnected
              ? 'Enter your prompt...'
              : 'Connect wallet to submit tasks'
          }
          disabled={!isConnected || isSubmitting}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-text focus:outline-none focus:ring-2 focus:ring-purple-text/20 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={!isConnected || !prompt.trim() || isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-black-background px-6 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
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
