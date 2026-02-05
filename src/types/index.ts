// Chain Types
export type ChainType = 'ethereum' | 'bsc' | 'polygon' | 'solana' | 'bitcoin';

// Configuration Types
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  messageFormat?: 'markdown' | 'html';
}

export interface ChainConfig {
  enabled: boolean;
  rpcUrl?: string;
  apiUrl?: string;
  chainId?: number;
  nativeCurrency: string;
  explorer: string;
}

export interface WalletConfig {
  address: string;
  chain: ChainType;
  label: string;
  minValue?: number;
}

export interface MonitoringConfig {
  pollInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  maxSize?: string;
  maxFiles?: number;
}

export interface Config {
  telegram: TelegramConfig;
  chains: Record<ChainType, ChainConfig>;
  wallets: WalletConfig[];
  monitoring: MonitoringConfig;
  logging: LoggingConfig;
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  chain: ChainType;
  timestamp: number;
  blockNumber: number;
  type: 'incoming' | 'outgoing';
  explorerUrl: string;
}

// Notification Types
export interface NotificationPayload {
  wallet: WalletConfig;
  transaction: Transaction;
  balance?: string;
}

// Chain Monitor Interface
export interface IChainMonitor {
  chain: ChainType;
  start(): Promise<void>;
  stop(): Promise<void>;
  getBalance(address: string): Promise<string>;
}

// Notification Channel Interface
export interface INotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
