import { initializePaymentSystem, PaymentSystemConfig } from '../../src/initPaymentSystem';
import { DatabaseService } from '../../src/services/DatabaseService';
import { UserService } from '../../src/services/UserService';
import { GasAccountingService } from '../../src/services/GasAccountingService';
import { DepositMonitor } from '../../src/services/DepositMonitor';
import { BlockchainService } from '../../src/services/BlockchainService';
import { registerPaymentCommands } from '../../src/bot/paymentCommands';
import { Telegraf } from 'telegraf';

// Mock dependencies
jest.mock('../../src/services/DatabaseService');
jest.mock('../../src/services/UserService');
jest.mock('../../src/services/GasAccountingService');
jest.mock('../../src/services/DepositMonitor');
jest.mock('../../src/bot/paymentCommands');

// Mock logger
jest.mock('../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('initializePaymentSystem', () => {
  let mockBot: any;
  let mockBlockchain: any;
  let config: PaymentSystemConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBot = {
      command: jest.fn(),
    } as any;

    mockBlockchain = {
      getProvider: jest.fn().mockReturnValue({
        getBlockNumber: jest.fn(),
      }),
    } as any;

    config = {
      dbPath: './test.db',
      ethMainnetRpc: 'http://localhost:8545',
      botWalletAddress: '0x1111111111111111111111111111111111111111',
      tokenAddress: '0x2222222222222222222222222222222222222222',
      adminTelegramIds: [123456789],
    };
  });

  it('should initialize all payment system components', () => {
    const paymentSystem = initializePaymentSystem(config, mockBot, mockBlockchain);

    expect(DatabaseService).toHaveBeenCalledWith(config.dbPath);
    expect(UserService).toHaveBeenCalled();
    expect(GasAccountingService).toHaveBeenCalledWith(config.ethMainnetRpc);
    expect(DepositMonitor).toHaveBeenCalled();
    expect(registerPaymentCommands).toHaveBeenCalled();

    expect(paymentSystem.db).toBeDefined();
    expect(paymentSystem.userService).toBeDefined();
    expect(paymentSystem.gasAccounting).toBeDefined();
    expect(paymentSystem.depositMonitor).toBeDefined();
  });

  it('should initialize without admin telegram IDs', () => {
    const configWithoutAdmins = {
      ...config,
      adminTelegramIds: undefined,
    };

    const paymentSystem = initializePaymentSystem(configWithoutAdmins, mockBot, mockBlockchain);

    expect(registerPaymentCommands).toHaveBeenCalledWith(
      mockBot,
      expect.anything(),
      expect.anything(),
      config.botWalletAddress,
      []
    );

    expect(paymentSystem).toBeDefined();
  });

  it('should pass correct parameters to DepositMonitor', () => {
    const mockProvider = { test: 'provider' };
    mockBlockchain.getProvider.mockReturnValue(mockProvider);

    initializePaymentSystem(config, mockBot, mockBlockchain);

    expect(DepositMonitor).toHaveBeenCalledWith(
      mockProvider,
      config.tokenAddress,
      config.botWalletAddress,
      expect.any(Object) // UserService instance
    );
  });

  it('should pass correct parameters to registerPaymentCommands', () => {
    initializePaymentSystem(config, mockBot, mockBlockchain);

    expect(registerPaymentCommands).toHaveBeenCalledWith(
      mockBot,
      expect.any(Object), // UserService
      expect.any(Object), // GasAccountingService
      config.botWalletAddress,
      config.adminTelegramIds
    );
  });

  it('should return all required services', () => {
    const paymentSystem = initializePaymentSystem(config, mockBot, mockBlockchain);

    expect(paymentSystem).toHaveProperty('db');
    expect(paymentSystem).toHaveProperty('userService');
    expect(paymentSystem).toHaveProperty('gasAccounting');
    expect(paymentSystem).toHaveProperty('depositMonitor');
  });
});
