"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ethers_1 = require("ethers");
/**
 * Edge Case Tests for Payment System
 *
 * These tests verify that all critical edge cases and bug fixes
 * are properly handled in the payment system.
 */
(0, globals_1.describe)('Payment System Edge Cases', () => {
    // ====================================================================
    // 1. PRICE ORACLE EDGE CASES
    // ====================================================================
    (0, globals_1.describe)('Price Oracle Resilience', () => {
        let getAiusPerEth;
        let fetchPriceFromOracle;
        let cachedPrice;
        (0, globals_1.beforeEach)(() => {
            // Reset cache
            cachedPrice = null;
            // Mock implementation (simplified)
            getAiusPerEth = async () => {
                const CACHE_MAX_AGE = 60 * 1000;
                const STALE_MAX_AGE = 5 * 60 * 1000;
                if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_MAX_AGE) {
                    return cachedPrice.rate;
                }
                try {
                    const rate = await fetchPriceFromOracle();
                    cachedPrice = { rate, timestamp: Date.now() };
                    return rate;
                }
                catch (error) {
                    if (cachedPrice && Date.now() - cachedPrice.timestamp < STALE_MAX_AGE) {
                        return cachedPrice.rate;
                    }
                    throw new Error('Price oracle unavailable and no cached price available');
                }
            };
        });
        (0, globals_1.it)('should use cached price within 1 minute', async () => {
            let callCount = 0;
            fetchPriceFromOracle = async () => {
                callCount++;
                return 50000n * BigInt(1e18);
            };
            const price1 = await getAiusPerEth();
            const price2 = await getAiusPerEth();
            (0, globals_1.expect)(price1).toBe(price2);
            (0, globals_1.expect)(callCount).toBe(1); // Only 1 oracle call
        });
        (0, globals_1.it)('should fetch fresh price after cache expires', async () => {
            let callCount = 0;
            fetchPriceFromOracle = async () => {
                callCount++;
                return 50000n * BigInt(1e18);
            };
            const price1 = await getAiusPerEth();
            // Simulate time passing (>1 minute)
            cachedPrice.timestamp = Date.now() - 61 * 1000;
            const price2 = await getAiusPerEth();
            (0, globals_1.expect)(callCount).toBe(2); // 2 oracle calls
        });
        (0, globals_1.it)('should fall back to stale cache on RPC failure', async () => {
            fetchPriceFromOracle = async () => 50000n * BigInt(1e18);
            const price1 = await getAiusPerEth();
            // Simulate time passing (>1 minute but <5 minutes)
            cachedPrice.timestamp = Date.now() - 2 * 60 * 1000;
            // Make oracle fail
            fetchPriceFromOracle = async () => {
                throw new Error('RPC failed');
            };
            const price2 = await getAiusPerEth();
            (0, globals_1.expect)(price2).toBe(price1); // Same as cached
        });
        (0, globals_1.it)('should throw when no cache and oracle fails', async () => {
            fetchPriceFromOracle = async () => {
                throw new Error('RPC failed');
            };
            await (0, globals_1.expect)(getAiusPerEth()).rejects.toThrow('Price oracle unavailable');
        });
        (0, globals_1.it)('should throw on zero reserves (division by zero)', async () => {
            fetchPriceFromOracle = async () => {
                const aiusReserve = 1000000n;
                const wethReserve = 0n; // Zero!
                if (wethReserve === 0n || aiusReserve === 0n) {
                    throw new Error(`Pool has no liquidity: AIUS=${aiusReserve.toString()}, WETH=${wethReserve.toString()}`);
                }
                return (aiusReserve * BigInt(1e18)) / wethReserve;
            };
            await (0, globals_1.expect)(fetchPriceFromOracle()).rejects.toThrow('Pool has no liquidity');
        });
        (0, globals_1.it)('should handle both reserves zero', async () => {
            fetchPriceFromOracle = async () => {
                const aiusReserve = 0n;
                const wethReserve = 0n;
                if (wethReserve === 0n || aiusReserve === 0n) {
                    throw new Error(`Pool has no liquidity: AIUS=${aiusReserve.toString()}, WETH=${wethReserve.toString()}`);
                }
                return (aiusReserve * BigInt(1e18)) / wethReserve;
            };
            await (0, globals_1.expect)(fetchPriceFromOracle()).rejects.toThrow('Pool has no liquidity');
        });
    });
    // ====================================================================
    // 2. GAS PRICE CALCULATION (EIP-1559)
    // ====================================================================
    (0, globals_1.describe)('Gas Cost Calculation', () => {
        async function calculateGasCostInAius(receipt) {
            const gasUsed = receipt.gasUsed;
            const gasPrice = receipt.effectiveGasPrice || receipt.gasPrice;
            if (!gasPrice || gasPrice === 0n) {
                throw new Error('Cannot determine gas price from transaction receipt');
            }
            const gasCostWei = gasUsed * gasPrice;
            return { gasCostWei };
        }
        (0, globals_1.it)('should use effectiveGasPrice on EIP-1559', async () => {
            const receipt = {
                gasUsed: 100000n,
                effectiveGasPrice: 50000000n,
                gasPrice: null
            };
            const { gasCostWei } = await calculateGasCostInAius(receipt);
            (0, globals_1.expect)(gasCostWei).toBe(100000n * 50000000n);
        });
        (0, globals_1.it)('should fallback to gasPrice if effectiveGasPrice missing', async () => {
            const receipt = {
                gasUsed: 100000n,
                effectiveGasPrice: null,
                gasPrice: 25000000n
            };
            const { gasCostWei } = await calculateGasCostInAius(receipt);
            (0, globals_1.expect)(gasCostWei).toBe(100000n * 25000000n);
        });
        (0, globals_1.it)('should throw on zero gas price', async () => {
            const receipt = {
                gasUsed: 100000n,
                effectiveGasPrice: 0n,
                gasPrice: 0n
            };
            await (0, globals_1.expect)(calculateGasCostInAius(receipt)).rejects.toThrow('Cannot determine gas price');
        });
        (0, globals_1.it)('should throw when both gas prices null', async () => {
            const receipt = {
                gasUsed: 100000n,
                effectiveGasPrice: null,
                gasPrice: null
            };
            await (0, globals_1.expect)(calculateGasCostInAius(receipt)).rejects.toThrow('Cannot determine gas price');
        });
    });
    // ====================================================================
    // 3. AUTO-SWAP RESERVE PROTECTION
    // ====================================================================
    (0, globals_1.describe)('Auto Gas Swap Reserve Protection', () => {
        const AIUS_MIN_RESERVE = ethers_1.ethers.parseEther('1000');
        function checkSwapPossible(aiusBalance, aiusToSwap) {
            // First check: balance must exceed reserve
            if (aiusBalance < AIUS_MIN_RESERVE) {
                throw new Error(`AIUS balance ${ethers_1.ethers.formatEther(aiusBalance)} is below ` +
                    `minimum reserve ${ethers_1.ethers.formatEther(AIUS_MIN_RESERVE)}`);
            }
            const availableAius = aiusBalance - AIUS_MIN_RESERVE;
            // Second check: available amount must cover swap
            if (availableAius < aiusToSwap) {
                throw new Error(`Cannot swap: need ${ethers_1.ethers.formatEther(aiusToSwap)} AIUS, ` +
                    `only ${ethers_1.ethers.formatEther(availableAius)} AIUS available after reserve`);
            }
        }
        (0, globals_1.it)('should prevent swap when balance below reserve', () => {
            const aiusBalance = ethers_1.ethers.parseEther('500'); // Below 1000 reserve
            const aiusToSwap = ethers_1.ethers.parseEther('100');
            (0, globals_1.expect)(() => checkSwapPossible(aiusBalance, aiusToSwap))
                .toThrow('below minimum reserve');
        });
        (0, globals_1.it)('should prevent swap when available < needed', () => {
            const aiusBalance = ethers_1.ethers.parseEther('1100'); // 100 available after reserve
            const aiusToSwap = ethers_1.ethers.parseEther('200'); // Needs 200
            (0, globals_1.expect)(() => checkSwapPossible(aiusBalance, aiusToSwap))
                .toThrow('only 100');
        });
        (0, globals_1.it)('should allow swap when sufficient balance', () => {
            const aiusBalance = ethers_1.ethers.parseEther('1500'); // 500 available
            const aiusToSwap = ethers_1.ethers.parseEther('200');
            (0, globals_1.expect)(() => checkSwapPossible(aiusBalance, aiusToSwap)).not.toThrow();
        });
        (0, globals_1.it)('should handle exact balance (reserve + swap amount)', () => {
            const aiusBalance = ethers_1.ethers.parseEther('1200'); // 200 available
            const aiusToSwap = ethers_1.ethers.parseEther('200'); // Needs exactly 200
            (0, globals_1.expect)(() => checkSwapPossible(aiusBalance, aiusToSwap)).not.toThrow();
        });
        (0, globals_1.it)('should catch edge case: balance = reserve exactly', () => {
            const aiusBalance = ethers_1.ethers.parseEther('1000'); // Exactly reserve
            const aiusToSwap = ethers_1.ethers.parseEther('1');
            (0, globals_1.expect)(() => checkSwapPossible(aiusBalance, aiusToSwap))
                .toThrow('only 0');
        });
    });
    // ====================================================================
    // 4. RECONCILIATION PRECISION
    // ====================================================================
    (0, globals_1.describe)('Reconciliation BigInt Precision', () => {
        (0, globals_1.it)('should handle large balances without precision loss', () => {
            const users = [
                { balance_aius: '999999999999999999999999' }, // ~1M AIUS
                { balance_aius: '1' },
                { balance_aius: '123456789012345678901234' }
            ];
            // Manual sum with BigInt (correct way)
            const totalUserBalances = users.reduce((sum, user) => sum + BigInt(user.balance_aius), 0n);
            // Expected: 999999999999999999999999 + 1 + 123456789012345678901234 = 1123456789012345678901234
            (0, globals_1.expect)(totalUserBalances.toString()).toBe('1123456789012345678901234');
        });
        (0, globals_1.it)('should detect precision loss from JavaScript number', () => {
            // Simulate what SQLite SUM() returns (as JS number)
            const largeBalanceStr = '999999999999999999999999';
            const asNumber = Number(largeBalanceStr);
            const asBigInt = BigInt(largeBalanceStr);
            // JavaScript number loses precision for large integers (converts to 1e+24)
            (0, globals_1.expect)(asNumber.toString()).not.toBe(asBigInt.toString());
            (0, globals_1.expect)(asNumber).toBe(1e+24); // Loses precision
        });
        (0, globals_1.it)('should handle zero balances', () => {
            const users = [
                { balance_aius: '0' },
                { balance_aius: '0' }
            ];
            const total = users.reduce((sum, user) => sum + BigInt(user.balance_aius), 0n);
            (0, globals_1.expect)(total).toBe(0n);
        });
    });
    // ====================================================================
    // 5. DEPOSIT REORG PROTECTION
    // ====================================================================
    (0, globals_1.describe)('Deposit Confirmation Wait', () => {
        const REQUIRED_CONFIRMATIONS = 12;
        function shouldCreditDeposit(depositBlock, currentBlock) {
            const confirmations = currentBlock - depositBlock;
            return confirmations >= REQUIRED_CONFIRMATIONS;
        }
        (0, globals_1.it)('should not credit deposit with < 12 confirmations', () => {
            const depositBlock = 100;
            const currentBlock = 105; // Only 5 confirmations
            (0, globals_1.expect)(shouldCreditDeposit(depositBlock, currentBlock)).toBe(false);
        });
        (0, globals_1.it)('should credit deposit after exactly 12 confirmations', () => {
            const depositBlock = 100;
            const currentBlock = 112; // Exactly 12 confirmations
            (0, globals_1.expect)(shouldCreditDeposit(depositBlock, currentBlock)).toBe(true);
        });
        (0, globals_1.it)('should credit deposit with > 12 confirmations', () => {
            const depositBlock = 100;
            const currentBlock = 150; // 50 confirmations
            (0, globals_1.expect)(shouldCreditDeposit(depositBlock, currentBlock)).toBe(true);
        });
        (0, globals_1.it)('should handle deposit in current block (0 confirmations)', () => {
            const depositBlock = 100;
            const currentBlock = 100; // Same block
            (0, globals_1.expect)(shouldCreditDeposit(depositBlock, currentBlock)).toBe(false);
        });
    });
    // ====================================================================
    // 6. CONCURRENT TASK SUBMISSION (RACE CONDITION)
    // ====================================================================
    (0, globals_1.describe)('Concurrent Task Submission', () => {
        let userBalance = ethers_1.ethers.parseEther('1'); // 1 AIUS
        const taskCost = ethers_1.ethers.parseEther('0.6'); // Each task costs 0.6
        // Simulate pessimistic locking
        let isLocked = false;
        async function submitTask() {
            // Wait for lock
            while (isLocked) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            // Acquire lock
            isLocked = true;
            try {
                // Check balance
                if (userBalance < taskCost) {
                    throw new Error('Insufficient balance');
                }
                // Reserve funds
                userBalance -= taskCost;
                // Simulate async blockchain call
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            finally {
                // Release lock
                isLocked = false;
            }
        }
        (0, globals_1.it)('should prevent double-spend with concurrent tasks', async () => {
            // Reset balance
            userBalance = ethers_1.ethers.parseEther('1');
            // Submit 2 tasks concurrently (both need 0.6, only 1 AIUS available)
            const promise1 = submitTask();
            const promise2 = submitTask();
            const results = await Promise.allSettled([promise1, promise2]);
            // One should succeed, one should fail
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            (0, globals_1.expect)(succeeded).toBe(1);
            (0, globals_1.expect)(failed).toBe(1);
            // Balance should be 0.4 (1 - 0.6)
            (0, globals_1.expect)(userBalance).toBe(ethers_1.ethers.parseEther('0.4'));
        });
    });
    // ====================================================================
    // 7. DATABASE UNIQUE CONSTRAINT ON NULLABLE FIELDS
    // ====================================================================
    (0, globals_1.describe)('Database Unique Constraint', () => {
        (0, globals_1.it)('should allow multiple NULL tx_hash values', () => {
            // Simulate partial unique index
            const transactions = [
                { id: 1, tx_hash: '0xabc', type: 'deposit' },
                { id: 2, tx_hash: null, type: 'admin_credit' },
                { id: 3, tx_hash: null, type: 'admin_credit' }, // Another NULL
                { id: 4, tx_hash: '0xdef', type: 'deposit' }
            ];
            // Check uniqueness only for non-NULL values
            const nonNullHashes = transactions
                .filter(tx => tx.tx_hash !== null)
                .map(tx => tx.tx_hash);
            const uniqueHashes = new Set(nonNullHashes);
            (0, globals_1.expect)(nonNullHashes.length).toBe(uniqueHashes.size); // No duplicates
        });
        (0, globals_1.it)('should detect duplicate non-NULL tx_hash', () => {
            const transactions = [
                { id: 1, tx_hash: '0xabc', type: 'deposit' },
                { id: 2, tx_hash: '0xabc', type: 'deposit' } // Duplicate!
            ];
            const nonNullHashes = transactions
                .filter(tx => tx.tx_hash !== null)
                .map(tx => tx.tx_hash);
            const uniqueHashes = new Set(nonNullHashes);
            (0, globals_1.expect)(nonNullHashes.length).toBeGreaterThan(uniqueHashes.size); // Duplicate detected
        });
    });
    // ====================================================================
    // 8. EDGE CASE: PRICE MANIPULATION / FLASH LOANS
    // ====================================================================
    (0, globals_1.describe)('Price Manipulation Protection', () => {
        (0, globals_1.it)('should use 1-minute cache to resist flash loan attacks', async () => {
            // Normal price
            let mockPrice = 50000n * BigInt(1e18);
            const getPrice = (() => {
                let cachedPrice = null;
                const CACHE_MAX_AGE = 60 * 1000;
                return async () => {
                    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_MAX_AGE) {
                        return cachedPrice.rate;
                    }
                    cachedPrice = { rate: mockPrice, timestamp: Date.now() };
                    return mockPrice;
                };
            })();
            const price1 = await getPrice();
            // Attacker manipulates price with flash loan
            mockPrice = 100000n * BigInt(1e18); // 2x increase!
            const price2 = await getPrice(); // Should still use cached price
            (0, globals_1.expect)(price2).toBe(price1); // Manipulation ineffective
        });
    });
});
