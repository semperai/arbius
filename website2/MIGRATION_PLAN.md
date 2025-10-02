# Migration Plan: Website v1 → v2 (viem-based)

## Overview
Complete migration of Arbius website from web3.js/ethers to pure viem implementation with cleaner architecture.

---

## Phase 1: Core Utility Components (Week 1)
**Priority: HIGH** - These are reusable components needed across all pages

### 1.1 Contract Interaction Components
- [ ] **TokenBalance Component** - Display token balances using viem
  - Convert `useReadContract` from ethers to viem
  - Support multiple token types (AIUS, LP tokens)
  - Add loading and error states

- [ ] **NetworkSwitch Component** - Handle chain switching with viem
  - Use wagmi's `useSwitchChain` hook
  - Support all networks (Mainnet, Arbitrum, Sepolia, Arbitrum Sepolia)
  - Show current network indicator

- [ ] **AddToWallet Component** - Add token to wallet
  - Use viem's wallet_watchAsset RPC method
  - Support both AIUS and LP tokens

### 1.2 Contract Read Components
- [ ] **ValidatorMinimum** - Show minimum validator stake
- [ ] **ActiveValidatorsCount** - Display active validator count
- [ ] **TotalSupply** - Show total token supply
- [ ] **ExpectedTotalSupply** - Calculate expected supply
- [ ] **TaskReward** - Display task reward amounts

### 1.3 Utility Hooks
- [ ] **useTokenBalance** - Custom hook for token balances with viem
- [ ] **useContractData** - Generic hook for contract reads
- [ ] **useTokenPrice** - Hook for fetching token prices (if applicable)

---

## Phase 2: Homepage Components (Week 1-2)
**Priority: MEDIUM** - Enhance the landing page

### 2.1 Hero & Info Sections
- [ ] **Quote Section** - Inspirational quote/tagline area
- [ ] **MachineLearningSection** - ML explanation
- [ ] **UncensoredArbius** - Core value proposition
- [ ] **Democratic** - Decentralization messaging

### 2.2 Product Sections
- [ ] **Models Section** - Showcase available models
- [ ] **AIUS Section** - AIUS token information
- [ ] **ArbiusModels** - Detailed model showcase
- [ ] **Showcase** - Project highlights

### 2.3 Community & Partners
- [ ] **Partners Component** - Partner logos with marquee
- [ ] **Community Section** - Links to Discord, Twitter, etc.
- [ ] **Buy Section** - How to buy AIUS
- [ ] **EACC Section** - E/acc philosophy section

---

## Phase 3: AIUS Staking Page (Week 2)
**Priority: HIGH** - Core functionality

### 3.1 Page Structure
- [ ] Create `/aius/page.tsx` in app directory
- [ ] Set up page layout with tabs
- [ ] Implement tab navigation (Dashboard, Stake, Unstake, etc.)

### 3.2 Core Components
- [ ] **Stake Component** - Main staking interface
  - Input for stake amount
  - Approve + Stake flow with viem
  - Use `useWriteContract` for approve/stake
  - Show transaction status

- [ ] **Process Component** - Staking process steps visualization
  - Step-by-step guide
  - Current status indicator

- [ ] **Steps Component** - Detailed step breakdown
- [ ] **Notifications** - Transaction notifications

### 3.3 Dashboard Tab
- [ ] Show user's staked amount
- [ ] Display staking rewards
- [ ] APY calculations
- [ ] Claim rewards functionality with viem

### 3.4 Data Fetching
- [ ] Create `useStakingData` hook
- [ ] Fetch protocol stats (total staked, APY, etc.)
- [ ] Real-time updates with wagmi query

---

## Phase 4: LP Staking Page (Week 2-3)
**Priority: HIGH** - Core functionality

### 4.1 Page Setup
- [ ] Create `/lp-staking/page.tsx`
- [ ] Port LP staking specific logic to viem
- [ ] Implement tabs for different actions

### 4.2 Core Features
- [ ] **TopHeaderSection** - Stats display
  - Total LP staked
  - APR calculation (migrate from web3.js)
  - User's LP balance

- [ ] **Stake/Unstake LP Tokens**
  - LP token approval flow
  - Stake LP with viem `writeContract`
  - Unstake functionality
  - Withdraw rewards

### 4.3 GYSR Integration (if needed)
- [ ] Port GYSR staking components
- [ ] Update contract interactions to viem
- [ ] Test reward calculations

---

## Phase 5: Models Page (Week 3)
**Priority: MEDIUM** - Showcase page

### 5.1 Page Structure
- [ ] Create `/models/page.tsx`
- [ ] Design model grid layout
- [ ] Hero section with background image

### 5.2 Components
- [ ] **ModelCard Component** - Individual model display
  - Model name, description
  - Image/thumbnail
  - CID information
  - Contract links

- [ ] **Model Stats** - Aggregated statistics
- [ ] **Model Filters** - Filter by type (image, video, etc.)

### 5.3 Model Data
- [ ] Pull model configs from `config.json`
- [ ] Display available models
- [ ] Link to model usage/docs

---

## Phase 6: Team Page (Week 3)
**Priority: LOW** - Informational page

