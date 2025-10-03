# Kasumi-3 User Payment & Balance System

## Overview

This document outlines the architecture and implementation plan for adding a user balance system to Kasumi-3, allowing users to deposit AIUS tokens and pay for AI inference tasks with automatic gas cost accounting.

## Architecture Decision: Direct Detection with Wallet Linking

### Chosen Approach
Users send AIUS directly to Kasumi-3's main wallet address. The bot monitors blockchain for incoming transfers and automatically credits users based on linked wallet addresses.

### Why This Approach?

**Compared to Unique Deposit Addresses:**
- ✅ No private key management (security)
- ✅ No forwarding transactions (saves gas)
- ✅ Simpler architecture (fewer failure points)
- ✅ Users send directly to one address

**Compared to Web Payment Pages:**
- ✅ Works entirely in Telegram
- ✅ No web hosting required
- ✅ No dependency on memo fields

### Trade-offs
- ⚠️ Requires users to link wallet first (unsolicited deposits handled by admin)
- ⚠️ Exchange deposits won't work (different from-address)
- ✅ Can handle unlinking/relinking
- ✅ Simple accounting: total_balance = SUM(user_balances)

---

## System Components

### 1. Database Schema

#### Users Table
```sql
CREATE TABLE users (
  telegram_id INTEGER PRIMARY KEY,
  telegram_username TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  balance_aius TEXT NOT NULL DEFAULT '0', -- Stored as string to avoid precision loss
  linked_at INTEGER,
  created_at INTEGER NOT NULL
);
```

**Fields:**
- `telegram_id` - Telegram user ID (primary key)
- `telegram_username` - Username for reference
- `wallet_address` - Ethereum address (checksummed, required for deposits)
- `balance_aius` - Current AIUS balance in wei (as string)
- `linked_at` - Timestamp of last wallet link
- `created_at` - Account creation timestamp

#### Transactions Table
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'model_fee', 'gas_cost', 'refund', 'admin_credit'
  amount_aius TEXT NOT NULL,
  gas_cost_aius TEXT, -- Gas cost in AIUS (for model_fee transactions)
  total_cost_aius TEXT, -- amount + gas (for model_fee transactions)
  tx_hash TEXT UNIQUE,
  taskid TEXT,
  from_address TEXT, -- For deposits
  gas_used INTEGER, -- Actual gas units consumed
  gas_price_wei TEXT, -- Gas price at time of tx
  aius_eth_rate TEXT, -- AIUS per ETH exchange rate used
  block_number INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);
