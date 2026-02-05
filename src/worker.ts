import { ethers } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface Env {
  ETH_WALLET: string;
  ETH_RPC: string;
  BSC_WALLET: string;
  BSC_RPC: string;
  BASE_WALLET: string;
  BASE_RPC: string;
  ARB_WALLET: string;
  ARB_RPC: string;
  SOL_WALLET: string;
  SOL_RPC: string;
  BTC_WALLET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface TokenConfig {
  [chain: string]: {
    symbol: string;
    rpc: string;
    tokens: {
      [tokenSymbol: string]: {
        address: string;
        decimals: number;
      };
    };
  };
}

const TOKEN_CONFIG: TokenConfig = {
  ethereum: {
    symbol: 'ETH',
    rpc: 'https://eth.llamarpc.com',
    tokens: {
      USDC: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
      },
      USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
      },
    },
  },
  bsc: {
    symbol: 'BNB',
    rpc: 'https://bsc-dataseed.binance.org',
    tokens: {
      USDC: {
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        decimals: 18,
      },
      USDT: {
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
      },
    },
  },
  base: {
    symbol: 'ETH',
    rpc: 'https://mainnet.base.org',
    tokens: {
      USDC: {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
      },
      USDT: {
        address: '0xfde4C962512795Fe91e7ee0aF254B29311A608e8',
        decimals: 6,
      },
    },
  },
  arbitrum: {
    symbol: 'ETH',
    rpc: 'https://arb1.arbitrum.io/rpc',
    tokens: {
      USDC: {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
      },
      USDT: {
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6,
      },
    },
  },
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

async function checkEVMBalances(
  wallet: string,
  rpcUrl: string,
  chain: string,
  env: Env
): Promise<string[]> {
  const messages: string[] = [];
  const config = TOKEN_CONFIG[chain];

  if (!config) {
    return [`❌ Unknown chain: ${chain}`];
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const nativeBalance = await provider.getBalance(wallet);
    const nativeFormatted = ethers.formatEther(nativeBalance);
    messages.push(
      `${chain.toUpperCase()} ${config.symbol}: ${parseFloat(nativeFormatted).toFixed(4)}`
    );

    for (const [tokenSymbol, tokenData] of Object.entries(config.tokens)) {
      try {
        const contract = new ethers.Contract(
          tokenData.address,
          ERC20_ABI,
          provider
        );
        const balance = await contract.balanceOf(wallet);
        const formatted = ethers.formatUnits(balance, tokenData.decimals);
        messages.push(
          `${chain.toUpperCase()} ${tokenSymbol}: ${parseFloat(formatted).toFixed(2)}`
        );
      } catch (error) {
        messages.push(
          `${chain.toUpperCase()} ${tokenSymbol}: Error - ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    messages.push(
      `${chain.toUpperCase()} native balance error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return messages;
}

async function checkSolanaBalance(
  wallet: string,
  rpcUrl: string
): Promise<string[]> {
  const messages: string[] = [];

  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const publicKey = new PublicKey(wallet);

    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    messages.push(`SOLANA SOL: ${solBalance.toFixed(4)}`);

    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const usdcMint = new PublicKey(USDC_MINT);

    const TOKEN_PROGRAM_ID = new PublicKey(
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: usdcMint }
    );

    if (tokenAccounts.value.length > 0) {
      const usdcBalance =
        tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      messages.push(`SOLANA USDC: ${usdcBalance.toFixed(2)}`);
    } else {
      messages.push(`SOLANA USDC: 0.00`);
    }
  } catch (error) {
    messages.push(
      `SOLANA error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return messages;
}

async function checkBitcoinBalance(address: string): Promise<string[]> {
  const messages: string[] = [];

  try {
    const response = await fetch(
      `https://blockchain.info/q/addressbalance/${address}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const satoshis = await response.text();
    const btc = parseInt(satoshis) / 100000000;
    messages.push(`BITCOIN BTC: ${btc.toFixed(8)}`);
  } catch (error) {
    messages.push(
      `BITCOIN error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return messages;
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
  }
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await handleScheduled(env);
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method === 'GET' && new URL(request.url).pathname === '/check') {
      try {
        await handleScheduled(env);
        return new Response('Balance check triggered successfully', {
          status: 200,
        });
      } catch (error) {
        return new Response(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
          { status: 500 }
        );
      }
    }

    return new Response('Crypto Balance Monitor Worker', { status: 200 });
  },
};

async function handleScheduled(env: Env): Promise<void> {
  const allMessages: string[] = [];

  const ethMessages = await checkEVMBalances(
    env.ETH_WALLET,
    env.ETH_RPC,
    'ethereum',
    env
  );
  allMessages.push(...ethMessages);

  const bscMessages = await checkEVMBalances(
    env.BSC_WALLET,
    env.BSC_RPC,
    'bsc',
    env
  );
  allMessages.push(...bscMessages);

  const baseMessages = await checkEVMBalances(
    env.BASE_WALLET,
    env.BASE_RPC,
    'base',
    env
  );
  allMessages.push(...baseMessages);

  const arbMessages = await checkEVMBalances(
    env.ARB_WALLET,
    env.ARB_RPC,
    'arbitrum',
    env
  );
  allMessages.push(...arbMessages);

  const solMessages = await checkSolanaBalance(env.SOL_WALLET, env.SOL_RPC);
  allMessages.push(...solMessages);

  const btcMessages = await checkBitcoinBalance(env.BTC_WALLET);
  allMessages.push(...btcMessages);

  const finalMessage = `<b>💰 Crypto Balance Report</b>\n\n${allMessages.join('\n')}`;

  await sendTelegramMessage(
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHAT_ID,
    finalMessage
  );
}
