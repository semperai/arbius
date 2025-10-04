import { Telegraf, Context } from 'telegraf';
import { UserService } from '../services/UserService';
import { GasAccountingService } from '../services/GasAccountingService';
import { ethers } from 'ethers';
import { log } from '../log';

/**
 * Register payment-related bot commands
 */
export function registerPaymentCommands(
  bot: Telegraf,
  userService: UserService,
  gasAccounting: GasAccountingService,
  botWalletAddress: string,
  adminIds: number[] = []
) {
  // /link <address> - Link wallet to Telegram account
  bot.command('link', async (ctx: Context) => {
    const args = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ').slice(1) : [];

    if (args.length < 1) {
      return ctx.reply(
        '❌ Usage: /link <wallet_address>\n\n' +
        'Example: /link 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      );
    }

    const walletAddress = args[0];
    const telegramId = ctx.from!.id;
    const telegramUsername = ctx.from!.username;

    const result = userService.linkWallet(telegramId, walletAddress, telegramUsername);

    if (result.success) {
      ctx.reply(
        `✅ Wallet linked successfully!\n\n` +
        `Address: \`${ethers.getAddress(walletAddress)}\`\n` +
        `Telegram: @${telegramUsername || telegramId}\n\n` +
        `You can now deposit AIUS to start using the bot.\n` +
        `Use /deposit to see deposit instructions.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      ctx.reply(`❌ Failed to link wallet: ${result.error}`);
    }
  });

  // /deposit - Show deposit instructions
  bot.command('deposit', async (ctx: Context) => {
    const telegramId = ctx.from!.id;
    const user = userService.getUser(telegramId);

    if (!user) {
      return ctx.reply(
        '❌ Please link your wallet first using:\n' +
        '/link <wallet_address>'
      );
    }

    const balance = userService.getBalance(telegramId);

    ctx.reply(
      `💰 **Deposit AIUS Tokens**\n\n` +
      `Send AIUS tokens from your linked wallet to:\n` +
      `\`${botWalletAddress}\`\n\n` +
      `**Your Linked Wallet:**\n` +
      `\`${user.wallet_address}\`\n\n` +
      `**Current Balance:**\n` +
      `${ethers.formatEther(balance)} AIUS\n\n` +
      `⚠️ **Important:**\n` +
      `• Only send from your linked wallet address\n` +
      `• Deposits are credited automatically\n` +
      `• Network: Arbitrum One`,
      { parse_mode: 'Markdown' }
    );
  });

  // /balance - Check balance
  bot.command('balance', async (ctx: Context) => {
    const telegramId = ctx.from!.id;
    const user = userService.getUser(telegramId);

    if (!user) {
      return ctx.reply(
        '❌ Please link your wallet first using:\n' +
        '/link <wallet_address>'
      );
    }

    const balance = userService.getBalance(telegramId);
    const stats = userService.getStats();

    ctx.reply(
      `💰 **Your Balance**\n\n` +
      `${ethers.formatEther(balance)} AIUS\n\n` +
      `Use /deposit to add funds\n` +
      `Use /history to see transactions`,
      { parse_mode: 'Markdown' }
    );
  });

  // /history - Show transaction history
  bot.command('history', async (ctx: Context) => {
    const telegramId = ctx.from!.id;
    const user = userService.getUser(telegramId);

    if (!user) {
      return ctx.reply(
        '❌ Please link your wallet first using:\n' +
        '/link <wallet_address>'
      );
    }

    const transactions = userService.getTransactionHistory(telegramId, 10);

    if (transactions.length === 0) {
      return ctx.reply('📜 No transactions yet');
    }

    let message = '📜 **Recent Transactions** (last 10)\n\n';

    for (const tx of transactions) {
      const date = new Date(tx.timestamp).toLocaleString();
      const amount = ethers.formatEther(tx.amount_aius);

      let emoji = '';
      let desc = '';

      switch (tx.type) {
        case 'deposit':
          emoji = '⬇️';
          desc = `Deposit: +${amount} AIUS`;
          break;
        case 'model_fee':
          emoji = '⬆️';
          const gas = tx.gas_cost_aius ? ethers.formatEther(tx.gas_cost_aius) : '0';
          desc = `Task ${tx.taskid?.slice(0, 8)}: -${amount} AIUS (gas: ${gas})`;
          break;
        case 'refund':
          emoji = '↩️';
          desc = `Refund ${tx.taskid?.slice(0, 8)}: +${amount} AIUS`;
          break;
        case 'admin_credit':
          emoji = '🎁';
          desc = `Admin credit: +${amount} AIUS`;
          break;
      }

      message += `${emoji} ${desc}\n${date}\n\n`;
    }

    ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // /price - Show current AIUS/ETH price
  bot.command('price', async (ctx: Context) => {
    try {
      const cached = gasAccounting.getCachedPrice();

      if (cached) {
        const ageMin = Math.floor(cached.ageMs / 1000 / 60);
        const aiusPerEth = ethers.formatEther(cached.aiusPerEth);

        ctx.reply(
          `💱 **AIUS/ETH Price**\n\n` +
          `${aiusPerEth} AIUS per 1 ETH\n\n` +
          `Source: Uniswap V2 (Ethereum)\n` +
          `Updated: ${ageMin}m ago`,
          { parse_mode: 'Markdown' }
        );
      } else {
        ctx.reply('⏳ Fetching price...');
        const aiusPerEth = await gasAccounting.getAiusPerEth();
        ctx.reply(
          `💱 **AIUS/ETH Price**\n\n` +
          `${ethers.formatEther(aiusPerEth)} AIUS per 1 ETH\n\n` +
          `Source: Uniswap V2 (Ethereum)`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error: any) {
      ctx.reply(`❌ Failed to fetch price: ${error.message}`);
    }
  });

  // Admin commands
  if (adminIds.length > 0) {
    const isAdmin = (userId: number) => adminIds.includes(userId);

    // /admin_stats - System statistics
    bot.command('admin_stats', async (ctx: Context) => {
      if (!isAdmin(ctx.from!.id)) {
        return ctx.reply('❌ Admin access required');
      }

      const stats = userService.getStats();

      ctx.reply(
        `📊 **System Statistics**\n\n` +
        `**Users:**\n` +
        `Total: ${stats.total_users}\n` +
        `With balance: ${stats.users_with_balance}\n\n` +
        `**Balances:**\n` +
        `Total deposits: ${ethers.formatEther(stats.total_deposits)} AIUS\n` +
        `Total spent: ${ethers.formatEther(stats.total_spent)} AIUS\n` +
        `Total refunds: ${ethers.formatEther(stats.total_refunds)} AIUS\n\n` +
        `**Activity (24h):**\n` +
        `Tasks: ${stats.tasks_24h}`,
        { parse_mode: 'Markdown' }
      );
    });

    // /admin_credit <telegram_id> <amount> <reason> - Manual credit
    bot.command('admin_credit', async (ctx: Context) => {
      if (!isAdmin(ctx.from!.id)) {
        return ctx.reply('❌ Admin access required');
      }

      const args = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ').slice(1) : [];

      if (args.length < 3) {
        return ctx.reply(
          'Usage: /admin_credit <telegram_id> <amount_aius> <reason>\n\n' +
          'Example: /admin_credit 123456789 10 "Compensation for error"'
        );
      }

      const targetId = parseInt(args[0]);
      const amount = ethers.parseEther(args[1]);
      const reason = args.slice(2).join(' ');

      const success = userService.adminCredit(targetId, amount, reason);

      if (success) {
        ctx.reply(
          `✅ Credited ${args[1]} AIUS to user ${targetId}\n` +
          `Reason: ${reason}`
        );

        // Notify user
        try {
          await ctx.telegram.sendMessage(
            targetId,
            `🎁 You received ${args[1]} AIUS\n\n` +
            `Reason: ${reason}\n\n` +
            `Check your balance with /balance`
          );
        } catch (e) {
          log.warn(`Failed to notify user ${targetId}: ${e}`);
        }
      } else {
        ctx.reply('❌ Failed to credit user');
      }
    });

    // /admin_user <telegram_id|wallet> - View user details
    bot.command('admin_user', async (ctx: Context) => {
      if (!isAdmin(ctx.from!.id)) {
        return ctx.reply('❌ Admin access required');
      }

      const args = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ').slice(1) : [];

      if (args.length < 1) {
        return ctx.reply('Usage: /admin_user <telegram_id|wallet_address>');
      }

      const query = args[0];
      let user;

      if (query.startsWith('0x')) {
        user = userService.getUserByWallet(query);
      } else {
        user = userService.getUser(parseInt(query));
      }

      if (!user) {
        return ctx.reply('❌ User not found');
      }

      const balance = userService.getBalance(user.telegram_id);
      const linkedDate = new Date(user.linked_at).toLocaleString();

      ctx.reply(
        `👤 **User Details**\n\n` +
        `Telegram ID: \`${user.telegram_id}\`\n` +
        `Username: @${user.telegram_username || 'none'}\n` +
        `Wallet: \`${user.wallet_address}\`\n` +
        `Balance: ${ethers.formatEther(balance)} AIUS\n` +
        `Linked: ${linkedDate}`,
        { parse_mode: 'Markdown' }
      );
    });
  }
}