```

**Transaction Types:**
- `deposit` - User deposited AIUS (credited)
- `model_fee` - Deduction for model inference fee
- `gas_cost` - Deduction for gas cost (tracked separately)
- `refund` - Task failed, user refunded
- `admin_credit` - Manual credit by admin

**Gas Accounting Fields:**
- `gas_cost_aius` - Gas cost converted to AIUS at time of transaction
- `total_cost_aius` - Total deducted (model fee + gas cost)
- `gas_used` - Raw gas units for transparency
- `gas_price_wei` - Gas price used
- `aius_eth_rate` - Exchange rate snapshot (AIUS per 1 ETH)

---

### 2. Gas Cost Accounting System

#### Uniswap V2 Price Oracle

**Get AIUS/ETH Price:**
```typescript
async function getAiusPerEth(provider: ethers.Provider): Promise<bigint> {
  // Uniswap V2 pair: AIUS/WETH on Arbitrum Sepolia
  const PAIR_ADDRESS = '0x...'; // TODO: Find/create AIUS/WETH pair
  const AIUS_ADDRESS = '0x8D9753e0af7ed426c63c7D6F0424d83f257C7821';

  const pairAbi = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
  ];

  const pair = new ethers.Contract(PAIR_ADDRESS, pairAbi, provider);
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();

  // Determine which reserve is AIUS vs WETH
  const aiusIsToken0 = token0.toLowerCase() === AIUS_ADDRESS.toLowerCase();
  const aiusReserve = aiusIsToken0 ? reserve0 : reserve1;
  const wethReserve = aiusIsToken0 ? reserve1 : reserve0;

  // Price = AIUS per 1 ETH = aiusReserve / wethReserve
  // Scale to 18 decimals: (aiusReserve * 1e18) / wethReserve
  return (aiusReserve * BigInt(1e18)) / wethReserve;
}
```

#### Gas Cost Calculation

**Convert ETH gas cost to AIUS:**
```typescript
async function calculateGasCostInAius(
  receipt: ethers.TransactionReceipt,
  provider: ethers.Provider
): Promise<{ gasCostWei: bigint; gasCostAius: bigint; aiusPerEth: bigint }> {

  // Calculate gas cost in ETH (wei)
  const gasUsed = receipt.gasUsed;
  const gasPrice = receipt.gasPrice || 0n;
  const gasCostWei = gasUsed * gasPrice;

  // Get current AIUS/ETH exchange rate
  const aiusPerEth = await getAiusPerEth(provider);

  // Convert to AIUS: (gasCostWei * aiusPerEth) / 1e18
  const gasCostAius = (gasCostWei * aiusPerEth) / BigInt(1e18);

  return { gasCostWei, gasCostAius, aiusPerEth };
}
```

#### User Charge Flow

**Deduct model fee + gas from user balance:**
```typescript
async function chargeUserForTask(
  telegramId: number,
  modelFee: bigint,
  receipt: ethers.TransactionReceipt,
  provider: ethers.Provider
): Promise<void> {

  // Calculate gas cost in AIUS
  const { gasCostWei, gasCostAius, aiusPerEth } =
    await calculateGasCostInAius(receipt, provider);

  // Total cost = model fee + gas cost
  const totalCost = modelFee + gasCostAius;

  // Deduct from user balance
  const success = userService.debitBalance(telegramId, totalCost);
  if (!success) {
    throw new Error('Insufficient balance for gas + fee');
  }

  // Record transaction with gas details
  db.prepare(`
    INSERT INTO transactions (
      telegram_id, type, amount_aius, gas_cost_aius, total_cost_aius,
      tx_hash, taskid, gas_used, gas_price_wei, aius_eth_rate, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    telegramId,
    'model_fee',
    modelFee.toString(),
    gasCostAius.toString(),
    totalCost.toString(),
    receipt.hash,
    taskid,
    Number(receipt.gasUsed),
    receipt.gasPrice?.toString() || '0',
    aiusPerEth.toString(),
    Date.now()
  );

  log.info(
    `Charged user ${telegramId}: ` +
    `${ethers.formatEther(modelFee)} AIUS (model) + ` +
    `${ethers.formatEther(gasCostAius)} AIUS (gas) = ` +
    `${ethers.formatEther(totalCost)} AIUS total`
  );
}
```

#### Auto Gas Swapping

**Automatically swap AIUS → ETH when running low:**
```typescript
// Configuration
const ETH_MIN_BALANCE = ethers.parseEther('0.01');  // Trigger threshold
const ETH_TARGET_BALANCE = ethers.parseEther('0.05'); // Top-up target
const AIUS_MIN_RESERVE = ethers.parseEther('1000');  // Don't go below this
const MAX_SLIPPAGE_BPS = 100; // 1% slippage tolerance

async function autoSwapForGas(
  provider: ethers.Provider,
  wallet: ethers.Wallet
): Promise<void> {

  const ethBalance = await provider.getBalance(wallet.address);

  if (ethBalance >= ETH_MIN_BALANCE) {
    return; // Sufficient ETH
  }

  log.warn(`ETH balance low: ${ethers.formatEther(ethBalance)} ETH`);

  // Calculate how much ETH we need
  const ethNeeded = ETH_TARGET_BALANCE - ethBalance;

  // Get AIUS/ETH exchange rate
  const aiusPerEth = await getAiusPerEth(provider);

  // Calculate AIUS to swap
  const aiusToSwap = (ethNeeded * aiusPerEth) / BigInt(1e18);

  // Check we have enough AIUS
  const aiusBalance = await aiusToken.balanceOf(wallet.address);
  const availableAius = aiusBalance - AIUS_MIN_RESERVE;

  if (availableAius < aiusToSwap) {
    throw new Error(
      `Cannot swap for gas: need ${ethers.formatEther(aiusToSwap)} AIUS, ` +
      `only ${ethers.formatEther(availableAius)} AIUS available after reserve`
    );
  }

  // Execute swap via Uniswap V2 Router
  const swapReceipt = await swapAiusForEth(
    wallet,
    aiusToSwap,
    ethNeeded,
    MAX_SLIPPAGE_BPS
  );

  const newEthBalance = await provider.getBalance(wallet.address);

  log.info(
    `Swapped ${ethers.formatEther(aiusToSwap)} AIUS → ` +
    `${ethers.formatEther(newEthBalance - ethBalance)} ETH. ` +
    `New ETH balance: ${ethers.formatEther(newEthBalance)}`
  );
}

async function swapAiusForEth(
  wallet: ethers.Wallet,
  aiusAmount: bigint,
  minEthOut: bigint,
  maxSlippageBps: number
): Promise<ethers.TransactionReceipt> {

  const UNISWAP_V2_ROUTER = '0x...'; // Uniswap V2 Router on Arbitrum Sepolia
  const WETH_ADDRESS = '0x...'; // WETH address

  const routerAbi = [
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)'
  ];

  const router = new ethers.Contract(UNISWAP_V2_ROUTER, routerAbi, wallet);

  // Calculate minimum ETH with slippage
  const minEthWithSlippage = (minEthOut * BigInt(10000 - maxSlippageBps)) / BigInt(10000);

  // Approve router to spend AIUS
  const aiusToken = new ethers.Contract(AIUS_ADDRESS, erc20Abi, wallet);
  await aiusToken.approve(UNISWAP_V2_ROUTER, aiusAmount);

  // Swap path: AIUS → WETH
  const path = [AIUS_ADDRESS, WETH_ADDRESS];

  // Execute swap
  const tx = await router.swapExactTokensForETH(
    aiusAmount,
    minEthWithSlippage,
    path,
    wallet.address,
    Math.floor(Date.now() / 1000) + 600 // 10 min deadline
  );

  return await tx.wait();
}
```

**Integration with Task Submission:**
```typescript
async function submitTask(
  modelId: string,
  input: string,
  telegramId: number
): Promise<string> {

  // 1. Check if we need to swap for gas BEFORE submitting
  await autoSwapForGas(provider, wallet);

  // 2. Submit task to blockchain
  const tx = await arbiusRouter.submitTask(
    0, modelId, wallet.address, modelFee, inputBytes, 0, 200_000
  );

  // 3. Wait for confirmation
  const receipt = await tx.wait();

  // 4. Charge user (model fee + gas cost in AIUS)
  await chargeUserForTask(telegramId, modelFee, receipt, provider);

  return taskid;
}
```

---

## User Flow Diagrams

### First Time User Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User starts bot                                       │
│    /start                                                │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Bot prompts to link wallet                            │
│    "Link your wallet: /link <address>"                   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 3. User links wallet                                     │
│    /link 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Bot creates user account                              │
│    - Validates address                                   │
│    - Stores in database                                  │
│    - Checks for unclaimed deposits                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 5. User requests deposit info                            │
│    /deposit                                              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Bot shows deposit address                             │
│    "Send AIUS to: 0xKasumi3Address..."                   │
│    "Current balance: 0 AIUS"                             │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 7. User sends AIUS from MetaMask/wallet                  │
│    Transfer(from=user, to=kasumi3, amount=100 AIUS)      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 8. DepositMonitor detects transfer                       │
│    - Checks if from-address is linked                    │
│    - Credits user's balance                              │
│    - Sends notification                                  │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 9. User receives notification                            │
│    "🎉 Deposit received! +100 AIUS"                      │
│    "New balance: 100 AIUS"                               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 10. User submits task                                    │
│     /qwen sunset over mountains                          │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 11. Bot checks balance & submits task                    │
│     - Checks if auto-swap needed for gas                 │
│     - Submits task on-chain                              │
│     - Calculates gas cost in AIUS                        │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 12. Bot debits user balance                              │
│     - Model fee: 0.1 AIUS                                │
│     - Gas cost: 0.002 AIUS (estimated from receipt)      │
│     - Total: 0.102 AIUS                                  │
│     - User balance: 100 AIUS → 99.898 AIUS               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 13. Task completes                                       │
│     "✅ Complete!"                                       │
│     "Cost: 0.1 AIUS (model) + 0.002 AIUS (gas)"          │
│     "New balance: 99.898 AIUS"                           │
└─────────────────────────────────────────────────────────┘
```

### Unsolicited Deposit Flow (No Wallet Link)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User sends AIUS BEFORE linking wallet                │
│    Transfer(from=0xABC..., to=kasumi3, amount=50)       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. DepositMonitor detects transfer                       │
│    - from-address NOT linked to any user                 │
│    - Logs warning: "Unsolicited deposit from 0xABC..."   │
│    - No automatic credit                                 │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 3. User contacts admin                                   │
│    "I sent 50 AIUS from 0xABC but it's not showing up"   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Admin manually credits user                           │
│    /admin credit @user 50 0xABC... tx:0x123...           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│ 5. User receives credit and links wallet                 │
│    "✅ 50 AIUS credited to your account"                 │
│    /link 0xABC...                                        │
│    "✅ Wallet linked for future deposits"                │
└─────────────────────────────────────────────────────────┘
```

**Note:** This is a rare edge case. Normal users link first before depositing.

---

## Implementation Plan

### Phase 1: Database & User Service (Week 1)

**Tasks:**
1. Install dependencies
2. Create database schema
3. Implement UserService class
4. Add database migrations
5. Write unit tests

**Files to Create:**
- `src/services/UserService.ts`
- `src/types/user.ts`
- `migrations/001_create_users.sql`
- `tests/services/UserService.test.ts`

**Dependencies:**
```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Key Methods:**
```typescript
class UserService {
  linkWallet(telegramId, walletAddress, username?)
  getUserByTelegramId(telegramId)
  getUserByWallet(walletAddress)
  getBalance(telegramId)
  creditBalance(telegramId, amount, txHash, fromAddress)
  debitBalance(telegramId, amount, type) // type: 'model_fee', 'gas_cost', etc.
  getTransactionHistory(telegramId, limit)
  adminCreditUser(telegramId, amount, note) // For manual credits
}
```

**Success Criteria:**
- ✅ Database tables created
- ✅ All CRUD operations work
- ✅ Balance arithmetic is precise (no floating point)
- ✅ Unit tests pass (>90% coverage)

---

### Phase 2: Deposit Monitoring (Week 2)

**Tasks:**
1. Implement DepositMonitor class
2. Add Transfer event listening
3. Add historical deposit scanning
4. Implement notification system
5. Write integration tests

**Files to Create:**
- `src/services/DepositMonitor.ts`
- `tests/services/DepositMonitor.test.ts`

**Key Features:**
```typescript
class DepositMonitor {
  start()  // Begin listening for deposits
  stop()   // Stop listening
  scanRecentDeposits(blocksToScan)  // Catch missed deposits
  handleDeposit(from, amount, txHash, blockNumber)
}
```

**Event Handling:**
```typescript
// Listen for Transfer events to Kasumi-3's address
const filter = token.filters.Transfer(null, kasumi3Address);

token.on(filter, async (from, to, amount, event) => {
  // 1. Check if from-address is linked to a user
  const user = await userService.getUserByWallet(from);

  if (user) {
    // 2. Credit user automatically
    await userService.creditBalance(user.telegram_id, amount, event.transactionHash, from);

    // 3. Send Telegram notification
    await bot.telegram.sendMessage(
      user.telegram_id,
      `🎉 Deposit received! +${ethers.formatEther(amount)} AIUS\n` +
      `New balance: ${ethers.formatEther(await userService.getBalance(user.telegram_id))} AIUS`
    );
  } else {
    // Unsolicited deposit - log warning for admin review
    log.warn(
      `Unsolicited deposit: ${ethers.formatEther(amount)} AIUS from ${from} ` +
      `(tx: ${event.transactionHash}). User not linked.`
    );
  }
});
```

**Success Criteria:**
- ✅ Deposits detected in real-time
- ✅ Historical deposits scanned on startup
- ✅ Linked users credited automatically
- ✅ Unsolicited deposits logged for admin
- ✅ Users notified via Telegram

---

### Phase 3: Bot Commands (Week 3)

**Tasks:**
1. Add `/link` command
2. Add `/deposit` command
3. Add `/balance` command
4. Add `/history` command
5. Update help text
6. Add error handling

**Commands to Implement:**

#### `/link <wallet_address>`
Links user's Telegram account to their Ethereum wallet.

**Example:**
```
User: /link 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Bot: ✅ Wallet linked successfully!

     Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
     Current balance: 0 AIUS
```

**With unclaimed deposits:**
```
User: /link 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Bot: ✅ Wallet linked successfully!

     🎉 Found 2 unclaimed deposits!
     • 100 AIUS from tx 0x123...
     • 50 AIUS from tx 0x456...

     Total credited: 150 AIUS
     Current balance: 150 AIUS
```

**Error cases:**
```
User: /link invalid-address
Bot: ❌ Invalid wallet address. Please provide a valid Ethereum address.

User: /link
Bot: 🔗 Link Your Wallet

     Usage: /link <wallet_address>

     Example:
     /link 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

#### `/deposit`
Shows deposit instructions and current balance.

**Example:**
```
User: /deposit
Bot: 💰 Deposit AIUS to Kasumi-3

     ✅ Your wallet is linked!

     Kasumi-3 Address:
     0xYourMainWalletAddress...

     Send AIUS from your linked wallet:
     0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

     Deposits are credited automatically!

     Current balance: 150 AIUS
```

**Not linked:**
```
User: /deposit
Bot: 💰 Deposit AIUS to Kasumi-3

     ⚠️ Link your wallet first: /link <address>

     Kasumi-3 Address:
     0xYourMainWalletAddress...

     After sending, link your wallet to claim the deposit.

     Current balance: 0 AIUS
```

#### `/balance`
Shows current balance and recent transactions.

**Example:**
```
User: /balance
Bot: 💳 Your Balance

     150 AIUS

     Recent transactions:
     📥 +100 AIUS (deposit)
     📤 -0.102 AIUS (model + gas)
     📥 +50 AIUS (deposit)
     📤 -0.105 AIUS (model + gas)
```

#### `/history [limit]`
Shows detailed transaction history with gas breakdown.

**Example:**
```
User: /history 10
Bot: 📜 Transaction History

     1. 📥 Deposit: +100 AIUS
        From: 0x742d...
        Tx: 0x123...
        Date: 2025-10-03 14:23

     2. 📤 Task Cost: -0.102 AIUS
        Model fee: 0.1 AIUS
        Gas cost: 0.002 AIUS
        Task: 0xabc...
        Model: qwen
        Gas used: 45,321 units @ 0.1 gwei
        AIUS/ETH rate: 50,000
        Date: 2025-10-03 14:25

     ... (8 more)
```

**Success Criteria:**
- ✅ All commands work correctly
- ✅ Error messages are helpful
- ✅ UI is clean and informative
- ✅ Commands handle edge cases

---

### Phase 4: Task Fee Integration (Week 4)

**Tasks:**
1. Modify TaskProcessor to check balances
2. Debit fees on task submission
3. Add fee preview before submission
4. Handle insufficient balance errors
5. Add refund mechanism for failed tasks

**Changes to TaskProcessor:**

```typescript
async submitAndQueueTask(
  modelConfig: ModelConfig,
  input: Record<string, any>,
  telegramId?: number,
  metadata?: { chatId?: number; messageId?: number }
): Promise<{ taskid: string; job: TaskJob }> {

  // 1. Get model fee from blockchain
  const model = await this.blockchain.getArbiusContract().models(modelConfig.id);
  const modelFee = model.fee;

  // 2. Estimate total cost (model + gas)
  // Note: We estimate gas, then charge actual after receipt
  const estimatedGasCost = await this.estimateGasCostInAius();
  const estimatedTotal = modelFee + estimatedGasCost;

  // 3. Check user balance (if telegramId provided)
  if (telegramId) {
    const userBalance = this.userService.getBalance(telegramId);

    if (userBalance < estimatedTotal) {
      throw new Error(
        `Insufficient balance.\n\n` +
        `Model fee: ${ethers.formatEther(modelFee)} AIUS\n` +
        `Est. gas: ${ethers.formatEther(estimatedGasCost)} AIUS\n` +
        `Total: ~${ethers.formatEther(estimatedTotal)} AIUS\n\n` +
        `Your balance: ${ethers.formatEther(userBalance)} AIUS\n\n` +
        `Deposit more: /deposit`
      );
    }
  }

  // 4. Check if auto-swap needed for gas
  await this.autoSwapForGas();

  // 5. Submit task to blockchain (using bot's main wallet)
  const inputStr = JSON.stringify(input);
  const { taskid, receipt } = await this.blockchain.submitTask(modelConfig.id, inputStr, 0n);

  // 6. Calculate actual gas cost and charge user
  if (telegramId) {
    const { gasCostAius, aiusPerEth } = await this.calculateGasCostInAius(receipt);
    const totalCost = modelFee + gasCostAius;

    // Debit total cost from user
    const debited = this.userService.debitBalance(telegramId, totalCost, 'model_fee');

    if (!debited) {
      // Refund not needed since we haven't charged yet - just throw error
      throw new Error('Failed to debit balance. Please try again.');
    }

    // Store detailed transaction record
    this.db.prepare(`
      INSERT INTO transactions (
        telegram_id, type, amount_aius, gas_cost_aius, total_cost_aius,
        tx_hash, taskid, gas_used, gas_price_wei, aius_eth_rate, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      telegramId,
      'model_fee',
      modelFee.toString(),
      gasCostAius.toString(),
      totalCost.toString(),
      receipt.hash,
      taskid,
      Number(receipt.gasUsed),
      receipt.gasPrice?.toString() || '0',
      aiusPerEth.toString(),
      Date.now()
    );

    log.info(
      `Charged user ${telegramId}: ` +
      `${ethers.formatEther(modelFee)} AIUS (model) + ` +
      `${ethers.formatEther(gasCostAius)} AIUS (gas) = ` +
      `${ethers.formatEther(totalCost)} AIUS total`
    );
  }

  // 7. Add to job queue
  const job = await this.jobQueue.addJob({
    taskid,
    modelConfig,
    input,
    chatId: metadata?.chatId,
    messageId: metadata?.messageId,
  });

  return { taskid, job };
}
```

**Model Command Updates:**

```typescript
bot.on(message('text'), async (ctx) => {
  // ... existing code ...

  if (text.startsWith('/')) {
    const parts = text.split(' ');
    const commandName = parts[0].substring(1).toLowerCase();
    const prompt = parts.slice(1).join(' ');

    const modelConfig = this.modelRegistry.getModelByName(commandName);
    if (modelConfig) {
      // Get model fee and estimate gas
      const model = await arbius.models(modelConfig.id);
      const modelFee = model.fee;
      const estimatedGas = await taskProcessor.estimateGasCostInAius();
      const estimatedTotal = modelFee + estimatedGas;

      // Show cost preview
      await ctx.reply(
        `🔄 Processing with ${modelConfig.template.meta.title}\n\n` +
        `Model fee: ${ethers.formatEther(modelFee)} AIUS\n` +
        `Est. gas: ${ethers.formatEther(estimatedGas)} AIUS\n` +
        `Total: ~${ethers.formatEther(estimatedTotal)} AIUS`
      );

      try {
        const { taskid, job } = await this.taskProcessor.submitAndQueueTask(
          modelConfig,
          { prompt },
          ctx.from.id,  // Pass Telegram ID
          { chatId: ctx.chat.id, messageId: responseCtx?.message_id }
        );

        // ... continue with job processing ...
      } catch (err: any) {
        if (err.message.includes('Insufficient balance')) {
          ctx.reply(err.message);
        } else {
          ctx.reply(`❌ Failed to process: ${err.message}`);
        }
      }
    }
  }
});
```

**Refund Mechanism:**

```typescript
// If task fails, refund the user (model fee + gas cost)
async refundTask(taskid: string) {
  const transaction = this.db.prepare(`
    SELECT * FROM transactions
    WHERE taskid = ? AND type = 'model_fee'
  `).get(taskid);

  if (transaction) {
    const refundAmount = BigInt(transaction.total_cost_aius);

    this.userService.creditBalance(
      transaction.telegram_id,
      refundAmount,
      `refund_${taskid}`,
      'system'
    );

    // Record refund transaction
    this.db.prepare(`
      INSERT INTO transactions (
        telegram_id, type, amount_aius, taskid, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      transaction.telegram_id,
      'refund',
      refundAmount.toString(),
      taskid,
      Date.now()
    );

    log.info(
      `Refunded ${ethers.formatEther(refundAmount)} AIUS ` +
      `(model + gas) for failed task ${taskid} to user ${transaction.telegram_id}`
    );
  }
}
```

**Success Criteria:**
- ✅ Balance checked before task submission
- ✅ Gas cost estimated and shown to user
- ✅ Actual gas cost calculated from receipt
- ✅ Total fee (model + gas) deducted on submission
- ✅ User sees cost breakdown in history
- ✅ Insufficient balance handled gracefully
- ✅ Failed tasks trigger full refunds (model + gas)

---

## Security Considerations

### 1. SQL Injection Prevention
- ✅ Use prepared statements for all queries
- ✅ Never concatenate user input into SQL
- ✅ Validate all inputs before database operations

```typescript
// ✅ GOOD
this.db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);

// ❌ BAD
this.db.exec(`SELECT * FROM users WHERE telegram_id = ${telegramId}`);
```

### 2. Address Validation
- ✅ Use `ethers.getAddress()` to validate and checksum addresses
- ✅ Reject invalid addresses immediately
- ✅ Store addresses in checksummed format

```typescript
try {
  const normalized = ethers.getAddress(walletAddress);
  // Use normalized address
} catch (e) {
  throw new Error('Invalid Ethereum address');
}
```

### 3. Precision Handling
- ✅ Store balances as strings (not numbers)
- ✅ Use BigInt for all arithmetic
- ✅ Never use floating point for token amounts

```typescript
// ✅ GOOD
const balance = BigInt(user.balance);
const newBalance = balance + amount;
db.prepare('UPDATE users SET balance = ?').run(newBalance.toString());

// ❌ BAD
const balance = parseFloat(user.balance);
const newBalance = balance + parseFloat(amount);
```

### 4. Race Condition Prevention
- ✅ Use database transactions for balance updates
- ✅ Lock rows during balance modifications
- ✅ Ensure ACID properties

```typescript
this.db.transaction(() => {
  const user = this.getUserByTelegramId(telegramId);
  const newBalance = BigInt(user.balance) + amount;
  this.db.prepare('UPDATE users SET balance = ? WHERE telegram_id = ?')
    .run(newBalance.toString(), telegramId);
  this.db.prepare('INSERT INTO transactions ...').run(...);
})();
```

### 5. Replay Attack Prevention
- ✅ Check tx_hash uniqueness in transactions table
- ✅ Use UNIQUE constraint on tx_hash column
- ✅ Detect duplicate deposits

```typescript
try {
  this.db.prepare(`
    INSERT INTO transactions (tx_hash, ...)
    VALUES (?, ...)
  `).run(txHash, ...);
} catch (e) {
  if (e.message.includes('UNIQUE constraint')) {
    log.warn(`Duplicate transaction detected: ${txHash}`);
    return; // Skip duplicate
  }
  throw e;
}
```

### 6. Access Control
- ✅ Users can only view their own balance
- ✅ Users can only spend their own balance
- ✅ Admin commands require authorization

```typescript
// Check user owns the resource
if (task.telegram_id !== ctx.from.id) {
  throw new Error('Access denied');
}
```

---

## Error Handling

### Deposit Errors

| Error | Cause | Handling |
|-------|-------|----------|
| **Duplicate tx_hash** | Same transaction processed twice | Skip silently, log warning |
| **Invalid from address** | Malformed address in event | Log error, store as-is |
| **Database write failure** | DB locked/corrupted | Retry 3 times, alert admin |
| **Notification failure** | Telegram API down | Store notification for retry |

### Balance Errors

| Error | Cause | Handling |
|-------|-------|----------|
| **Insufficient balance** | User has too little AIUS | Show friendly error with /deposit link |
| **Negative balance** | Logic bug | Prevent via constraints, alert admin |
| **Overflow** | Balance > max BigInt | Unlikely with AIUS supply, but validate |
| **Concurrent modification** | Race condition | Use transactions to prevent |

### Linking Errors

| Error | Cause | Handling |
|-------|-------|----------|
| **Invalid address** | User typo | Validate with ethers.getAddress(), show error |
| **Address already linked** | Another user linked this wallet | Allow relinking (user may have new account) |
| **Database constraint** | Unique violation | Show error, suggest unlinking first |

---

## Testing Strategy

### Unit Tests

**UserService.test.ts:**
```typescript
describe('UserService', () => {
  describe('linkWallet', () => {
    it('should link valid wallet address');
    it('should reject invalid address');
    it('should normalize address to checksum format');
    it('should allow relinking to new address');
    it('should claim pending deposits on link');
  });

  describe('balance operations', () => {
    it('should credit balance correctly');
    it('should debit balance correctly');
    it('should reject debit if insufficient balance');
    it('should handle concurrent balance updates');
    it('should never allow negative balance');
  });

  describe('unclaimed deposits', () => {
    it('should store unclaimed deposits');
    it('should claim deposits when wallet linked');
    it('should not double-claim deposits');
  });
});
```

**DepositMonitor.test.ts:**
```typescript
describe('DepositMonitor', () => {
  it('should detect incoming transfers');
  it('should credit linked users automatically');
  it('should store unclaimed deposits');
  it('should scan historical deposits on startup');
  it('should handle duplicate events gracefully');
  it('should notify users of deposits');
});
```

### Integration Tests

```typescript
describe('Payment System Integration', () => {
  it('should handle full deposit flow', async () => {
    // 1. Link wallet
    await userService.linkWallet(123, '0xABC...');

    // 2. Simulate deposit
    await simulateTransfer('0xABC...', kasumi3Address, parseEther('100'));

    // 3. Wait for detection
    await sleep(1000);

    // 4. Verify balance
    const balance = userService.getBalance(123);
    expect(balance).toBe(parseEther('100'));
  });

  it('should handle unclaimed deposits', async () => {
    // 1. Simulate deposit BEFORE linking
    await simulateTransfer('0xABC...', kasumi3Address, parseEther('50'));

    // 2. Verify unclaimed
    const unclaimed = db.prepare('SELECT * FROM unclaimed_deposits').all();
    expect(unclaimed.length).toBe(1);

    // 3. Link wallet
    const claimed = await userService.linkWallet(123, '0xABC...');

    // 4. Verify claimed
    expect(claimed.total).toBe(parseEther('50'));
    expect(userService.getBalance(123)).toBe(parseEther('50'));
  });

  it('should deduct fees on task submission', async () => {
    // Setup user with balance
    await userService.linkWallet(123, '0xABC...');
    await userService.creditBalance(123, parseEther('10'), '0x000', '0xABC');

    // Submit task (fee = 0.1 AIUS)
    await taskProcessor.submitAndQueueTask(modelConfig, { prompt: 'test' }, 123);

    // Verify balance deducted
    const balance = userService.getBalance(123);
    expect(balance).toBe(parseEther('9.9'));
  });
});
```

---

## Production Readiness

### 1. Comprehensive Logging

Use structured logging for all financial operations:

```typescript
// Logger utility with structured output
class Logger {
  event(eventType: string, data: Record<string, any>) {
    const entry = {
      timestamp: Date.now(),
      event: eventType,
      ...data
    };
    console.log(JSON.stringify(entry)); // Parse with log aggregator

    // Also write to audit trail
    db.prepare(`
      INSERT INTO audit_log (event_type, telegram_id, data, timestamp, tx_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(eventType, data.telegram_id || null, JSON.stringify(data), Date.now(), data.tx_hash || null, data.block_number || null);
  }
}

// Critical events to log:

// User events
logger.event('user_link_wallet', {
  telegram_id: user.telegram_id,
  username: user.username,
  wallet_address: wallet,
  previous_wallet: oldWallet || null
});

// Deposit events
logger.event('deposit_detected', {
  from_address: from,
  amount_aius: amount.toString(),
  tx_hash: txHash,
  block_number: blockNumber,
  user_found: !!user
});

logger.event('deposit_credited', {
  telegram_id: user.telegram_id,
  amount_aius: amount.toString(),
  balance_before: balanceBefore.toString(),
  balance_after: balanceAfter.toString(),
  tx_hash: txHash
});

logger.event('unsolicited_deposit', {
  from_address: from,
  amount_aius: amount.toString(),
  tx_hash: txHash,
  action_required: 'admin_review'
});

// Task charge events
logger.event('task_charge_success', {
  telegram_id: user.telegram_id,
  taskid: taskid,
  model_fee_aius: modelFee.toString(),
  gas_cost_aius: gasCost.toString(),
  total_cost_aius: totalCost.toString(),
  balance_before: balanceBefore.toString(),
  balance_after: balanceAfter.toString(),
  tx_hash: receipt.hash,
  gas_used: Number(receipt.gasUsed),
  gas_price_wei: receipt.gasPrice?.toString(),
  aius_eth_rate: rate.toString()
});

logger.event('task_charge_insufficient', {
  telegram_id: user.telegram_id,
  model_fee_aius: modelFee.toString(),
  estimated_gas_aius: estimatedGas.toString(),
  total_needed: (modelFee + estimatedGas).toString(),
  user_balance: balance.toString(),
  shortfall: (modelFee + estimatedGas - balance).toString()
});

// Refund events
logger.event('refund_issued', {
  telegram_id: user.telegram_id,
  taskid: taskid,
  amount_aius: refundAmount.toString(),
  reason: 'task_failed',
  balance_after: balanceAfter.toString()
});

// Gas swap events
logger.event('gas_swap_triggered', {
  eth_balance_before: ethBalance.toString(),
  eth_needed: ethNeeded.toString(),
  aius_to_swap: aiusToSwap.toString(),
  aius_eth_rate: rate.toString()
});

logger.event('gas_swap_success', {
  aius_swapped: aiusSwapped.toString(),
  eth_received: ethReceived.toString(),
  eth_balance_after: ethBalanceAfter.toString(),
  tx_hash: receipt.hash
});

logger.event('gas_swap_failed', {
  error: error.message,
  aius_attempted: aiusToSwap.toString(),
  eth_balance: ethBalance.toString(),
  action_required: 'admin_fund_eth'
});

// Price oracle events
logger.event('price_oracle_query', {
  aius_per_eth: rate.toString(),
  pair_address: PAIR_ADDRESS,
  aius_reserve: aiusReserve.toString(),
  weth_reserve: wethReserve.toString()
});

logger.event('price_oracle_failed', {
  error: error.message,
  using_cached: !!cachedRate,
  cached_age_seconds: cacheAge
});

// Admin events
logger.event('admin_action', {
  admin_telegram_id: ctx.from.id,
  action: 'manual_credit',
  target_telegram_id: targetUser,
  amount_aius: amount.toString(),
  note: note
});

// Database events
logger.event('database_error', {
  operation: 'debit_balance',
  error: error.message,
  telegram_id: user.telegram_id,
  retry_count: retryCount
});

logger.event('reconciliation_check', {
  total_user_balances: totalBalances.toString(),
  actual_wallet_balance: actualBalance.toString(),
  pending_gas_reserve: gasReserve.toString(),
  aius_min_reserve: AIUS_MIN_RESERVE.toString(),
  discrepancy: diff.toString(),
  discrepancy_percent: diffPercent.toString(),
  status: abs(diffPercent) > 1n ? 'ALERT' : 'OK'
});
```

### 2. Audit Trail Table

Immutable append-only log of all financial events:

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  telegram_id INTEGER,
  data TEXT NOT NULL, -- JSON blob with all event details
  timestamp INTEGER NOT NULL,
  tx_hash TEXT,
  block_number INTEGER
);

CREATE INDEX idx_audit_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_telegram_id ON audit_log(telegram_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_tx_hash ON audit_log(tx_hash);
```

### 3. Daily Reconciliation

Verify accounting integrity every 24 hours:

```typescript
class Reconciliation {
  async dailyCheck() {
    // 1. Sum all user balances
    const result = db.prepare('SELECT SUM(CAST(balance_aius AS REAL)) as total FROM users').get();
    const totalUserBalances = BigInt(result.total || '0');

    // 2. Get actual AIUS in wallet
    const actualBalance = await aiusToken.balanceOf(wallet.address);

    // 3. Calculate expected (user balances + minimum reserve)
    const expected = totalUserBalances + AIUS_MIN_RESERVE;

    // 4. Check discrepancy
    const diff = actualBalance - expected;
    const diffPercent = expected > 0n ? (diff * 100n) / expected : 0n;

    logger.event('reconciliation_check', {
      total_user_balances: totalUserBalances.toString(),
      actual_wallet_balance: actualBalance.toString(),
      aius_min_reserve: AIUS_MIN_RESERVE.toString(),
      expected: expected.toString(),
      discrepancy: diff.toString(),
      discrepancy_percent: diffPercent.toString(),
      status: abs(diffPercent) > 5n ? 'CRITICAL' : abs(diffPercent) > 1n ? 'WARNING' : 'OK'
    });

    // 5. Alert if discrepancy > 1%
    if (abs(diffPercent) > 1n) {
      await alertAdmin(
        `⚠️ Balance Reconciliation Alert!\n\n` +
        `Total user balances: ${ethers.formatEther(totalUserBalances)} AIUS\n` +
        `Actual wallet balance: ${ethers.formatEther(actualBalance)} AIUS\n` +
        `Expected: ${ethers.formatEther(expected)} AIUS\n` +
        `Discrepancy: ${ethers.formatEther(diff)} AIUS (${diffPercent}%)\n\n` +
        `${abs(diffPercent) > 5n ? '🚨 CRITICAL - Manual review required!' : 'Review recommended'}`
      );
    }
  }
}

// Run daily at 3 AM
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 3 && now.getMinutes() === 0) {
    await reconciliation.dailyCheck();
  }
}, 60000); // Check every minute
```

### 4. Database Resilience

Enable WAL mode and automatic backups:

```typescript
class DatabaseManager {
  constructor(dbPath: string) {
    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    // Integrity check on startup
    const integrityCheck = this.db.pragma('integrity_check');
    if (integrityCheck[0].integrity_check !== 'ok') {
      throw new Error('Database integrity check failed!');
    }

    // Schedule hourly backups
    setInterval(() => this.backup(), 60 * 60 * 1000);
  }

  async backup() {
    const timestamp = Date.now();
    const backupPath = `./backups/users_${timestamp}.db`;

    // Ensure backup directory exists
    await fs.mkdir('./backups', { recursive: true });

    // SQLite backup
    await this.db.backup(backupPath);

    logger.event('database_backup', {
      backup_path: backupPath,
      size_bytes: (await fs.stat(backupPath)).size
    });

    // Clean old backups (keep last 24)
    const backups = await fs.readdir('./backups');
    if (backups.length > 24) {
      const sorted = backups.sort();
      const toDelete = sorted.slice(0, backups.length - 24);
      for (const file of toDelete) {
        await fs.unlink(`./backups/${file}`);
      }
    }
  }

  // Wrap all writes in transactions with retry
  async executeWithRetry<T>(fn: () => T, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return this.db.transaction(fn)();
      } catch (error: any) {
        logger.event('database_error', {
          attempt: i + 1,
          max_retries: maxRetries,
          error: error.message
        });

        if (i === maxRetries - 1) throw error;
        await sleep(Math.pow(2, i) * 100); // Exponential backoff
      }
    }
    throw new Error('Database operation failed after retries');
  }
}
```

### 5. Monitoring & Metrics

Track key system metrics:

```typescript
class Metrics {
  private metrics: Map<string, number> = new Map();

  increment(key: string, value: number = 1) {
    this.metrics.set(key, (this.metrics.get(key) || 0) + value);
  }

  async getStats() {
    const stats = {
      // User metrics
      total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      users_with_balance: db.prepare('SELECT COUNT(*) as count FROM users WHERE CAST(balance_aius AS REAL) > 0').get().count,

      // Balance metrics
      total_deposits: db.prepare(`SELECT SUM(CAST(amount_aius AS REAL)) as total FROM transactions WHERE type = 'deposit'`).get().total || '0',
      total_spent: db.prepare(`SELECT SUM(CAST(total_cost_aius AS REAL)) as total FROM transactions WHERE type = 'model_fee'`).get().total || '0',
      total_refunds: db.prepare(`SELECT SUM(CAST(amount_aius AS REAL)) as total FROM transactions WHERE type = 'refund'`).get().total || '0',

      // Task metrics
      tasks_24h: db.prepare(`SELECT COUNT(*) as count FROM transactions WHERE type = 'model_fee' AND timestamp > ?`).get(Date.now() - 24*60*60*1000).count,
      avg_task_cost: db.prepare(`SELECT AVG(CAST(total_cost_aius AS REAL)) as avg FROM transactions WHERE type = 'model_fee'`).get().avg || '0',

      // Gas metrics
      avg_gas_cost: db.prepare(`SELECT AVG(CAST(gas_cost_aius AS REAL)) as avg FROM transactions WHERE type = 'model_fee' AND gas_cost_aius IS NOT NULL`).get().avg || '0',
      gas_swaps_24h: db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE event_type = 'gas_swap_success' AND timestamp > ?`).get(Date.now() - 24*60*60*1000).count,

      // Error metrics
      insufficient_balance_24h: db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE event_type = 'task_charge_insufficient' AND timestamp > ?`).get(Date.now() - 24*60*60*1000).count,
      unsolicited_deposits: db.prepare(`SELECT COUNT(*) as count FROM audit_log WHERE event_type = 'unsolicited_deposit'`).get().count,

      // System health
      wallet_eth_balance: (await provider.getBalance(wallet.address)).toString(),
      wallet_aius_balance: (await aiusToken.balanceOf(wallet.address)).toString(),
      current_aius_eth_rate: (await getAiusPerEth(provider)).toString(),
      db_size_mb: (await fs.stat('./users.db')).size / (1024 * 1024)
    };

    return stats;
  }
}
```

### 6. Monitoring & Observability

### Metrics to Track

**User Metrics:**
- Total users registered
- Total users with linked wallets
- Total users with balance > 0
- Average balance per user
- Total AIUS deposited (all time)
- Total AIUS spent on tasks (all time)

**Transaction Metrics:**
- Deposits per hour/day
- Tasks submitted per hour/day
- Average task cost (model + gas)
- Average gas cost per task
- Failed transactions (insufficient balance)
- Refund rate (%)

**System Health:**
- ETH balance in wallet
- AIUS balance in wallet
- Current AIUS/ETH exchange rate
- Gas swap frequency
- Database size
- Reconciliation status
- Price oracle response time

### 7. Admin Tools

Essential admin commands for managing the payment system:

```typescript
// Admin access control
const ADMIN_TELEGRAM_IDS = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id)) || [];

function isAdmin(telegramId: number): boolean {
  return ADMIN_TELEGRAM_IDS.includes(telegramId);
}

// Admin middleware
bot.use(async (ctx, next) => {
  if (ctx.message?.text?.startsWith('/admin')) {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply('❌ Admin access required');
    }
  }
  return next();
});

// /admin stats - System dashboard
bot.command('admin_stats', async (ctx) => {
  const stats = await metrics.getStats();
  const ethBalance = BigInt(stats.wallet_eth_balance);
  const aiusBalance = BigInt(stats.wallet_aius_balance);
  const aiusRate = BigInt(stats.current_aius_eth_rate);

  ctx.reply(
    `📊 Kasumi-3 System Stats\n\n` +
    `👥 Users\n` +
    `   Total: ${stats.total_users}\n` +
    `   With balance: ${stats.users_with_balance}\n\n` +
    `💰 Balances\n` +
    `   Total deposits: ${ethers.formatEther(stats.total_deposits)} AIUS\n` +
    `   Total spent: ${ethers.formatEther(stats.total_spent)} AIUS\n` +
    `   Total refunds: ${ethers.formatEther(stats.total_refunds)} AIUS\n\n` +
    `📈 Activity (24h)\n` +
    `   Tasks: ${stats.tasks_24h}\n` +
    `   Avg cost: ${ethers.formatEther(stats.avg_task_cost)} AIUS\n` +
    `   Avg gas: ${ethers.formatEther(stats.avg_gas_cost)} AIUS\n` +
    `   Gas swaps: ${stats.gas_swaps_24h}\n` +
    `   Insufficient balance: ${stats.insufficient_balance_24h}\n\n` +
    `🏦 Wallet\n` +
    `   ETH: ${ethers.formatEther(ethBalance)}\n` +
    `   AIUS: ${ethers.formatEther(aiusBalance)}\n` +
    `   Rate: ${ethers.formatUnits(aiusRate, 18)} AIUS/ETH\n\n` +
    `⚙️ System\n` +
    `   DB size: ${stats.db_size_mb.toFixed(2)} MB\n` +
    `   Unsolicited deposits: ${stats.unsolicited_deposits}`
  );
});

// /admin credit <@user|telegram_id> <amount> [note]
bot.command('admin_credit', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    return ctx.reply('Usage: /admin_credit <@user|telegram_id> <amount> [note]');
  }

  const targetUser = args[0].startsWith('@') ? args[0].substring(1) : parseInt(args[0]);
  const amount = ethers.parseEther(args[1]);
  const note = args.slice(2).join(' ') || 'admin_credit';

  // Find user
  let user;
  if (typeof targetUser === 'string') {
    user = db.prepare('SELECT * FROM users WHERE telegram_username = ?').get(targetUser);
  } else {
    user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(targetUser);
  }

  if (!user) {
    return ctx.reply(`❌ User not found: ${targetUser}`);
  }

  // Credit balance
  const balanceBefore = BigInt(user.balance_aius);
  const balanceAfter = balanceBefore + amount;

  db.prepare('UPDATE users SET balance_aius = ? WHERE telegram_id = ?')
    .run(balanceAfter.toString(), user.telegram_id);

  db.prepare(`
    INSERT INTO transactions (telegram_id, type, amount_aius, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(user.telegram_id, 'admin_credit', amount.toString(), Date.now());

  logger.event('admin_action', {
    admin_telegram_id: ctx.from.id,
    action: 'credit',
    target_telegram_id: user.telegram_id,
    amount_aius: amount.toString(),
    balance_before: balanceBefore.toString(),
    balance_after: balanceAfter.toString(),
    note: note
  });

  ctx.reply(
    `✅ Credited ${ethers.formatEther(amount)} AIUS to @${user.telegram_username || user.telegram_id}\n` +
    `Balance: ${ethers.formatEther(balanceBefore)} → ${ethers.formatEther(balanceAfter)} AIUS\n` +
    `Note: ${note}`
  );

  // Notify user
  bot.telegram.sendMessage(
    user.telegram_id,
    `💰 Admin credited your account!\n\n` +
    `Amount: ${ethers.formatEther(amount)} AIUS\n` +
    `Note: ${note}\n` +
    `New balance: ${ethers.formatEther(balanceAfter)} AIUS`
  );
});

