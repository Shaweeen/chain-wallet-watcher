import { loadConfig } from './config';
import { configureLogger } from './utils/logger';
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

export interface Env {
  WALLET_STATE: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

async function runWatcher(env: Env) {
  // Use environment variables for sensitive info
  const config = loadConfig();
  if (env.TELEGRAM_BOT_TOKEN) config.telegram.token = env.TELEGRAM_BOT_TOKEN;
  if (env.TELEGRAM_CHAT_ID) config.telegram.chatId = env.TELEGRAM_CHAT_ID;
  
  configureLogger(config.logging);

  const telegram = new TelegramNotifier(config.telegram);
  const walletsByChain = new Map<ChainType, WalletConfig[]>();
  for (const wallet of config.wallets) {
    const existing = walletsByChain.get(wallet.chain) || [];
    existing.push(wallet);
    walletsByChain.set(wallet.chain, existing);
  }

  const monitors: IChainMonitor[] = [];
  
  const handleTransaction = async (data: { wallet: WalletConfig; transaction: any }) => {
    const { wallet, transaction } = data;
    const payload: NotificationPayload = { wallet, transaction };
    
    const monitor = monitors.find(m => m.chain === transaction.chain);
    if (monitor) {
      try {
        payload.balance = await monitor.getBalance(wallet.address);
      } catch (e) {}
    }

    await telegram.send(payload);
  };

  evmEventEmitter.on('transaction', handleTransaction);
  solanaEventEmitter.on('transaction', handleTransaction);
  bitcoinEventEmitter.on('transaction', handleTransaction);

  for (const [chain, wallets] of walletsByChain.entries()) {
    let monitor: IChainMonitor;
    if (chain === ChainType.ETHEREUM || chain === ChainType.BSC || chain === ChainType.POLYGON) {
      monitor = createEVMMonitor(chain, wallets);
    } else if (chain === ChainType.SOLANA) {
      monitor = new SolanaMonitor(wallets);
    } else {
      monitor = new BitcoinMonitor(wallets);
    }
    monitors.push(monitor);
  }

  // Run one-time check
  await Promise.all(monitors.map(m => m.checkTransactions()));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    await runWatcher(env);
    return new Response("Watcher executed");
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runWatcher(env));
  },
};
