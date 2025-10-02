import { NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, parseEther } from 'viem'
import { mainnet, arbitrum, arbitrumNova } from 'viem/chains'
import config from '@/config.json'
import baseTokenAbi from '@/abis/baseTokenV1.json'

export const runtime = 'edge'
export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
    // Create public clients for each chain
    const novaClient = createPublicClient({
      chain: arbitrumNova,
      transport: http('https://nova.arbitrum.io/rpc'),
    })

    const ethClient = createPublicClient({
      chain: mainnet,
      transport: http('https://eth.llamarpc.com'),
    })

    const oneClient = createPublicClient({
      chain: arbitrum,
      transport: http('https://arb1.arbitrum.io/rpc'),
    })

    // Fetch all balances in parallel
    const [
      engineBalanceNova,
      engineBalanceOne,
      converterBalanceEth,
      converterBalanceNova,
      daoBalanceEth,
      daoBalanceOne,
      gysrBalance,
    ] = await Promise.all([
      // Nova engine balance
      novaClient.readContract({
        address: config.v2_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: [config.v2_engineAddress as `0x${string}`],
      }),
      // Arbitrum One engine balance
      oneClient.readContract({
        address: config.v4_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: [config.v4_engineAddress as `0x${string}`],
      }),
      // Ethereum converter balance
      ethClient.readContract({
        address: config.v2_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: [config.l1OneToOneAddress as `0x${string}`],
      }),
      // Nova converter balance
      novaClient.readContract({
        address: config.v2_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: [config.l2OneToOneAddress as `0x${string}`],
      }),
      // Ethereum DAO balance
      ethClient.readContract({
        address: config.v2_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: ['0xF20D0ebD8223DfF22cFAf05F0549021525015577' as `0x${string}`],
      }),
      // Arbitrum One DAO balance
      oneClient.readContract({
        address: config.v4_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: ['0xF20D0ebD8223DfF22cFAf05F0549021525015577' as `0x${string}`],
      }),
      // GYSR balance on Ethereum
      ethClient.readContract({
        address: config.v2_baseTokenAddress as `0x${string}`,
        abi: baseTokenAbi.abi,
        functionName: 'balanceOf',
        args: ['0xA8f103eEcfb619358C35F98c9372B31c64d3f4A1' as `0x${string}`],
      }),
    ])

    // Calculate circulating supply
    // Total supply - all locked/non-circulating balances
    const totalSupply = parseEther('1000000')
    const lockedSupply =
      (engineBalanceNova as bigint) +
      (engineBalanceOne as bigint) +
      (converterBalanceEth as bigint) +
      (converterBalanceNova as bigint) +
      (daoBalanceEth as bigint) +
      (daoBalanceOne as bigint) +
      (gysrBalance as bigint)

    const circulatingSupply = totalSupply - lockedSupply

    // Return as plain text (for CoinGecko/CMC compatibility)
    return new NextResponse(formatEther(circulatingSupply), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching circulating supply:', error)
    return new NextResponse('Error fetching circulating supply', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
