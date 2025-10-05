import { vi } from 'vitest';
import { Telegraf } from 'telegraf';
import { registerPaymentCommands } from '../../src/bot/paymentCommands';
import { UserService } from '../../src/services/UserService';
import { GasAccountingService } from '../../src/services/GasAccountingService';
import { ethers } from 'ethers';

vi.mock('../../src/log');

describe('paymentCommands', () => {
  let bot: any;
  let userService: vi.Mocked<UserService>;
  let gasAccounting: vi.Mocked<GasAccountingService>;
  let commandHandlers: Map<string, Function>;
  const botWalletAddress = '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b';
  const adminIds = [111111111];

  beforeEach(() => {
    commandHandlers = new Map();

    // Mock Telegraf bot
    bot = {
      command: vi.fn((cmd: string, handler: Function) => {
        commandHandlers.set(cmd, handler);
      }),
    };

    // Mock UserService
    userService = {
      linkWallet: vi.fn(),
      getUser: vi.fn(),
      getBalance: vi.fn(),
      getStats: vi.fn(),
      getTransactionHistory: vi.fn(),
      adminCredit: vi.fn(),
      getUserByWallet: vi.fn(),
    } as any;

    // Mock GasAccountingService
    gasAccounting = {
      getCachedPrice: vi.fn(),
      getAiusPerEth: vi.fn(),
    } as any;
  });

  // Helper to create mock context
  const createMockContext = (userId: number, username?: string, text?: string) => {
    return {
      from: {
        id: userId,
        username: username || 'testuser',
      },
      message: text ? { text } : undefined,
      reply: vi.fn(),
      telegram: {
        sendMessage: vi.fn(),
      },
    };
  };

  describe('/link', () => {
    beforeEach(() => {
      registerPaymentCommands(bot, userService, gasAccounting, botWalletAddress, adminIds);
    });

    it('should register link command', () => {
      expect(bot.command).toHaveBeenCalledWith('link', expect.any(Function));
    });

    it('should link wallet successfully', async () => {
      const ctx = createMockContext(123456, 'testuser', '/link 0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b');

      userService.linkWallet.mockReturnValue({
        success: true,
        user: {
          telegram_id: 123456,
          wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
          telegram_username: 'testuser',
          linked_at: Date.now(),
        },
      });

      const handler = commandHandlers.get('link')!;
      await handler(ctx);

      expect(userService.linkWallet).toHaveBeenCalledWith(
        123456,
        '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b',
        'testuser'
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('✅ Wallet linked successfully'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should show error on link failure', async () => {
      const ctx = createMockContext(123456, 'testuser', '/link 0xinvalid');

      userService.linkWallet.mockReturnValue({
        success: false,
        error: 'Invalid Ethereum address',
      });

      const handler = commandHandlers.get('link')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        '❌ Failed to link wallet: Invalid Ethereum address'
      );
    });

    it('should show usage when no address provided', async () => {
      const ctx = createMockContext(123456, 'testuser', '/link');

      const handler = commandHandlers.get('link')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Usage: /link <wallet_address>')
      );
    });
  });

  describe('/deposit', () => {
    beforeEach(() => {
      registerPaymentCommands(bot, userService, gasAccounting, botWalletAddress, adminIds);
    });

    it('should show deposit instructions for linked user', async () => {
      const ctx = createMockContext(123456, 'testuser', '/deposit');

      userService.getUser.mockReturnValue({
        telegram_id: 123456,
        wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
        telegram_username: 'testuser',
        balance_aius: '1000000000000000000',
        linked_at: Date.now(),
        created_at: Date.now(),
      });
      userService.getBalance.mockReturnValue(BigInt('1000000000000000000')); // 1 AIUS

      const handler = commandHandlers.get('deposit')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining(botWalletAddress),
        { parse_mode: 'Markdown' }
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('1.0 AIUS'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should show error when wallet not linked', async () => {
      const ctx = createMockContext(123456, 'testuser', '/deposit');

      userService.getUser.mockReturnValue(null);

      const handler = commandHandlers.get('deposit')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Please link your wallet first')
      );
    });
  });

  describe('/balance', () => {
    beforeEach(() => {
      registerPaymentCommands(bot, userService, gasAccounting, botWalletAddress, adminIds);
    });

    it('should show balance for linked user', async () => {
      const ctx = createMockContext(123456, 'testuser', '/balance');

      userService.getUser.mockReturnValue({
        telegram_id: 123456,
        wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
        telegram_username: 'testuser',
        balance_aius: '1000000000000000000',
        linked_at: Date.now(),
        created_at: Date.now(),
      });
      userService.getBalance.mockReturnValue(BigInt('5000000000000000000')); // 5 AIUS
      userService.getStats.mockReturnValue({
        total_users: 10,
        users_with_balance: 5,
        total_deposits: '100000000000000000000',
        total_spent: '50000000000000000000',
        total_refunds: '10000000000000000000',
        tasks_24h: 42,
      });

      const handler = commandHandlers.get('balance')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('5.0 AIUS'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should show error when wallet not linked', async () => {
      const ctx = createMockContext(123456, 'testuser', '/balance');

      userService.getUser.mockReturnValue(null);

      const handler = commandHandlers.get('balance')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Please link your wallet first')
      );
    });
  });

  describe('/history', () => {
    beforeEach(() => {
      registerPaymentCommands(bot, userService, gasAccounting, botWalletAddress, adminIds);
    });

    it('should show transaction history', async () => {
      const ctx = createMockContext(123456, 'testuser', '/history');

      userService.getUser.mockReturnValue({
        telegram_id: 123456,
        wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
        telegram_username: 'testuser',
        balance_aius: '1000000000000000000',
        linked_at: Date.now(),
        created_at: Date.now(),
      });

      userService.getTransactionHistory.mockReturnValue([
        {
          id: 1,
          telegram_id: 123456,
          type: 'deposit',
          amount_aius: '1000000000000000000',
          gas_cost_aius: null,
          total_cost_aius: null,
          timestamp: Date.now(),
          tx_hash: '0xabc',
          from_address: '0xfrom',
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
          taskid: null,
        },
        {
          id: 2,
          telegram_id: 123456,
          type: 'model_fee',
          amount_aius: '100000000000000000',
          gas_cost_aius: '10000000000000000',
          total_cost_aius: null,
          taskid: '0xtask123',
          timestamp: Date.now(),
          tx_hash: null,
          from_address: null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
        },
        {
          id: 3,
          telegram_id: 123456,
          type: 'refund',
          amount_aius: '100000000000000000',
          gas_cost_aius: null,
          total_cost_aius: null,
          taskid: '0xtask456',
          timestamp: Date.now(),
          tx_hash: null,
          from_address: null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
        },
        {
          id: 4,
          telegram_id: 123456,
          type: 'admin_credit',
          amount_aius: '500000000000000000',
          gas_cost_aius: null,
          total_cost_aius: null,
          taskid: 'Bonus reward',
          timestamp: Date.now(),
          tx_hash: null,
          from_address: null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
        },
      ]);

      const handler = commandHandlers.get('history')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('📜 **Recent Transactions**'),
        { parse_mode: 'Markdown' }
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('⬇️'), // deposit
        { parse_mode: 'Markdown' }
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('⬆️'), // model_fee
        { parse_mode: 'Markdown' }
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('↩️'), // refund
        { parse_mode: 'Markdown' }
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('🎁'), // admin_credit
        { parse_mode: 'Markdown' }
      );
    });

    it('should show message when no transactions', async () => {
      const ctx = createMockContext(123456, 'testuser', '/history');

      userService.getUser.mockReturnValue({
        telegram_id: 123456,
        wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
        telegram_username: 'testuser',
        balance_aius: '1000000000000000000',
        linked_at: Date.now(),
        created_at: Date.now(),
      });

      userService.getTransactionHistory.mockReturnValue([]);

      const handler = commandHandlers.get('history')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith('📜 No transactions yet');
    });

    it('should show error when wallet not linked', async () => {
      const ctx = createMockContext(123456, 'testuser', '/history');

      userService.getUser.mockReturnValue(null);

      const handler = commandHandlers.get('history')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Please link your wallet first')
      );
    });
  });

  describe('/price', () => {
    beforeEach(() => {
      registerPaymentCommands(bot, userService, gasAccounting, botWalletAddress, adminIds);
    });

    it('should show cached price', async () => {
      const ctx = createMockContext(123456, 'testuser', '/price');

      gasAccounting.getCachedPrice.mockReturnValue({
        aiusPerEth: BigInt('100000000000000000000'), // 100 AIUS/ETH
        ageMs: 30000, // 30 seconds
      });

      const handler = commandHandlers.get('price')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('100.0 AIUS per 1 ETH'),
        { parse_mode: 'Markdown' }
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('0m ago'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should fetch fresh price when no cache', async () => {
      const ctx = createMockContext(123456, 'testuser', '/price');

      gasAccounting.getCachedPrice.mockReturnValue(null);
      gasAccounting.getAiusPerEth.mockResolvedValue(BigInt('100000000000000000000'));

      const handler = commandHandlers.get('price')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith('⏳ Fetching price...');
      expect(gasAccounting.getAiusPerEth).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('100.0 AIUS per 1 ETH'),
        { parse_mode: 'Markdown' }
      );
    });

    it('should handle price fetch error', async () => {
      const ctx = createMockContext(123456, 'testuser', '/price');

      gasAccounting.getCachedPrice.mockReturnValue(null);
      gasAccounting.getAiusPerEth.mockRejectedValue(new Error('Oracle error'));

      const handler = commandHandlers.get('price')!;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to fetch price: Oracle error')
      );
    });
  });

  describe('Admin Commands', () => {
    beforeEach(() => {
      registerPaymentCommands(bot, userService, gasAccounting, botWalletAddress, adminIds);
    });

    describe('/admin_stats', () => {
      it('should show stats for admin user', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_stats');

        userService.getStats.mockReturnValue({
          total_users: 50,
          users_with_balance: 30,
          total_deposits: '1000000000000000000000',
          total_spent: '500000000000000000000',
          total_refunds: '100000000000000000000',
          tasks_24h: 123,
        });

        const handler = commandHandlers.get('admin_stats')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('📊 **System Statistics**'),
          { parse_mode: 'Markdown' }
        );
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Total: 50'),
          { parse_mode: 'Markdown' }
        );
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Tasks: 123'),
          { parse_mode: 'Markdown' }
        );
      });

      it('should deny access to non-admin', async () => {
        const ctx = createMockContext(999999999, 'hacker', '/admin_stats');

        const handler = commandHandlers.get('admin_stats')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('❌ Admin access required');
      });
    });

    describe('/admin_credit', () => {
      it('should credit user successfully', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_credit 123456 10 "Test bonus"');

        userService.adminCredit.mockReturnValue(true);

        const handler = commandHandlers.get('admin_credit')!;
        await handler(ctx);

        expect(userService.adminCredit).toHaveBeenCalledWith(
          123456,
          ethers.parseEther('10'),
          '"Test bonus"'
        );
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('✅ Credited 10 AIUS to user 123456')
        );
        expect(ctx.telegram.sendMessage).toHaveBeenCalledWith(
          123456,
          expect.stringContaining('🎁 You received 10 AIUS')
        );
      });

      it('should handle notification failure', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_credit 123456 5 Bonus');

        userService.adminCredit.mockReturnValue(true);
        ctx.telegram.sendMessage.mockRejectedValue(new Error('User blocked bot'));

        const handler = commandHandlers.get('admin_credit')!;
        await handler(ctx);

        // Should still confirm credit even if notification fails
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('✅ Credited 5 AIUS')
        );
      });

      it('should show error on credit failure', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_credit 999999 10 Test');

        userService.adminCredit.mockReturnValue(false);

        const handler = commandHandlers.get('admin_credit')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('❌ Failed to credit user');
      });

      it('should show usage when insufficient args', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_credit 123456');

        const handler = commandHandlers.get('admin_credit')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Usage: /admin_credit')
        );
      });

      it('should deny access to non-admin', async () => {
        const ctx = createMockContext(999999999, 'hacker', '/admin_credit 123 10 Hack');

        const handler = commandHandlers.get('admin_credit')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('❌ Admin access required');
      });
    });

    describe('/admin_user', () => {
      it('should show user details by telegram ID', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_user 123456');

        userService.getUser.mockReturnValue({
          telegram_id: 123456,
          wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
          telegram_username: 'testuser',
          balance_aius: '2500000000000000000',
          linked_at: 1640000000000,
          created_at: 1640000000000,
        });
        userService.getBalance.mockReturnValue(BigInt('2500000000000000000'));

        const handler = commandHandlers.get('admin_user')!;
        await handler(ctx);

        expect(userService.getUser).toHaveBeenCalledWith(123456);
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('👤 **User Details**'),
          { parse_mode: 'Markdown' }
        );
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Balance: 2.5 AIUS'),
          { parse_mode: 'Markdown' }
        );
      });

      it('should show user details by wallet address', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_user 0x0ac10f130e534eeb18dad519ad193d229790bd4b');

        userService.getUserByWallet.mockReturnValue({
          telegram_id: 123456,
          wallet_address: '0x0ac10f130e534eeb18dad519ad193d229790bd4b',
          telegram_username: 'testuser',
          balance_aius: '1000000000000000000',
          linked_at: 1640000000000,
          created_at: 1640000000000,
        });
        userService.getBalance.mockReturnValue(BigInt('1000000000000000000'));

        const handler = commandHandlers.get('admin_user')!;
        await handler(ctx);

        expect(userService.getUserByWallet).toHaveBeenCalledWith('0x0ac10f130e534eeb18dad519ad193d229790bd4b');
        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('👤 **User Details**'),
          { parse_mode: 'Markdown' }
        );
      });

      it('should show error when user not found', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_user 999999');

        userService.getUser.mockReturnValue(null);

        const handler = commandHandlers.get('admin_user')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('❌ User not found');
      });

      it('should show usage when no args', async () => {
        const ctx = createMockContext(111111111, 'admin', '/admin_user');

        const handler = commandHandlers.get('admin_user')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(
          expect.stringContaining('Usage: /admin_user')
        );
      });

      it('should deny access to non-admin', async () => {
        const ctx = createMockContext(999999999, 'hacker', '/admin_user 123456');

        const handler = commandHandlers.get('admin_user')!;
        await handler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('❌ Admin access required');
      });
    });
  });

  describe('Registration without admin IDs', () => {
    it('should not register admin commands when no admin IDs provided', () => {
      const botNoAdmin = {
        command: vi.fn(),
      };

      registerPaymentCommands(botNoAdmin as any, userService, gasAccounting, botWalletAddress, []);

      const registeredCommands = botNoAdmin.command.mock.calls.map(call => call[0]);

      expect(registeredCommands).toContain('link');
      expect(registeredCommands).toContain('deposit');
      expect(registeredCommands).toContain('balance');
      expect(registeredCommands).toContain('history');
      expect(registeredCommands).toContain('price');
      expect(registeredCommands).not.toContain('admin_stats');
      expect(registeredCommands).not.toContain('admin_credit');
      expect(registeredCommands).not.toContain('admin_user');
    });
  });
});
