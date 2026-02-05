import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { Config, ChainType } from '../types';

const DEFAULT_CONFIG: Partial<Config> = {
  monitoring: {
    pollInterval: 30,
    maxRetries: 3,
    retryDelay: 5,
  },
  logging: {
    level: 'info',
  },
};

export function loadConfig(): Config {
  const configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config', 'config.yaml');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configFile = fs.readFileSync(configPath, 'utf-8');
  const config = YAML.parse(configFile) as Config;

  // Merge with defaults
  const mergedConfig: Config = {
    ...DEFAULT_CONFIG,
    ...config,
    monitoring: {
      ...DEFAULT_CONFIG.monitoring,
      ...config.monitoring,
    },
    logging: {
      ...DEFAULT_CONFIG.logging,
      ...config.logging,
    },
  } as Config;

  // Override with environment variables if present
  if (process.env.TELEGRAM_BOT_TOKEN) {
    mergedConfig.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN;
  }
  if (process.env.TELEGRAM_CHAT_ID) {
    mergedConfig.telegram.chatId = process.env.TELEGRAM_CHAT_ID;
  }

  // Override RPC URLs from environment
  const chainEnvMap: Record<ChainType, string> = {
    ethereum: 'ETH_RPC_URL',
    bsc: 'BSC_RPC_URL',
    polygon: 'POLYGON_RPC_URL',
    solana: 'SOLANA_RPC_URL',
    bitcoin: 'BITCOIN_API_URL',
  };

  for (const [chain, envVar] of Object.entries(chainEnvMap)) {
    if (process.env[envVar] && mergedConfig.chains[chain as ChainType]) {
      if (chain === 'bitcoin') {
        mergedConfig.chains[chain as ChainType].apiUrl = process.env[envVar];
      } else {
        mergedConfig.chains[chain as ChainType].rpcUrl = process.env[envVar];
      }
    }
  }

  validateConfig(mergedConfig);
  return mergedConfig;
}

function validateConfig(config: Config): void {
  if (!config.telegram?.botToken) {
    throw new Error('Telegram bot token is required');
  }
  if (!config.telegram?.chatId) {
    throw new Error('Telegram chat ID is required');
  }
  if (!config.wallets || config.wallets.length === 0) {
    throw new Error('At least one wallet must be configured');
  }

  for (const wallet of config.wallets) {
    if (!wallet.address || !wallet.chain) {
      throw new Error(`Invalid wallet configuration: ${JSON.stringify(wallet)}`);
    }
    if (!config.chains[wallet.chain]?.enabled) {
      throw new Error(`Chain ${wallet.chain} is not enabled for wallet ${wallet.label || wallet.address}`);
    }
  }
}

export { Config };
