'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-white px-6">
      <div className="text-center">
        {/* Large 404 */}
        <div className="mb-12">
          <h1 className="bg-gradient-to-r from-[#4A28FF] to-[#92BDFF] bg-clip-text text-[120px] font-bold leading-none text-transparent md:text-[180px]">
            404
          </h1>
        </div>

        {/* Message */}
        <h2 className="mb-4 text-2xl font-semibold text-gray-900 md:text-3xl">
          Page Not Found
        </h2>
        <p className="mb-8 text-gray-600 md:text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Navigation Links */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full border-2 border-primary bg-primary px-8 py-3 font-semibold text-white transition-all hover:opacity-90"
          >
            Go Home
          </Link>
          <Link
            href="/models"
            className="rounded-full border-2 border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            Browse Models
          </Link>
        </div>
      </div>
    </div>
  )
}
