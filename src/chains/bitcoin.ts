import axios from 'axios';
import { BaseChainMonitor } from './base';
import { ChainConfig, WalletConfig, Transaction } from '../types';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export const bitcoinEventEmitter = new EventEmitter();

interface BlockstreamTx {
  txid: string;
  status: {
    confirmed: boolean;
    block_height: number;
    block_time: number;
  };
  vin: Array<{
    prevout: {
      scriptpubkey_address: string;
      value: number;
    };
  }>;
  vout: Array<{
    scriptpubkey_address: string;
    value: number;
  }>;
}

export class BitcoinMonitor extends BaseChainMonitor {
  chain: 'bitcoin' = 'bitcoin';
  private apiUrl: string;
  private lastTxIds: Map<string, Set<string>> = new Map();
  private readonly SATOSHI = 100_000_000;

  constructor(config: ChainConfig, wallets: WalletConfig[], pollInterval: number) {
    super(config, wallets, pollInterval);
    
    if (!config.apiUrl) {
      throw new Error('API URL is required for Bitcoin');
    }
    
    this.apiUrl = config.apiUrl;
  }

  async getBalance(address: string): Promise<string> {
    try {
      const response = await axios.get(`${this.apiUrl}/address/${address}`);
      const { chain_stats, mempool_stats } = response.data;
      const confirmedBalance = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum;
      const unconfirmedBalance = mempool_stats.funded_txo_sum - mempool_stats.spent_txo_sum;
      const totalSatoshi = confirmedBalance + unconfirmedBalance;
      return (totalSatoshi / this.SATOSHI).toFixed(8);
    } catch (error) {
      logger.error(`Error getting Bitcoin balance for ${address}:`, error);
      return '0';
    }
  }

  protected async checkTransactions(wallet: WalletConfig): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    
    try {
      const response = await axios.get<BlockstreamTx[]>(
        `${this.apiUrl}/address/${wallet.address}/txs`
      );
      
      const txs = response.data.slice(0, 10);
      
      if (!this.lastTxIds.has(wallet.address)) {
        this.lastTxIds.set(wallet.address, new Set(txs.map(tx => tx.txid)));
        return transactions;
      }

      const knownTxIds = this.lastTxIds.get(wallet.address)!;
      const newTxs = txs.filter(tx => !knownTxIds.has(tx.txid));

      for (const tx of newTxs) {
        // Calculate value change for this wallet
        let valueIn = 0;
        let valueOut = 0;

        for (const vin of tx.vin) {
          if (vin.prevout?.scriptpubkey_address === wallet.address) {
            valueIn += vin.prevout.value;
          }
        }

        for (const vout of tx.vout) {
          if (vout.scriptpubkey_address === wallet.address) {
            valueOut += vout.value;
          }
        }

        const netChange = valueOut - valueIn;
        const valueInBtc = Math.abs(netChange) / this.SATOSHI;
        const minValue = wallet.minValue || 0;

        if (valueInBtc >= minValue) {
          const transaction: Transaction = {
            hash: tx.txid,
            from: netChange < 0 ? wallet.address : 'Multiple',
            to: netChange > 0 ? wallet.address : 'Multiple',
            value: Math.abs(netChange).toString(),
            valueFormatted: `${valueInBtc.toFixed(8)} BTC`,
            chain: 'bitcoin',
            timestamp: tx.status.block_time || Date.now() / 1000,
            blockNumber: tx.status.block_height || 0,
            type: netChange > 0 ? 'incoming' : 'outgoing',
            explorerUrl: `${this.config.explorer}/tx/${tx.txid}`,
          };

          transactions.push(transaction);
          bitcoinEventEmitter.emit('transaction', { wallet, transaction });
          
          logger.info(`[bitcoin] ${transaction.type} tx: ${transaction.valueFormatted} - ${wallet.label || wallet.address}`);
        }

        knownTxIds.add(tx.txid);
      }
    } catch (error) {
      logger.error(`Error checking Bitcoin transactions for ${wallet.address}:`, error);
    }

    return transactions;
  }
}
