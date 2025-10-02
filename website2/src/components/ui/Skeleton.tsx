export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <Skeleton className="mb-4 h-7 w-40" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  )
}

export function ActionCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <Skeleton className="mb-4 h-7 w-32" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
