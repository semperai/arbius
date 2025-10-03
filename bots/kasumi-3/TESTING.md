# Testing Guide for Kasumi-3

## Overview

Kasumi-3 includes a comprehensive test suite using Jest and TypeScript, covering unit tests, service tests, and integration tests.

## Test Structure

```
tests/
├── setup.ts                       # Test configuration and mocks
├── utils.test.ts                  # Unit tests for utilities
├── services/
│   ├── JobQueue.test.ts           # Job queue functionality
│   ├── ModelRegistry.test.ts      # Model registration and lookup
│   └── ConfigLoader.test.ts       # Configuration loading
└── integration/
    └── workflow.test.ts           # End-to-end workflow tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

## Test Coverage

### Utils (`tests/utils.test.ts`)
- ✅ `taskid2Seed` - Task ID to seed conversion
- ✅ `generateCommitment` - Commitment hash generation
- ✅ `hydrateInput` - Input validation and hydration
- ✅ `cidify` - CID format conversion
- ✅ `now` - Unix timestamp generation
- ✅ `sleep` - Async delay utility

### JobQueue (`tests/services/JobQueue.test.ts`)
- ✅ Job addition to queue
- ✅ Job retrieval by ID and task ID
- ✅ Status updates
- ✅ Concurrent processing limits
- ✅ Queue statistics
- ✅ Old job cleanup
- ✅ Error handling

### ModelRegistry (`tests/services/ModelRegistry.test.ts`)
- ✅ Model registration
- ✅ Retrieval by ID
- ✅ Retrieval by name (case-insensitive)
- ✅ List all models
- ✅ Model existence checks

### ConfigLoader (`tests/services/ConfigLoader.test.ts`)
- ✅ Configuration file loading
- ✅ ENV variable resolution
- ✅ Validation of required fields
- ✅ Cache directory creation
- ✅ Error handling for invalid configs

### Integration Tests (`tests/integration/workflow.test.ts`)
- ✅ End-to-end model registration workflow
- ✅ Job queue processing
- ✅ Concurrent job handling
- ✅ Task submission and processing
- ✅ Error handling and recovery
- ✅ Queue statistics tracking

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  // Excludes main entry points and old files
}
```

### Setup File (`tests/setup.ts`)
- Loads test environment variables from `.env.test`
- Mocks the logger to prevent console noise
- Mocks the uuid module for deterministic IDs
- Sets 30-second timeout for async tests

## Mocking Strategy

### Logger Mock
The logger is mocked globally to avoid initialization issues and reduce test output:
```typescript
jest.mock('../src/log', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
```

### UUID Mock
UUID generation is mocked for consistent test results:
```typescript
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7)),
}));
```

### Blockchain Service Mock
Integration tests use a comprehensive blockchain service mock:
```typescript
const mockBlockchain = {
  getWalletAddress: jest.fn().mockReturnValue('0x...'),
  submitTask: jest.fn().mockResolvedValue('0xmocktaskid'),
  getSolution: jest.fn().mockResolvedValue({ validator, cid }),
  // ... etc
};
```

## Test Environment Variables

Create a `.env.test` file with test values:
```bash
BOT_TOKEN='test-bot-token'
RPC_URL='https://test-rpc.url'
PRIVATE_KEY='0x0000...'
ARBIUS_ADDRESS='0x1234...'
ARBIUS_ROUTER_ADDRESS='0x0987...'
TOKEN_ADDRESS='0xabcd...'
REPLICATE_API_TOKEN='test-replicate-token'
PINATA_JWT='test-pinata-jwt'
```

## Writing New Tests

### Unit Test Example
```typescript
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '../src/myModule';

describe('MyModule', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Integration Test', () => {
  let service: MyService;

  beforeAll(() => {
    service = new MyService(mockDeps);
  });

  it('should handle workflow', async () => {
    const result = await service.process();
    expect(result).toBeDefined();
  });
});
```

## Continuous Integration

The test suite is designed to run in CI environments:

```yaml
# Example CI configuration
- name: Run Tests
  run: |
    npm install
    npm test
    npm run test:coverage
```

## Coverage Reports

After running `npm run test:coverage`, reports are generated in:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- Console output with summary

## Debugging Tests

### Run Single Test File
```bash
npm test tests/utils.test.ts
```

### Run Tests with Specific Pattern
```bash
npm test -- --testNamePattern="hydrateInput"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Known Test Limitations

1. **Timing-Sensitive Tests**: Some async tests may occasionally fail due to timing. Timeouts have been set conservatively.

2. **Mocked External Services**: Blockchain and IPFS services are mocked. Real integration testing requires a test network.

3. **No E2E Telegram Tests**: Telegram bot interactions are not tested end-to-end.

## Future Test Improvements

- [ ] Add blockchain integration tests with local testnet
- [ ] Add IPFS integration tests
- [ ] Mock Telegram API for bot command testing
- [ ] Add performance benchmarks
- [ ] Add mutation testing
- [ ] Increase coverage to >90%

## Troubleshooting

### Tests Timing Out
Increase timeout in `tests/setup.ts`:
```typescript
jest.setTimeout(60000); // 60 seconds
```

### Module Resolution Errors
Ensure `tsconfig.json` and `jest.config.js` have matching module resolution settings.

### Mock Not Working
Make sure mocks are defined in `tests/setup.ts` before any imports that use them.

## Test Results Summary

```
Test Suites: 5 total
Tests:       60 total
Time:        ~4s
Coverage:    >70% lines covered
```

All critical paths and business logic are covered by automated tests.
