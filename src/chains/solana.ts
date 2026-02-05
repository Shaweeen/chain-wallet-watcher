import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BaseChainMonitor } from './base';
import { ChainConfig, WalletConfig, Transaction } from '../types';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export const solanaEventEmitter = new EventEmitter();

export class SolanaMonitor extends BaseChainMonitor {
  chain: 'solana' = 'solana';
  private connection: Connection;
  private lastSignatures: Map<string, string> = new Map();

  constructor(config: ChainConfig, wallets: WalletConfig[], pollInterval: number) {
    super(config, wallets, pollInterval);
    
    if (!config.rpcUrl) {
      throw new Error('RPC URL is required for Solana');
    }
    
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  async getBalance(address: string): Promise<string> {
    const publicKey = new PublicKey(address);
    const balance = await this.connection.getBalance(publicKey);
    return (balance / LAMPORTS_PER_SOL).toFixed(6);
  }

  protected async checkTransactions(wallet: WalletConfig): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    
    try {
      const publicKey = new PublicKey(wallet.address);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 10 });
      
      if (signatures.length === 0) return transactions;

      const lastSig = this.lastSignatures.get(wallet.address);
      const newSignatures = lastSig 
        ? signatures.filter(s => s.signature !== lastSig && !s.err)
        : signatures.slice(0, 1).filter(s => !s.err);

      for (const sig of newSignatures) {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          
          if (!tx || !tx.meta) continue;

          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;
          const accountKeys = tx.transaction.message.staticAccountKeys;
          
          const walletIndex = accountKeys.findIndex(
            (key) => key.toString() === wallet.address
          );
          
          if (walletIndex === -1) continue;

          const balanceChange = postBalances[walletIndex] - preBalances[walletIndex];
          const valueInSol = Math.abs(balanceChange) / LAMPORTS_PER_SOL;
          const minValue = wallet.minValue || 0;
          
          if (valueInSol >= minValue) {
            const transaction: Transaction = {
              hash: sig.signature,
              from: balanceChange < 0 ? wallet.address : 'Unknown',
              to: balanceChange > 0 ? wallet.address : 'Unknown',
              value: Math.abs(balanceChange).toString(),
              valueFormatted: `${valueInSol.toFixed(6)} SOL`,
              chain: 'solana',
              timestamp: sig.blockTime || Date.now() / 1000,
              blockNumber: sig.slot,
              type: balanceChange > 0 ? 'incoming' : 'outgoing',
              explorerUrl: `${this.config.explorer}/tx/${sig.signature}`,
            };

            transactions.push(transaction);
            solanaEventEmitter.emit('transaction', { wallet, transaction });
            
            logger.info(`[solana] ${transaction.type} tx: ${transaction.valueFormatted} - ${wallet.label || wallet.address}`);
          }
        } catch (error) {
          logger.error(`Error processing Solana transaction ${sig.signature}:`, error);
        }
      }

      if (signatures.length > 0) {
        this.lastSignatures.set(wallet.address, signatures[0].signature);
      }
    } catch (error) {
      logger.error(`Error checking Solana transactions for ${wallet.address}:`, error);
    }

    return transactions;
  }
}