### 6.1 Page Setup
- [ ] Create `/team/page.tsx`
- [ ] Copy team member data
- [ ] Background image setup

### 6.2 Components
- [ ] **TeamMemberCard** - Individual member display
  - Avatar/image
  - Name and title
  - Telegram link
  - Hover effects

- [ ] Team grid layout
- [ ] Mobile responsive design

---

## Phase 7: Additional Pages (Week 3-4)
**Priority: LOW to MEDIUM**

### 7.1 Upgrade Page
- [ ] Create `/upgrade/page.tsx`
- [ ] Token upgrade/migration interface
- [ ] Connect to upgrade contracts with viem
- [ ] Show upgrade status and history

### 7.2 Media Page
- [ ] Create `/media/page.tsx`
- [ ] Media resources and press kit
- [ ] Downloadable assets

### 7.3 Error Pages
- [ ] Create `app/not-found.tsx` (404)
- [ ] Create custom error pages
- [ ] Match original styling

---

## Phase 8: Advanced Features (Week 4)
**Priority: MEDIUM**

### 8.1 GraphQL Integration (Optional)
- [ ] Add Apollo Client if needed for subgraph data
- [ ] Create GraphQL queries for:
  - Historical staking data
  - Task history
  - Validator information

### 8.2 Enhanced Interactions
- [ ] **IncreaseAllowanceButton** - Approve token spending
- [ ] **ClaimButton** - Claim various rewards
- [ ] **RequestButton** - Submit model inference requests

### 8.3 Rendering Components
- [ ] **RenderSolution** - Display task outputs
- [ ] **InputTemplateRenderer** - Model input UI
- [ ] **ModelSelector** - Choose model for tasks

---

## Phase 9: Testing & Polish (Week 4-5)
**Priority: HIGH**

### 9.1 Testing
- [ ] Test all contract interactions on testnet
- [ ] Verify approve + stake flows
- [ ] Test chain switching
- [ ] Cross-browser testing
- [ ] Mobile responsiveness

### 9.2 Performance
- [ ] Optimize bundle size (check viem tree-shaking)
- [ ] Implement proper loading states
- [ ] Add error boundaries
- [ ] Optimize images

### 9.3 Documentation
- [ ] Update README with all features
- [ ] Document viem migration patterns
- [ ] Create component usage examples
- [ ] Environment setup guide

### 9.4 Final Touches
- [ ] Add animations (react-awesome-reveal equivalent)
- [ ] Implement all hover states
- [ ] Verify dark mode on all pages
- [ ] SEO metadata for all pages

---

## Phase 10: Deployment (Week 5)
**Priority: HIGH**

### 10.1 Pre-deployment
- [ ] Final build verification
- [ ] Environment variables setup
- [ ] WalletConnect project ID configuration
- [ ] Test on production networks

### 10.2 Deployment
- [ ] Deploy to staging environment
- [ ] QA testing
- [ ] Deploy to production
- [ ] Monitor for errors

### 10.3 Post-deployment
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor performance
- [ ] User feedback collection
- [ ] Bug fixes as needed

---

## Key Migration Patterns

### Web3.js/Ethers → Viem Examples

#### Reading Contracts
```typescript
// OLD (ethers)
const balance = await contract.balanceOf(address)

// NEW (viem)
const { data: balance } = useReadContract({
  address: contracts.baseToken,
  abi: baseTokenABI,
  functionName: 'balanceOf',
  args: [address]
})
```

#### Writing to Contracts
```typescript
// OLD (ethers)
const tx = await contract.stake(amount)
await tx.wait()

// NEW (viem)
const { writeContract, isPending } = useWriteContract()
writeContract({
  address: contracts.staking,
  abi: stakingABI,
  functionName: 'stake',
  args: [amount]
})
```

#### Chain Switching
```typescript
// OLD (web3)
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: `0x${chainId.toString(16)}` }]
})

// NEW (wagmi)
const { switchChain } = useSwitchChain()
switchChain({ chainId: arbitrum.id })
```

---

## Priority Order

1. **Critical Path (Must Have for Launch)**
   - Phase 1: Core utilities
   - Phase 3: AIUS Staking
   - Phase 4: LP Staking
   - Phase 9: Testing

2. **Important (Should Have)**
   - Phase 2: Homepage sections
   - Phase 5: Models page
   - Phase 8: Advanced features

3. **Nice to Have**
   - Phase 6: Team page
   - Phase 7: Additional pages

---

## Success Criteria

- ✅ All contract interactions use viem (no ethers/web3.js)
- ✅ Staking functionality works on all supported networks
- ✅ Mobile responsive on all pages
- ✅ Dark mode works correctly
- ✅ Build size is optimized
- ✅ No TypeScript errors
- ✅ All pages load in < 3s
- ✅ Transaction flows are smooth and user-friendly

---

## Team Assignments

Assign phases to team members based on expertise:
- **Smart Contract Expert**: Phases 3, 4, 8
- **Frontend Developer**: Phases 2, 5, 6, 7
- **Full Stack**: Phases 1, 9, 10

---

## Timeline Estimate

**Optimistic**: 3-4 weeks
**Realistic**: 5-6 weeks
**Conservative**: 7-8 weeks

Current status: ✅ Foundation complete (Week 1)