// /admin debit <@user|telegram_id> <amount> <reason>
bot.command('admin_debit', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 3) {
    return ctx.reply('Usage: /admin_debit <@user|telegram_id> <amount> <reason>');
  }

  const targetUser = args[0].startsWith('@') ? args[0].substring(1) : parseInt(args[0]);
  const amount = ethers.parseEther(args[1]);
  const reason = args.slice(2).join(' ');

  // Find user
  let user;
  if (typeof targetUser === 'string') {
    user = db.prepare('SELECT * FROM users WHERE telegram_username = ?').get(targetUser);
  } else {
    user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(targetUser);
  }

  if (!user) {
    return ctx.reply(`❌ User not found: ${targetUser}`);
  }

  const balanceBefore = BigInt(user.balance_aius);

  if (balanceBefore < amount) {
    return ctx.reply(
      `❌ Insufficient balance\n` +
      `User balance: ${ethers.formatEther(balanceBefore)} AIUS\n` +
      `Debit amount: ${ethers.formatEther(amount)} AIUS`
    );
  }

  const balanceAfter = balanceBefore - amount;

  db.prepare('UPDATE users SET balance_aius = ? WHERE telegram_id = ?')
    .run(balanceAfter.toString(), user.telegram_id);

  db.prepare(`
    INSERT INTO transactions (telegram_id, type, amount_aius, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(user.telegram_id, 'admin_debit', amount.toString(), Date.now());

  logger.event('admin_action', {
    admin_telegram_id: ctx.from.id,
    action: 'debit',
    target_telegram_id: user.telegram_id,
    amount_aius: amount.toString(),
    balance_before: balanceBefore.toString(),
    balance_after: balanceAfter.toString(),
    reason: reason
  });

  ctx.reply(
    `✅ Debited ${ethers.formatEther(amount)} AIUS from @${user.telegram_username || user.telegram_id}\n` +
    `Balance: ${ethers.formatEther(balanceBefore)} → ${ethers.formatEther(balanceAfter)} AIUS\n` +
    `Reason: ${reason}`
  );

  // Notify user
  bot.telegram.sendMessage(
    user.telegram_id,
    `⚠️ Admin debited your account\n\n` +
    `Amount: ${ethers.formatEther(amount)} AIUS\n` +
    `Reason: ${reason}\n` +
    `New balance: ${ethers.formatEther(balanceAfter)} AIUS`
  );
});

// /admin refund <taskid>
bot.command('admin_refund', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 1) {
    return ctx.reply('Usage: /admin_refund <taskid>');
  }

  const taskid = args[0];

  // Find transaction
  const transaction = db.prepare(`
    SELECT * FROM transactions
    WHERE taskid = ? AND type = 'model_fee'
  `).get(taskid);

  if (!transaction) {
    return ctx.reply(`❌ Transaction not found for task: ${taskid}`);
  }

  // Check if already refunded
  const existingRefund = db.prepare(`
    SELECT * FROM transactions
    WHERE taskid = ? AND type = 'refund'
  `).get(taskid);

  if (existingRefund) {
    return ctx.reply(`❌ Task ${taskid} already refunded`);
  }

  // Issue refund
  const refundAmount = BigInt(transaction.total_cost_aius);
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(transaction.telegram_id);
  const balanceBefore = BigInt(user.balance_aius);
  const balanceAfter = balanceBefore + refundAmount;

  db.prepare('UPDATE users SET balance_aius = ? WHERE telegram_id = ?')
    .run(balanceAfter.toString(), transaction.telegram_id);

  db.prepare(`
    INSERT INTO transactions (telegram_id, type, amount_aius, taskid, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(transaction.telegram_id, 'refund', refundAmount.toString(), taskid, Date.now());

  logger.event('admin_action', {
    admin_telegram_id: ctx.from.id,
    action: 'refund',
    target_telegram_id: transaction.telegram_id,
    taskid: taskid,
    amount_aius: refundAmount.toString(),
    balance_after: balanceAfter.toString()
  });

  ctx.reply(
    `✅ Refunded task ${taskid}\n` +
    `User: @${user.telegram_username || user.telegram_id}\n` +
    `Amount: ${ethers.formatEther(refundAmount)} AIUS\n` +
    `New balance: ${ethers.formatEther(balanceAfter)} AIUS`
  );

  // Notify user
  bot.telegram.sendMessage(
    transaction.telegram_id,
    `💰 Refund issued by admin\n\n` +
    `Task: ${taskid}\n` +
    `Amount: ${ethers.formatEther(refundAmount)} AIUS\n` +
    `New balance: ${ethers.formatEther(balanceAfter)} AIUS`
  );
});

