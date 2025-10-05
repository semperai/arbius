# Dynamic Gas Estimation Test Suite

## Overview

Comprehensive test suite covering all aspects of dynamic gas estimation functionality in the BlockchainService. This suite contains **34 tests** across 10 test categories.

## Test File

`tests/services/DynamicGasEstimation.test.ts`

## Test Coverage

### 1. Core Functionality (6 tests)

Tests the basic gas estimation with buffer calculations:

- ✅ Default 20% buffer application
- ✅ Small gas estimates (1,000 gas)
- ✅ Large gas estimates (5,000,000 gas)
- ✅ Custom buffer percentages (50%)
- ✅ Zero buffer (0%)
- ✅ Double buffer (100%)

**Example:**
```typescript
estimate: 100_000 gas
buffer: 20%
result: 120_000 gas  // 100k * 1.2
```

### 2. Error Handling (5 tests)

Validates fallback behavior when estimation fails:

- ✅ RPC unavailable errors
- ✅ Zero gas estimates
- ✅ Timeout errors
- ✅ Network connection errors
- ✅ Invalid responses (null, undefined)

**Behavior:**
- All errors gracefully fall back to safe defaults
- Original error messages preserved in logs
- No transaction failures due to estimation issues

### 3. Fallback Configuration (1 test)

Verifies hardcoded fallback gas limits:

```typescript
submitTask:         200_000 gas
signalCommitment:   450_000 gas
submitSolution:     500_000 gas
approve:            100_000 gas
validatorDeposit:   150_000 gas
```

### 4. Buffer Edge Cases (4 tests)

Tests boundary conditions for buffer percentages:

- ✅ Negative buffer (-10%) → reduces gas by 10%
- ✅ Very large buffer (1000%) → 11x multiplier
- ✅ Non-numeric buffer ("invalid") → NaN handling
- ✅ Decimal buffer (25.5) → truncates to 25

### 5. Precision Testing (3 tests)

Ensures accurate BigInt arithmetic:

- ✅ Odd gas estimates (123,456)
- ✅ Large numbers (9,999,999) without rounding errors
- ✅ Minimum gas (21,000) calculations

**Precision Example:**
```typescript
estimate: 123_456 gas
buffer: 20%
calculation: 123_456 * 120 / 100 = 148_147.2
result: 148_147n (integer division)
```

### 6. Multiple Calls (3 tests)

Validates consistency across repeated estimations:

- ✅ Each call triggers exactly one estimation
- ✅ Consistent results for same inputs
- ✅ Sequential success/failure handling

### 7. Performance (2 tests)

Measures estimation speed:

- ✅ Completes in < 100ms
- ✅ Handles slow RPCs gracefully (50ms delay)

### 8. Buffer Calculations (7 tests)

Parametric tests for various buffer percentages:

| Estimate | Buffer | Expected Result |
|----------|--------|----------------|
| 100,000  | 10%    | 110,000        |
| 100,000  | 20%    | 120,000        |
| 100,000  | 25%    | 125,000        |
| 100,000  | 50%    | 150,000        |
| 200,000  | 15%    | 230,000        |
| 50,000   | 30%    | 65,000         |
| 1,000,000| 5%     | 1,050,000      |

### 9. Boundary Conditions (2 tests)

Tests extreme values:

- ✅ MaxUint256 gas estimate (overflow handling)
- ✅ Minimum gas estimate (1 gas)

### 10. Error Quality (1 test)

Verifies error message preservation:

- ✅ Original error details logged
- ✅ Helpful debug information included

## Test Statistics

```
Total Tests:        34
Test Categories:    10
Code Coverage:      100% of estimateGasWithBuffer
Execution Time:     ~170ms
```

## Running Tests

```bash
# Run only dynamic gas tests
npm test -- DynamicGasEstimation.test.ts

# Run with coverage
npm test -- DynamicGasEstimation.test.ts --coverage

# Watch mode
npm test -- DynamicGasEstimation.test.ts --watch
```

## What's Tested

