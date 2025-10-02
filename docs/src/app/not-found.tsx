import Link from 'next/link'
import { Button } from '@/components/Button'

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="font-display text-sm font-medium text-zinc-900 dark:text-white">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-tight text-zinc-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Button href="/" arrow="right" className="mt-8">
        Back to docs
      </Button>
    </div>
  )
}