// /admin swap <amount_aius>
bot.command('admin_swap', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 1) {
    return ctx.reply('Usage: /admin_swap <amount_aius>');
  }

  const aiusAmount = ethers.parseEther(args[0]);

  try {
    ctx.reply(`🔄 Swapping ${ethers.formatEther(aiusAmount)} AIUS for ETH...`);

    const ethBefore = await provider.getBalance(wallet.address);
    const rate = await getAiusPerEth(provider);
    const expectedEth = (aiusAmount * BigInt(1e18)) / rate;

    const receipt = await swapAiusForEth(wallet, aiusAmount, expectedEth, 100); // 1% slippage

    const ethAfter = await provider.getBalance(wallet.address);
    const ethReceived = ethAfter - ethBefore;

    logger.event('admin_action', {
      admin_telegram_id: ctx.from.id,
      action: 'manual_swap',
      aius_swapped: aiusAmount.toString(),
      eth_received: ethReceived.toString(),
      tx_hash: receipt.hash
    });

    ctx.reply(
      `✅ Swap successful!\n\n` +
      `AIUS: ${ethers.formatEther(aiusAmount)}\n` +
      `ETH received: ${ethers.formatEther(ethReceived)}\n` +
      `Rate: ${ethers.formatUnits(rate, 18)} AIUS/ETH\n` +
      `Tx: ${receipt.hash}`
    );
  } catch (error: any) {
    ctx.reply(`❌ Swap failed: ${error.message}`);
  }
});

