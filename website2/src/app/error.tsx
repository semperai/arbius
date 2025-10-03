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
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong!</h2>
        <p className="mb-6 text-gray-600">{error.message}</p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
