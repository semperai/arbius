import { useState, useEffect } from 'react'

interface TokenStats {
  price: number | null
  marketCap: number | null
  volume24h: number | null
  priceChange24h: number | null
  circulatingSupply: number | null
  totalSupply: number
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch AIUS token statistics from CoinGecko API
 * @returns Token statistics including price, market cap, volume, and supply data
 */
export function useTokenStats(): TokenStats {

  const [apiStats, setApiStats] = useState<{
    price: number | null
    marketCap: number | null
    volume24h: number | null
    priceChange24h: number | null
  }>({
    price: null,
    marketCap: null,
    volume24h: null,
    priceChange24h: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Total supply is fixed at 1M AIUS
  const totalSupply = 1_000_000

  // Fetch price data from CoinGecko API
  useEffect(() => {
    async function fetchTokenStats() {
      try {
        setIsLoading(true)
        setError(null)

        // CoinGecko free API for AIUS token
        // Using the coin ID "arbius" for better reliability
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/arbius',
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()

        setApiStats({
          price: data.market_data?.current_price?.usd || null,
          marketCap: data.market_data?.market_cap?.usd || null,
          volume24h: data.market_data?.total_volume?.usd || null,
          priceChange24h: data.market_data?.price_change_percentage_24h || null,
        })
      } catch (err) {
        console.error('Failed to fetch token stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch token stats')
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch immediately on mount
    fetchTokenStats()
    // Refresh every 60 seconds
    const interval = setInterval(fetchTokenStats, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate circulating supply from market cap and price
  const circulatingSupply =
    apiStats.price && apiStats.marketCap
      ? apiStats.marketCap / apiStats.price
      : null

  return {
    ...apiStats,
    circulatingSupply,
    totalSupply,
    isLoading,
    error,
  }
}
