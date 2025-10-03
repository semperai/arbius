'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('veAIUS Page Error:', error)
  }, [error])

  return (
    <div className="min-h-screen py-16 lg:py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] text-center lg:w-[80%]">
        <h2 className="mb-4 text-3xl font-bold text-red-600">Error Loading veAIUS Staking</h2>
        <p className="mb-6 text-gray-600">{error.message}</p>
        <button
          onClick={() => reset()}
          className="rounded-full border border-purple-600 bg-transparent px-8 py-2 text-purple-600 transition-all hover:bg-purple-600 hover:text-white"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
