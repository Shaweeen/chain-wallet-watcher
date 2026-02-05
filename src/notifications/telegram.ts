import TelegramBot from 'node-telegram-bot-api';
import { TelegramConfig, NotificationPayload, INotificationChannel } from '../types';
import { logger } from '../utils/logger';

export class TelegramNotifier implements INotificationChannel {
  private bot: TelegramBot;
  private chatId: string;
  private messageFormat: 'markdown' | 'html';

  constructor(config: TelegramConfig) {
    this.bot = new TelegramBot(config.botToken);
    this.chatId = config.chatId;
    this.messageFormat = config.messageFormat || 'markdown';
  }

  async send(payload: NotificationPayload): Promise<void> {
    const { wallet, transaction } = payload;
    
    const emoji = transaction.type === 'incoming' ? 'ð¥' : 'ð¤';
    const typeText = transaction.type === 'incoming' ? 'Received' : 'Sent';
    const chainName = this.formatChainName(transaction.chain);

    const message = this.messageFormat === 'markdown'
      ? this.formatMarkdownMessage(emoji, typeText, chainName, wallet, transaction, payload.balance)
      : this.formatHtmlMessage(emoji, typeText, chainName, wallet, transaction, payload.balance);

    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: this.messageFormat === 'markdown' ? 'MarkdownV2' : 'HTML',
        disable_web_page_preview: true,
      });
      logger.debug(`Telegram notification sent for ${transaction.hash}`);
    } catch (error) {
      logger.error('Failed to send Telegram notification:', error);
    }
  }

  private formatChainName(chain: string): string {
    const names: Record<string, string> = {
      ethereum: 'Ethereum',
      bsc: 'BSC',
      polygon: 'Polygon',
      solana: 'Solana',
      bitcoin: 'Bitcoin',
    };
    return names[chain] || chain;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  private formatMarkdownMessage(
    emoji: string,
    typeText: string,
    chainName: string,
    wallet: any,
    transaction: any,
    balance?: string
  ): string {
    const lines = [
      `${emoji} *${typeText} on ${chainName}*`,
      '',
      `ð¼ *Wallet:* ${this.escapeMarkdown(wallet.label || wallet.address)}`,
      `ð° *Amount:* ${this.escapeMarkdown(transaction.valueFormatted)}`,
      '',
    ];

    if (transaction.type === 'incoming') {
      lines.push(`ð *From:* \`${this.escapeMarkdown(this.truncateAddress(transaction.from))}\``);
    } else {
      lines.push(`ð *To:* \`${this.escapeMarkdown(this.truncateAddress(transaction.to))}\``);
    }

    if (balance) {
      lines.push(`ð *Balance:* ${this.escapeMarkdown(balance)}`);
    }

    lines.push('', `[View Transaction](${transaction.explorerUrl})`);

    return lines.join('\n');
  }

  private formatHtmlMessage(
    emoji: string,
    typeText: string,
    chainName: string,
    wallet: any,
    transaction: any,
    balance?: string
  ): string {
    const lines = [
      `${emoji} <b>${typeText} on ${chainName}</b>`,
      '',
      `ð¼ <b>Wallet:</b> ${wallet.label || wallet.address}`,
      `ð° <b>Amount:</b> ${transaction.valueFormatted}`,
      '',
    ];

    if (transaction.type === 'incoming') {
      lines.push(`ð <b>From:</b> <code>${this.truncateAddress(transaction.from)}</code>`);
    } else {
      lines.push(`ð <b>To:</b> <code>${this.truncateAddress(transaction.to)}</code>`);
    }

    if (balance) {
      lines.push(`ð <b>Balance:</b> ${balance}`);
    }

    lines.push('', `<a href="${transaction.explorerUrl}">View Transaction</a>`);

    return lines.join('\n');
  }

  private truncateAddress(address: string): string {
    if (!address || address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
