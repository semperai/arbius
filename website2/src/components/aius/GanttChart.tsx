'use client'

import { useMemo, memo } from 'react'
import type { LockPosition } from '@/types/staking'
import { formatUnits } from 'viem'

type GanttChartProps = {
  positions: LockPosition[]
}

export const GanttChart = memo(function GanttChart({ positions }: GanttChartProps) {
  // Calculate time range for the chart
  const { minTime, maxTime, currentTime, totalDuration } = useMemo(() => {
    if (positions.length === 0) {
      return { minTime: 0, maxTime: 0, currentTime: 0, totalDuration: 0 }
    }

    const now = Math.floor(Date.now() / 1000)
    const lockedTimes = positions.map(p => Number(p.lockedAt))
    const unlockTimes = positions.map(p => Number(p.unlockTime))

    const min = Math.min(...lockedTimes, now)
    const max = Math.max(...unlockTimes)

    return {
      minTime: min,
      maxTime: max,
      currentTime: now,
      totalDuration: max - min
    }
  }, [positions])

  // Generate time markers (months)
  const timeMarkers = useMemo(() => {
    if (totalDuration === 0) return []

    const markers: { date: Date; position: number }[] = []
    const startDate = new Date(minTime * 1000)
    const endDate = new Date(maxTime * 1000)

    // Start from the beginning of the next month
    const currentMarker = new Date(startDate)
    currentMarker.setDate(1)
    currentMarker.setHours(0, 0, 0, 0)
    if (currentMarker <= startDate) {
      currentMarker.setMonth(currentMarker.getMonth() + 1)
    }

    // Generate monthly markers
    while (currentMarker <= endDate) {
      const timestamp = Math.floor(currentMarker.getTime() / 1000)
      const position = ((timestamp - minTime) / totalDuration) * 100
      markers.push({
        date: new Date(currentMarker),
        position: position
      })
      currentMarker.setMonth(currentMarker.getMonth() + 1)
    }

    return markers
  }, [minTime, maxTime, totalDuration])

  // Calculate position percentages for each lock
  const lockBars = useMemo(() => {
    return positions.map(position => {
      const lockedAt = Number(position.lockedAt)
      const unlockTime = Number(position.unlockTime)

      const startPercent = ((lockedAt - minTime) / totalDuration) * 100
      const endPercent = ((unlockTime - minTime) / totalDuration) * 100
      const widthPercent = endPercent - startPercent

      const isExpired = unlockTime < currentTime
      const daysRemaining = Math.ceil((unlockTime - currentTime) / 86400)

      return {
        tokenId: position.tokenId,
        amount: position.amount,
        votingPower: position.votingPower,
        lockedAt,
        unlockTime,
        startPercent,
        widthPercent,
        isExpired,
        daysRemaining
      }
    })
  }, [positions, minTime, totalDuration, currentTime])

  // Current time indicator position
  const currentTimePercent = ((currentTime - minTime) / totalDuration) * 100

  if (positions.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="font-medium text-gray-700">No lock positions to display</p>
        <p className="text-sm text-gray-500">Create a lock to see the timeline visualization</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Lock Timeline</h4>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <span className="text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-0.5 bg-red-500"></div>
            <span className="text-gray-600">Today</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {/* Time axis with markers */}
        <div className="relative mb-4 h-8 border-b border-gray-300">
          {timeMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-0 flex h-full flex-col items-center"
              style={{ left: `${marker.position}%` }}
            >
              <div className="h-2 w-px bg-gray-300"></div>
              <span className="mt-1 text-xs text-gray-500">
                {marker.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        {/* Lock bars */}
        <div className="relative space-y-3">
          {lockBars.map((bar) => (
            <div key={bar.tokenId.toString()} className="group relative">
              {/* Position info */}
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">
                  NFT #{bar.tokenId.toString()}
                </span>
                <span className="text-gray-500">
                  {formatUnits(bar.amount, 18)} AIUS → {formatUnits(bar.votingPower, 18)} veAIUS
                </span>
              </div>

              {/* Timeline container */}
              <div className="relative h-10 rounded-lg bg-gray-100">
                {/* Lock bar */}
                <div
                  className={`absolute top-1 h-8 rounded-md shadow-md transition-all group-hover:shadow-lg ${
                    bar.isExpired
                      ? 'bg-gray-400'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`}
                  style={{
                    left: `${bar.startPercent}%`,
                    width: `${bar.widthPercent}%`
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="invisible absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Locked:</span>
                        <span>{new Date(bar.lockedAt * 1000).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Unlocks:</span>
                        <span>{new Date(bar.unlockTime * 1000).toLocaleDateString()}</span>
                      </div>
                      {!bar.isExpired && (
                        <div className="flex justify-between border-t border-gray-700 pt-1">
                          <span className="text-gray-300">Remaining:</span>
                          <span className="font-semibold">{bar.daysRemaining} days</span>
                        </div>
                      )}
                      {bar.isExpired && (
                        <div className="border-t border-gray-700 pt-1 text-center text-gray-300">
                          Expired - Ready to withdraw
                        </div>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimePercent >= 0 && currentTimePercent <= 100 && (
            <div
              className="pointer-events-none absolute top-0 h-full"
              style={{ left: `${currentTimePercent}%` }}
            >
              <div className="relative h-full">
                <div className="h-full w-0.5 bg-red-500 shadow-lg"></div>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
                  Today
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-purple-50 p-3">
          <p className="text-xs text-purple-600">Active Locks</p>
          <p className="text-xl font-bold text-purple-900">
            {lockBars.filter(b => !b.isExpired).length}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs text-green-600">Ready to Unlock</p>
          <p className="text-xl font-bold text-green-900">
            {lockBars.filter(b => b.isExpired).length}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-600">Total Positions</p>
          <p className="text-xl font-bold text-blue-900">{lockBars.length}</p>
        </div>
      </div>
    </div>
  )
})
