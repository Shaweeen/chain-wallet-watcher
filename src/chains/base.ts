import { ChainType, ChainConfig, WalletConfig, Transaction, IChainMonitor } from '../types';
import { logger } from '../utils/logger';

export abstract class BaseChainMonitor implements IChainMonitor {
  protected config: ChainConfig;
  protected wallets: WalletConfig[];
  protected isRunning: boolean = false;
  protected pollInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  abstract chain: ChainType;

  constructor(config: ChainConfig, wallets: WalletConfig[], pollInterval: number) {
    this.config = config;
    this.wallets = wallets;
    this.pollInterval = pollInterval;
  }

  abstract getBalance(address: string): Promise<string>;
  protected abstract checkTransactions(wallet: WalletConfig): Promise<Transaction[]>;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`${this.chain} monitor is already running`);
      return;
    }

    this.isRunning = true;
    logger.info(`Starting ${this.chain} monitor for ${this.wallets.length} wallet(s)`);

    // Initial check
    await this.pollWallets();

    // Set up polling interval
    this.intervalId = setInterval(() => {
      this.pollWallets().catch((error) => {
        logger.error(`Error polling ${this.chain} wallets:`, error);
      });
    }, this.pollInterval * 1000);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info(`Stopped ${this.chain} monitor`);
  }

  protected async pollWallets(): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];

    for (const wallet of this.wallets) {
      try {
        const transactions = await this.checkTransactions(wallet);
        allTransactions.push(...transactions);
      } catch (error) {
        logger.error(`Error checking wallet ${wallet.label || wallet.address}:`, error);
      }
    }

    return allTransactions;
  }

  protected formatValue(value: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const fracPart = value % divisor;
    const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 6);
    return `${intPart}.${fracStr}`;
  }
}
