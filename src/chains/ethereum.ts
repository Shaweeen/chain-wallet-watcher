import { ethers } from 'ethers';
import { BaseChainMonitor } from './base';
import { ChainType, ChainConfig, WalletConfig, Transaction } from '../types';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export const evmEventEmitter = new EventEmitter();

export class EVMChainMonitor extends BaseChainMonitor {
  chain: ChainType;
  private provider: ethers.JsonRpcProvider;
  private lastBlockNumbers: Map<string, number> = new Map();

  constructor(
    chain: ChainType,
    config: ChainConfig,
    wallets: WalletConfig[],
    pollInterval: number
  ) {
    super(config, wallets, pollInterval);
    this.chain = chain;
    
    if (!config.rpcUrl) {
      throw new Error(`RPC URL is required for ${chain}`);
    }
    
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return this.formatValue(balance, 18);
  }

  protected async checkTransactions(wallet: WalletConfig): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const lastBlock = this.lastBlockNumbers.get(wallet.address) || currentBlock - 1;
      
      // Only check new blocks
      if (currentBlock <= lastBlock) {
        return transactions;
      }

      logger.debug(`Checking ${this.chain} blocks ${lastBlock + 1} to ${currentBlock} for ${wallet.label || wallet.address}`);

      for (let blockNum = lastBlock + 1; blockNum <= currentBlock; blockNum++) {
        const block = await this.provider.getBlock(blockNum, true);
        if (!block || !block.prefetchedTransactions) continue;

        for (const tx of block.prefetchedTransactions) {
          const isIncoming = tx.to?.toLowerCase() === wallet.address.toLowerCase();
          const isOutgoing = tx.from.toLowerCase() === wallet.address.toLowerCase();

          if (isIncoming || isOutgoing) {
            const valueFormatted = this.formatValue(tx.value, 18);
            const minValue = wallet.minValue || 0;

            if (parseFloat(valueFormatted) >= minValue) {
              const transaction: Transaction = {
                hash: tx.hash,
                from: tx.from,
                to: tx.to || '',
                value: tx.value.toString(),
                valueFormatted: `${valueFormatted} ${this.config.nativeCurrency}`,
                chain: this.chain,
                timestamp: block.timestamp,
                blockNumber: blockNum,
                type: isIncoming ? 'incoming' : 'outgoing',
                explorerUrl: `${this.config.explorer}/tx/${tx.hash}`,
              };

              transactions.push(transaction);
              evmEventEmitter.emit('transaction', { wallet, transaction });
              
              logger.info(`[${this.chain}] ${transaction.type} tx: ${transaction.valueFormatted} - ${wallet.label || wallet.address}`);
            }
          }
        }
      }

      this.lastBlockNumbers.set(wallet.address, currentBlock);
    } catch (error) {
      logger.error(`Error checking transactions for ${wallet.address} on ${this.chain}:`, error);
    }

    return transactions;
  }
}

// Factory function for EVM chains
export function createEVMMonitor(
  chain: 'ethereum' | 'bsc' | 'polygon',
  config: ChainConfig,
  wallets: WalletConfig[],
  pollInterval: number
): EVMChainMonitor {
  return new EVMChainMonitor(chain, config, wallets, pollInterval);
}
