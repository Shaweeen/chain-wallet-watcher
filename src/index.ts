import dotenv from 'dotenv';
dotenv.config();

import { loadConfig } from './config';
import { logger, configureLogger } from './utils/logger';
import { 
  createEVMMonitor, 
  SolanaMonitor, 
  BitcoinMonitor,
  evmEventEmitter,
  solanaEventEmitter,
  bitcoinEventEmitter,
  IChainMonitor
} from './chains';
import { TelegramNotifier } from './notifications';
import { ChainType, WalletConfig, NotificationPayload } from './types';

async function main(): Promise<void> {
  logger.info('ð Chain Wallet Watcher starting...');

  // Load configuration
  const config = loadConfig();
  configureLogger(config.logging);

  logger.info(`Loaded configuration with ${config.wallets.length} wallet(s)`);

  // Initialize Telegram notifier
  const telegram = new TelegramNotifier(config.telegram);

  // Group wallets by chain
  const walletsByChain = new Map<ChainType, WalletConfig[]>();
  for (const wallet of config.wallets) {
    const existing = walletsByChain.get(wallet.chain) || [];
    existing.push(wallet);
    walletsByChain.set(wallet.chain, existing);
  }

  // Initialize monitors
  const monitors: IChainMonitor[] = [];
  const pollInterval = config.monitoring.pollInterval;

  // Set up event handlers for notifications
  const handleTransaction = async (data: { wallet: WalletConfig; transaction: any }) => {
    const { wallet, transaction } = data;
    const payload: NotificationPayload = {
      wallet,
      transaction,
    };
    
    // Get current balance
    const monitor = monitors.find(m => m.chain === transaction.chain);
    if (monitor) {
      try {
        payload.balance = await monitor.getBalance(wallet.address);
      } catch (error) {
        logger.warn(`Could not fetch balance for ${wallet.address}`);
      }
    }

    await telegram.send(payload);
  };

  // Subscribe to events
  evmEventEmitter.on('transaction', handleTransaction);
  solanaEventEmitter.on('transaction', handleTransaction);
  bitcoinEventEmitter.on('transaction', handleTransaction);

  // EVM Chains (Ethereum, BSC, Polygon)
  const evmChains: Array<'ethereum' | 'bsc' | 'polygon'> = ['ethereum', 'bsc', 'polygon'];
  for (const chain of evmChains) {
    if (config.chains[chain]?.enabled && walletsByChain.has(chain)) {
      const wallets = walletsByChain.get(chain)!;
      const monitor = createEVMMonitor(chain, config.chains[chain], wallets, pollInterval);
      monitors.push(monitor);
      logger.info(`Initialized ${chain} monitor for ${wallets.length} wallet(s)`);
    }
  }

  // Solana
  if (config.chains.solana?.enabled && walletsByChain.has('solana')) {
    const wallets = walletsByChain.get('solana')!;
    const monitor = new SolanaMonitor(config.chains.solana, wallets, pollInterval);
    monitors.push(monitor);
    logger.info(`Initialized solana monitor for ${wallets.length} wallet(s)`);
  }

  // Bitcoin
  if (config.chains.bitcoin?.enabled && walletsByChain.has('bitcoin')) {
    const wallets = walletsByChain.get('bitcoin')!;
    const monitor = new BitcoinMonitor(config.chains.bitcoin, wallets, pollInterval);
    monitors.push(monitor);
    logger.info(`Initialized bitcoin monitor for ${wallets.length} wallet(s)`);
  }

  if (monitors.length === 0) {
    logger.error('No monitors initialized. Please check your configuration.');
    process.exit(1);
  }

  // Start all monitors
  for (const monitor of monitors) {
    await monitor.start();
  }

  logger.info(`â Wallet Watcher running with ${monitors.length} chain monitor(s)`);
  logger.info(`ð¡ Polling interval: ${pollInterval} seconds`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    
    for (const monitor of monitors) {
      await monitor.stop();
    }
    
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