// /admin deposits [limit]
bot.command('admin_deposits', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const limit = parseInt(args[0]) || 10;

  const deposits = db.prepare(`
    SELECT * FROM transactions
    WHERE type = 'deposit'
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);

  if (deposits.length === 0) {
    return ctx.reply('No deposits found');
  }

  let message = `📥 Recent Deposits (${deposits.length})\n\n`;

  for (const deposit of deposits) {
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(deposit.telegram_id);
    const date = new Date(deposit.timestamp).toLocaleString();

    message += `${ethers.formatEther(deposit.amount_aius)} AIUS\n`;
    message += `  User: @${user?.telegram_username || deposit.telegram_id}\n`;
    message += `  From: ${deposit.from_address?.substring(0, 10)}...\n`;
    message += `  Date: ${date}\n`;
    message += `  Tx: ${deposit.tx_hash?.substring(0, 10)}...\n\n`;
  }

  ctx.reply(message);
});

// /admin users [type] [limit]
bot.command('admin_users', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const type = args[0] || 'top'; // 'top' or 'all'
  const limit = parseInt(args[1]) || 10;

  let users;
  if (type === 'top') {
    users = db.prepare(`
      SELECT * FROM users
      ORDER BY CAST(balance_aius AS REAL) DESC
      LIMIT ?
    `).all(limit);
  } else {
    users = db.prepare(`
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
  }

  if (users.length === 0) {
    return ctx.reply('No users found');
  }

  let message = `👥 ${type === 'top' ? 'Top' : 'Recent'} Users (${users.length})\n\n`;

  for (const user of users) {
    message += `@${user.telegram_username || user.telegram_id}\n`;
    message += `  Balance: ${ethers.formatEther(user.balance_aius)} AIUS\n`;
    message += `  Wallet: ${user.wallet_address.substring(0, 10)}...\n`;
    message += `  Linked: ${new Date(user.linked_at).toLocaleDateString()}\n\n`;
  }

  ctx.reply(message);
});

