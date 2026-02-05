interface Env {
  BALANCE_STORE: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ETH_WALLET?: string;
  BASE_WALLET?: string;
  ARB_WALLET?: string;
  OP_WALLET?: string;
  MATIC_WALLET?: string;
  BSC_WALLET?: string;
  AVAX_WALLET?: string;
  FTM_WALLET?: string;
  ETH_RPC?: string;
  BASE_RPC?: string;
  ARB_RPC?: string;
  OP_RPC?: string;
  MATIC_RPC?: string;
  BSC_RPC?: string;
  AVAX_RPC?: string;
  FTM_RPC?: string;
}

interface ChainConfig {
  name: string;
  walletKey: keyof Env;
  rpcKey: keyof Env;
  symbol: string;
}

interface BalanceChange {
  chain: string;
  address: string;
  previousBalance: string;
  currentBalance: string;
  change: string;
  symbol: string;
}

const CHAINS: ChainConfig[] = [
  { name: 'Ethereum', walletKey: 'ETH_WALLET', rpcKey: 'ETH_RPC', symbol: 'ETH' },
  { name: 'Base', walletKey: 'BASE_WALLET', rpcKey: 'BASE_RPC', symbol: 'ETH' },
  { name: 'Arbitrum', walletKey: 'ARB_WALLET', rpcKey: 'ARB_RPC', symbol: 'ETH' },
  { name: 'Optimism', walletKey: 'OP_WALLET', rpcKey: 'OP_RPC', symbol: 'ETH' },
  { name: 'Polygon', walletKey: 'MATIC_WALLET', rpcKey: 'MATIC_RPC', symbol: 'MATIC' },
  { name: 'BSC', walletKey: 'BSC_WALLET', rpcKey: 'BSC_RPC', symbol: 'BNB' },
  { name: 'Avalanche', walletKey: 'AVAX_WALLET', rpcKey: 'AVAX_RPC', symbol: 'AVAX' },
  { name: 'Fantom', walletKey: 'FTM_WALLET', rpcKey: 'FTM_RPC', symbol: 'FTM' },
];

async function getBalance(rpcUrl: string, address: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    }),
  });

  const data = await response.json() as { result?: string; error?: unknown };
  if (!data.result) {
    throw new Error(`Failed to get balance: ${JSON.stringify(data.error)}`);
  }

  const balanceWei = BigInt(data.result);
  const balanceEther = Number(balanceWei) / 1e18;
  return balanceEther.toFixed(4);
}

function parseAddresses(addressString: string | undefined): string[] {
  if (!addressString) return [];
  return addressString.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0);
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

function formatBalanceChange(change: BalanceChange): string {
  const changeNum = parseFloat(change.change);
  const emoji = changeNum > 0 ? 'â¬ï¸' : changeNum < 0 ? 'â¬ï¸' : 'â¡ï¸';
  const sign = changeNum > 0 ? '+' : '';
  const truncatedAddress = `${change.address.slice(0, 6)}...${change.address.slice(-4)}`;
  
  return `Wallet: ${truncatedAddress}\nPrevious: ${change.previousBalance} ${change.symbol}\nCurrent: ${change.currentBalance} ${change.symbol}\nChange: ${sign}${change.change} ${change.symbol} ${emoji}`;
}

async function checkBalances(env: Env): Promise<void> {
  const changes: BalanceChange[] = [];

  for (const chain of CHAINS) {
    const addressString = env[chain.walletKey] as string | undefined;
    const rpcUrl = env[chain.rpcKey] as string | undefined;

    if (!addressString || !rpcUrl) continue;

    const addresses = parseAddresses(addressString);

    for (const address of addresses) {
      try {
        const currentBalance = await getBalance(rpcUrl, address);
        const storageKey = `${chain.name}:${address}`;
        const previousBalance = await env.BALANCE_STORE.get(storageKey);

        if (previousBalance && previousBalance !== currentBalance) {
          const change = (parseFloat(currentBalance) - parseFloat(previousBalance)).toFixed(4);
          changes.push({
            chain: chain.name,
            address,
            previousBalance,
            currentBalance,
            change,
            symbol: chain.symbol,
          });
        }

        await env.BALANCE_STORE.put(storageKey, currentBalance);
      } catch (error) {
        console.error(`Error checking balance for ${chain.name} (${address}):`, error);
      }
    }
  }

  if (changes.length > 0) {
    const groupedChanges = changes.reduce((acc, change) => {
      if (!acc[change.chain]) acc[change.chain] = [];
      acc[change.chain].push(change);
      return acc;
    }, {} as Record<string, BalanceChange[]>);

    let message = 'ð <b>Balance Update</b>\n\n';
    
    for (const [chain, chainChanges] of Object.entries(groupedChanges)) {
      message += `ð° <b>${chain}</b>\n`;
      for (const change of chainChanges) {
        message += formatBalanceChange(change) + '\n\n';
      }
    }

    message += `â° ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`;

    await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, message);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      await checkBalances(env);
      return new Response('Balance check completed', { status: 200 });
    } catch (error) {
      console.error('Error:', error);
      return new Response(`Error: ${error}`, { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await checkBalances(env);
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};