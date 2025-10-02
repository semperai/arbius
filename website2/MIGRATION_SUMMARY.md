# Migration Plan Summary

## 🎯 Objective
Migrate Arbius website from web3.js/ethers to **pure viem** with a cleaner, more maintainable architecture.

## ✅ Completed (Foundation)
- ✅ Next.js 15 + React 19 + TypeScript setup
- ✅ Viem + Wagmi configuration (no web3.js/ethers)
- ✅ Tailwind CSS v4 with theme
- ✅ Provider setup (React Query + Wagmi)
- ✅ Basic components (Navbar, Footer, WalletConnect)
- ✅ Home page structure
- ✅ Contract interaction hooks
- ✅ ABIs and config copied

## 📋 What's Left to Migrate

### **Phase 1: Core Components** (Week 1)
Reusable utilities needed everywhere:
- Token balance displays
- Network switcher
- Contract read helpers
- Add token to wallet functionality

### **Phase 2: Homepage** (Week 1-2)
Sections to port:
- Quote, ML explanation
- Models showcase
- Partners marquee
- Community links
- Buy AIUS section

### **Phase 3: AIUS Staking** (Week 2) ⭐ **HIGH PRIORITY**
Main staking page:
- Dashboard with stats
- Stake/Unstake interface
- Approve + stake flow with viem
- Rewards claiming
- Transaction notifications

### **Phase 4: LP Staking** (Week 2-3) ⭐ **HIGH PRIORITY**
LP token staking:
- LP staking interface
- APR calculations
- Stake/unstake LP
- GYSR integration

### **Phase 5: Models Page** (Week 3)
Model showcase:
- Model cards
- Stats & filters
- Model information display

### **Phase 6: Team Page** (Week 3)
Team member profiles:
- Team grid
- Member cards with links

### **Phase 7: Other Pages** (Week 3-4)
- Upgrade/migration page
- Media page
- Error pages (404, 500)

### **Phase 8: Advanced Features** (Week 4)
- GraphQL integration (optional)
- Task submission
- Result rendering
- Model selection UI

### **Phase 9: Testing & Polish** (Week 4-5) ⭐ **HIGH PRIORITY**
- Testnet testing
- Mobile responsive
- Performance optimization
- Documentation

### **Phase 10: Deployment** (Week 5) ⭐ **HIGH PRIORITY**
- Staging deployment
- Production deployment
- Monitoring

## 📊 Progress Tracker

```
[████████░░░░░░░░░░░░] 35% Complete

Foundation:     [██████████] 100%
Core Utils:     [░░░░░░░░░░]   0%
Homepage:       [░░░░░░░░░░]   0%
AIUS Staking:   [░░░░░░░░░░]   0%
LP Staking:     [░░░░░░░░░░]   0%
Other Pages:    [░░░░░░░░░░]   0%
Testing:        [░░░░░░░░░░]   0%
```

## 🔑 Key Migration Patterns

### Contract Reads (ethers → viem)
```diff
- const balance = await contract.balanceOf(address)
+ const { data: balance } = useReadContract({
+   address: contracts.baseToken,
+   abi: baseTokenABI,
+   functionName: 'balanceOf',
+   args: [address]
+ })
```

### Contract Writes (ethers → viem)
```diff
- const tx = await contract.stake(amount)
- await tx.wait()
+ const { writeContract } = useWriteContract()
+ writeContract({
+   address: contracts.staking,
+   abi: stakingABI,
+   functionName: 'stake',
+   args: [amount]
+ })
```

## ⚡ Quick Start Next Steps

1. **Start with Phase 1** - Core utility components
   ```bash
   cd website2
   # Create TokenBalance, NetworkSwitch, etc.
   ```

2. **Then Phase 3** - AIUS Staking (highest value)
   ```bash
   # Create src/app/aius/page.tsx
   # Port staking logic to viem
   ```

3. **Followed by Phase 4** - LP Staking
   ```bash
   # Create src/app/lp-staking/page.tsx
   ```

## 📈 Timeline

| Phase | Priority | Duration | Start |
|-------|----------|----------|-------|
| 1. Core Utils | HIGH | 3-4 days | Now |
| 2. Homepage | MEDIUM | 3-4 days | Day 4 |
| 3. AIUS Staking | HIGH | 5-7 days | Day 7 |
| 4. LP Staking | HIGH | 5-7 days | Day 14 |
| 5. Models | MEDIUM | 2-3 days | Day 21 |
| 6. Team | LOW | 1-2 days | Day 23 |
| 7. Other Pages | LOW | 2-3 days | Day 25 |
| 8. Advanced | MEDIUM | 3-5 days | Day 28 |
| 9. Testing | HIGH | 5-7 days | Day 33 |
| 10. Deploy | HIGH | 2-3 days | Day 40 |

**Total: 5-6 weeks** (realistic estimate)

## 🎯 Success Criteria

- [ ] Zero ethers/web3.js dependencies
- [ ] All staking functions work on testnet & mainnet
- [ ] Mobile responsive (< 768px)
- [ ] Dark mode functional
- [ ] Build time < 30s
- [ ] Page load < 3s
- [ ] Type-safe contract calls
- [ ] Error handling on all transactions

## 📁 File Structure Reference

```
website2/src/
├── app/
│   ├── aius/
│   │   └── page.tsx          ← Phase 3
│   ├── lp-staking/
│   │   └── page.tsx          ← Phase 4
│   ├── models/
│   │   └── page.tsx          ← Phase 5
│   ├── team/
│   │   └── page.tsx          ← Phase 6
│   └── upgrade/
│       └── page.tsx          ← Phase 7
├── components/
│   ├── TokenBalance.tsx      ← Phase 1
│   ├── NetworkSwitch.tsx     ← Phase 1
│   ├── staking/
│   │   ├── StakeForm.tsx     ← Phase 3
│   │   └── Dashboard.tsx     ← Phase 3
│   └── homepage/
│       ├── Quote.tsx         ← Phase 2
│       ├── Models.tsx        ← Phase 2
│       └── Partners.tsx      ← Phase 2
├── hooks/
│   ├── useTokenBalance.ts    ← Phase 1
│   ├── useStaking.ts         ← Phase 3
│   └── useLP.ts              ← Phase 4
└── lib/
    └── utils.ts              ← Phase 1
```

## 🚀 Get Started

See **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** for detailed checklist and implementation guide.