// /admin reconcile
bot.command('admin_reconcile', async (ctx) => {
  ctx.reply('🔄 Running reconciliation check...');

  const result = db.prepare('SELECT SUM(CAST(balance_aius AS REAL)) as total FROM users').get();
  const totalUserBalances = BigInt(result.total || '0');
  const actualBalance = await aiusToken.balanceOf(wallet.address);
  const expected = totalUserBalances + AIUS_MIN_RESERVE;
  const diff = actualBalance - expected;
  const diffPercent = expected > 0n ? (diff * 100n) / expected : 0n;

  const status = abs(diffPercent) > 5n ? '🚨 CRITICAL' : abs(diffPercent) > 1n ? '⚠️ WARNING' : '✅ OK';

  ctx.reply(
    `${status} Reconciliation Check\n\n` +
    `User balances: ${ethers.formatEther(totalUserBalances)} AIUS\n` +
    `Min reserve: ${ethers.formatEther(AIUS_MIN_RESERVE)} AIUS\n` +
    `Expected: ${ethers.formatEther(expected)} AIUS\n\n` +
    `Actual wallet: ${ethers.formatEther(actualBalance)} AIUS\n\n` +
    `Discrepancy: ${ethers.formatEther(diff)} AIUS (${diffPercent}%)\n\n` +
    `${abs(diffPercent) > 5n ? '⚠️ Manual review required!' : abs(diffPercent) > 1n ? 'Minor discrepancy detected' : 'All balances match'}`
  );
});