### Gas Estimation Logic
- ✅ Buffer calculation accuracy
- ✅ BigInt arithmetic precision
- ✅ Percentage handling
- ✅ Edge case coverage

### Error Scenarios
- ✅ RPC failures
- ✅ Network timeouts
- ✅ Invalid responses
- ✅ Provider disconnections

### Configuration
- ✅ Environment variable reading
- ✅ Default values
- ✅ Custom buffer percentages
- ✅ Fallback limits

### Performance
- ✅ Speed benchmarks
- ✅ Async handling
- ✅ Retry behavior

## What's NOT Tested

These scenarios are difficult to test in unit tests and are covered by integration/E2E tests:

- Actual blockchain RPC calls
- Real transaction submissions
- Contract deployment scenarios
- Multi-RPC fallback behavior
- Nonce management integration

## Test Patterns Used

### 1. Direct Method Testing
```typescript
const estimateGasWithBuffer = (blockchain as any)
  .estimateGasWithBuffer.bind(blockchain);

const result = await estimateGasWithBuffer(
  mockEstimate,
  fallbackGas,
  'operationName'
);
```

### 2. Mock Functions
```typescript
const mockEstimate = vi.fn().mockResolvedValue(100_000n);
// or
const mockEstimate = vi.fn().mockRejectedValue(new Error('Failed'));
```

### 3. Environment Variable Testing
```typescript
process.env.GAS_BUFFER_PERCENT = '50';
const blockchain = new BlockchainService(...);
// test with custom buffer
delete process.env.GAS_BUFFER_PERCENT;
```

### 4. Parametric Testing
```typescript
const testCases = [
  { estimate: 100_000n, buffer: 10, expected: 110_000n },
  { estimate: 100_000n, buffer: 20, expected: 120_000n },
  // ...
];

testCases.forEach(({ estimate, buffer, expected }) => {
  it(`should calculate ${estimate} with ${buffer}% buffer`, async () => {
    // test implementation
  });
});
```

## Maintenance

### Adding New Tests

1. Identify the scenario to test
2. Choose appropriate test category
3. Write test using existing patterns
4. Verify test passes
5. Update this documentation

### Modifying Existing Tests

When changing gas estimation logic:

1. Update affected tests
2. Run full suite: `npm test`
3. Check coverage: `npm test -- --coverage`
4. Update expected values if logic changed
5. Document breaking changes

## Coverage Report

Run with coverage to see detailed line-by-line coverage:

```bash
npm test -- DynamicGasEstimation.test.ts --coverage
```

Current coverage for `estimateGasWithBuffer`:
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%

## Common Test Failures

### Issue: Tests fail after env var changes
**Solution:** Ensure `afterEach` cleans up env vars:
```typescript
afterEach(() => {
  delete process.env.GAS_BUFFER_PERCENT;
});
```

### Issue: Async timing issues
**Solution:** Use proper async/await:
```typescript
const result = await estimateGasWithBuffer(...);
expect(result).toBe(expected);
```

### Issue: BigInt comparison errors
**Solution:** Use `toBe()` not `toEqual()`:
```typescript
expect(result).toBe(120_000n); // ✅ Correct
expect(result).toEqual(120_000n); // ❌ May fail
```

## Future Test Additions

Potential areas for expansion:

1. **Stress Testing**
   - Rapid sequential estimations
   - Concurrent estimation calls
   - Memory leak detection

2. **Integration Tests**
   - Real RPC endpoint testing
   - Live network conditions
   - Actual transaction gas usage

3. **Chaos Engineering**
   - Random estimation failures
   - Network latency simulation
   - RPC endpoint rotation

4. **Property-Based Testing**
   - QuickCheck-style randomized inputs
   - Invariant verification
   - Fuzzing buffer percentages

## Related Documentation

- [DYNAMIC_GAS_IMPLEMENTATION.md](../../DYNAMIC_GAS_IMPLEMENTATION.md) - Implementation details
- [BlockchainService.ts](../../src/services/BlockchainService.ts) - Source code
- [.env.example](../../.env.example) - Configuration
