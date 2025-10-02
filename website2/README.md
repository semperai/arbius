# Arbius Website v2

A clean, modern rebuild of the Arbius website using only **viem** for blockchain interactions (no web3.js or ethers).

## Tech Stack

- **Next.js 15.5.4** - React framework with App Router
- **React 19** - Latest React version
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with CSS-based configuration
- **viem 2.25** - Ethereum library for blockchain interactions
- **wagmi 2.14** - React hooks for Ethereum
- **@tanstack/react-query** - Data fetching and caching
- **next-themes** - Dark mode support

## Key Features

✅ **Pure viem implementation** - No web3.js or ethers dependencies
✅ **Modern React** - Using React 19 with latest patterns
✅ **Type-safe** - Full TypeScript support with proper typing
✅ **Dark mode** - Built-in theme switching
✅ **Wallet connection** - WalletConnect integration via wagmi
✅ **Cleaner architecture** - Better organized components and utilities

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles and Tailwind config
├── components/       # React components
│   ├── providers.tsx # Wagmi and React Query providers
│   ├── Navbar.tsx    # Navigation with wallet connect
│   ├── Footer.tsx    # Footer component
│   └── WalletConnect.tsx # Wallet connection UI
├── hooks/           # Custom React hooks
│   ├── useContractRead.ts  # Hook for reading contracts
│   └── useContractWrite.ts # Hook for writing to contracts
├── lib/             # Utilities and configuration
│   ├── wagmi.ts     # Wagmi configuration with viem
│   ├── contracts.ts # Contract addresses and helpers
│   └── config.json  # Network and contract config
├── types/           # TypeScript type definitions
│   └── contracts.ts # Contract-related types
└── abis/            # Contract ABIs
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Using viem for Contract Interactions

### Reading from Contracts

```typescript
import { useReadContract } from 'wagmi'
import { contracts } from '@/lib/contracts'
import baseTokenABI from '@/abis/baseTokenV1.json'

function MyComponent() {
  const { data: balance } = useReadContract({
    address: contracts.baseToken,
    abi: baseTokenABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  return <div>Balance: {balance?.toString()}</div>
}
```

### Writing to Contracts

```typescript
import { useWriteContract } from 'wagmi'
import { contracts } from '@/lib/contracts'
import baseTokenABI from '@/abis/baseTokenV1.json'

function MyComponent() {
  const { writeContract, isPending } = useWriteContract()

  const handleTransfer = () => {
    writeContract({
      address: contracts.baseToken,
      abi: baseTokenABI,
      functionName: 'transfer',
      args: [toAddress, amount],
    })
  }

  return (
    <button onClick={handleTransfer} disabled={isPending}>
      {isPending ? 'Transferring...' : 'Transfer'}
    </button>
  )
}
```

## Differences from v1

### Removed Dependencies
- ❌ web3.js
- ❌ ethers.js
- ❌ @apollo/client (can be added back if needed)
- ❌ nightwind (replaced with next-themes)

### Improvements
- ✅ Cleaner code with viem's TypeScript-first approach
- ✅ Better tree-shaking and smaller bundle size
- ✅ Modern React patterns (React 19)
- ✅ Tailwind v4 with CSS-based configuration
- ✅ Simplified provider setup
- ✅ Better type inference for contract calls

## Environment Variables

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # Your WalletConnect project ID
```

## Supported Networks

- Ethereum Mainnet
- Arbitrum
- Arbitrum Sepolia (testnet)
- Sepolia (testnet)

## Next Steps

To complete the migration, you'll need to:

1. Create remaining pages (aius, lp-staking, models, team, etc.)
2. Migrate specific components from the original website
3. Implement contract-specific interactions using viem hooks
4. Add any missing utility functions
5. Copy over remaining assets and content

## Contributing

This is a cleaner, more maintainable version of the Arbius website. All blockchain interactions use viem for better type safety and modern best practices.