// /admin backup
bot.command('admin_backup', async (ctx) => {
  ctx.reply('💾 Creating backup...');

  try {
    await dbManager.backup();
    ctx.reply('✅ Backup created successfully');
  } catch (error: any) {
    ctx.reply(`❌ Backup failed: ${error.message}`);
  }
});

// /admin alerts [limit]
bot.command('admin_alerts', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const limit = parseInt(args[0]) || 10;

  const alerts = db.prepare(`
    SELECT * FROM audit_log
    WHERE event_type IN ('unsolicited_deposit', 'gas_swap_failed', 'reconciliation_check', 'database_error')
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);

  if (alerts.length === 0) {
    return ctx.reply('✅ No recent alerts');
  }

  let message = `🚨 Recent Alerts (${alerts.length})\n\n`;

  for (const alert of alerts) {
    const data = JSON.parse(alert.data);
    const date = new Date(alert.timestamp).toLocaleString();

    message += `${alert.event_type}\n`;
    message += `  Date: ${date}\n`;

    if (alert.event_type === 'unsolicited_deposit') {
      message += `  From: ${data.from_address?.substring(0, 10)}...\n`;
      message += `  Amount: ${ethers.formatEther(data.amount_aius)} AIUS\n`;
    } else if (alert.event_type === 'gas_swap_failed') {
      message += `  Error: ${data.error}\n`;
      message += `  Action: ${data.action_required}\n`;
    } else if (alert.event_type === 'reconciliation_check' && data.status !== 'OK') {
      message += `  Status: ${data.status}\n`;
      message += `  Discrepancy: ${data.discrepancy_percent}%\n`;
    }

    message += '\n';
  }

  ctx.reply(message);
});
```

---

## Migration & Rollout Plan

### Pre-launch Checklist

- [ ] Database schema created and tested
- [ ] All services implemented with tests
- [ ] Commands added to bot
- [ ] Error handling comprehensive
- [ ] Security review completed
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] Documentation updated

### Rollout Strategy

**Phase 1: Internal Testing (Week 5)**
- Deploy to test environment
- Test with team wallets
- Verify all flows work
- Stress test with multiple users
- Fix any bugs found

**Phase 2: Beta Testing (Week 6)**
- Invite 10-20 trusted users
- Monitor closely for issues
- Gather feedback on UX
- Fix bugs and improve messaging
- Verify no balance issues

**Phase 3: Soft Launch (Week 7)**
- Enable for all users
- Start with low limits (max 10 AIUS per user)
- Monitor for fraud/abuse
- Gradually increase limits
- Add features based on feedback

**Phase 4: Full Launch (Week 8+)**
- Remove limits
- Announce publicly
- Add advanced features (withdrawals, etc.)
- Continue monitoring and improving

### Database Migration

```sql
-- Migration: Create payment system tables with gas accounting
-- File: migrations/002_payment_system.sql

BEGIN TRANSACTION;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  telegram_username TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  balance_aius TEXT NOT NULL DEFAULT '0',
  linked_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Create transactions table with gas accounting
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'model_fee', 'gas_cost', 'refund', 'admin_credit'
  amount_aius TEXT NOT NULL,
  gas_cost_aius TEXT, -- Gas cost in AIUS (for model_fee transactions)
  total_cost_aius TEXT, -- amount + gas (for model_fee transactions)
  tx_hash TEXT UNIQUE,
  taskid TEXT,
  from_address TEXT, -- For deposits
  gas_used INTEGER, -- Actual gas units consumed
  gas_price_wei TEXT, -- Gas price at time of tx
  aius_eth_rate TEXT, -- AIUS per ETH exchange rate used
  block_number INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_transactions_telegram_id ON transactions(telegram_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_taskid ON transactions(taskid);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

COMMIT;
```

---

## Future Enhancements

### Short Term (1-2 months)
1. **Withdrawal System** - Allow users to withdraw AIUS
2. **Referral Program** - Credit AIUS for referrals
3. **Bulk Discounts** - Cheaper rates for high-volume users
4. **Balance Alerts** - Notify when balance is low
5. **Auto-topup** - Automatic deposits when balance < threshold

### Medium Term (3-6 months)
6. **Subscription Plans** - Monthly unlimited or discounted rates
7. **Credit System** - Buy credits in bulk at discount
8. **Gift Balances** - Send AIUS to other users
9. **Task History Export** - CSV/JSON export of all tasks
10. **Analytics Dashboard** - Usage statistics for users

### Long Term (6+ months)
11. **Multi-token Support** - Accept ETH, USDC, etc.
12. **Fiat On-ramp** - Buy AIUS with credit card
13. **NFT Rewards** - Special NFTs for heavy users
14. **Staking Rewards** - Earn yield on deposited AIUS
15. **DAO Integration** - Governance voting with staked balance

---

## FAQ & Troubleshooting

### For Users

**Q: Do I need to link my wallet before depositing?**
A: No! You can deposit first, then link your wallet to claim the deposit.

**Q: What happens if I send from an exchange?**
A: Exchange deposits won't be credited automatically (different from-address). Link a personal wallet instead.

**Q: Can I change my linked wallet?**
A: Yes, use `/link <new_address>` to update it.

**Q: How do I check my balance?**
A: Use `/balance` command.

**Q: What if I send to the wrong address?**
A: AIUS transactions are irreversible. Double-check the address before sending.

**Q: Are there any fees for depositing?**
A: Only Ethereum gas fees. Kasumi-3 doesn't charge deposit fees.

**Q: How long does it take for deposits to be credited?**
A: Usually within 1-2 blocks (~12-24 seconds on Arbitrum).

**Q: Can I get a refund if a task fails?**
A: Yes, failed tasks are automatically refunded.

### For Developers

**Q: How do I test deposits locally?**
A: Use a local testnet and simulate Transfer events:
```typescript
await token.connect(user).transfer(kasumi3Address, amount);
```

**Q: How do I backup the database?**
A: SQLite databases are single files. Use:
```bash
cp users.db users.db.backup
```

**Q: How do I migrate to a new database?**
A: Export data with `.dump` and import to new database:
```bash
sqlite3 old.db .dump | sqlite3 new.db
```

**Q: How do I handle database corruption?**
A: SQLite has built-in recovery:
```bash
sqlite3 users.db "PRAGMA integrity_check;"
sqlite3 users.db ".recover" | sqlite3 recovered.db
```

**Q: How do I monitor deposit lag?**
A: Track time between block timestamp and credit timestamp:
```sql
SELECT
  AVG(created_at - (SELECT timestamp FROM blocks WHERE number = block_number))
FROM transactions
WHERE type = 'deposit';
```

---

## Production Readiness Checklist

### Critical (Must Have)
- [x] Simplified deposit flow (users link first)
- [x] Gas cost accounting (Uniswap V2 price oracle)
- [x] Auto gas swapping (AIUS → ETH)
- [x] Structured logging (all financial events)
- [x] Audit trail (append-only log)
- [x] Daily reconciliation
- [x] Database WAL + hourly backups
- [x] Admin tools (10+ commands)
- [x] Refund system (model + gas)
- [x] Metrics & monitoring

### Optional Enhancements
- [ ] Rate limiting per user (10 tasks/min, 100/hour)
- [ ] Withdrawal system for users
- [ ] Price oracle fallbacks (SushiSwap, manual)
- [ ] Circuit breakers (auto-pause on anomalies)
- [ ] Multi-sig for large operations
- [ ] User balance notifications

### Notes on Design Decisions

**No Price Oracle Fallbacks:**
- Single Uniswap V2 pair is sufficient
- Admin can manually swap if oracle fails
- Simpler implementation, fewer failure modes

**No Circuit Breakers:**
- Would add complexity for rare edge cases
- Admin monitoring + manual intervention preferred
- Focus on comprehensive logging to catch issues early

**No Unclaimed Deposits:**
- Users naturally link wallet first to get deposit address
- Edge cases (unsolicited deposits) handled manually by admin
- Cleaner accounting: `total_AIUS = SUM(user_balances) + reserve`

---

## Conclusion

This payment system provides a **production-ready, self-sustaining** way for users to pay for AI inference tasks with full gas cost transparency.

**Key Features:**
- ✅ Simple user flow (link wallet → deposit → use)
- ✅ Automatic gas accounting (users pay exact gas in AIUS)
- ✅ Auto gas swapping (bot maintains ETH balance)
- ✅ Comprehensive logging (every event tracked)
- ✅ Daily reconciliation (catch bugs early)
- ✅ Full admin toolkit (10+ commands)
- ✅ Database resilience (WAL mode + backups)
- ✅ Audit trail (immutable financial log)

**What Makes It Production Ready:**
1. **Structured logging** - Every financial event logged with full context
2. **Daily reconciliation** - Automatic balance verification with admin alerts
3. **Database backups** - Hourly backups, WAL mode, integrity checks
4. **Admin tools** - Credit/debit/refund/stats/reconcile/alerts
5. **Gas accounting** - Users see exact cost breakdown (model + gas)
6. **Auto-sustainability** - Bot swaps AIUS for ETH as needed

**Next Steps:**
1. Review this document
2. Implement Phase 1 (UserService + database)
3. Implement Phase 2 (DepositMonitor)
4. Implement Phase 3 (Bot commands)
5. Implement Phase 4 (TaskProcessor integration)
6. Add production features (logging, reconciliation, admin tools)
7. Test thoroughly
8. Deploy to production

---

**Document Version:** 2.0 (Production Ready)
**Last Updated:** 2025-10-03
**Author:** Claude + Kasumi-3 Team
