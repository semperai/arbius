export default function Loading() {
  return (
    <div className="min-h-screen py-16 lg:py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        {/* Skeleton for title */}
        <div className="mb-8 h-16 w-1/2 animate-pulse rounded-lg bg-gray-200"></div>

        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          {/* Left skeleton */}
          <div className="h-[400px] w-full animate-pulse rounded-2xl bg-gray-200 lg:w-[48%]"></div>

          {/* Right skeleton */}
          <div className="h-[400px] w-full animate-pulse rounded-2xl bg-gray-200 lg:w-[48%]"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="mt-16 h-[300px] w-full animate-pulse rounded-2xl bg-gray-200"></div>
      </div>
    </div>
  )
}
