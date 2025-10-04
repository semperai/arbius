// Test setup file
// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.RPC_URL = 'http://localhost:8545';
process.env.PRIVATE_KEY = '0x' + '1'.repeat(64);
process.env.PORT = '3001';
process.env.TIMEOUT = '5000';
