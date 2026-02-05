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

  const data: any = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  const hexBalance = data.result;
  const wei = BigInt(hexBalance);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
}

export default {
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    console.log('Starting scheduled balance check...');

    for (const chain of CHAINS) {
      const walletsStr = env[chain.walletKey] as string | undefined;
      const rpcUrl = env[chain.rpcKey] as string | undefined;

      if (!walletsStr || !rpcUrl) continue;

      const wallets = walletsStr.split(',').map(addr => addr.trim()).filter(addr => addr);

      for (const address of wallets) {
        try {
          const currentBalance = await getBalance(rpcUrl, address);
          const kvKey = `balance_${chain.name}_${address}`;
          const previousBalance = await env.BALANCE_STORE.get(kvKey);

          if (previousBalance !== null && previousBalance !== currentBalance) {
            const diff = (parseFloat(currentBalance) - parseFloat(previousBalance)).toFixed(6);
            const action = parseFloat(diff) > 0 ? 'Received' : 'Sent';
            
            const message = `<b>Balance Change Detected!</b>\n\n` +
              `<b>Chain:</b> ${chain.name}\n` +
              `<b>Address:</b> <code>${address}</code>\n` +
              `<b>Action:</b> ${action}\n` +
              `<b>Change:</b> ${diff} ${chain.symbol}\n` +
              `<b>New Balance:</b> ${currentBalance} ${chain.symbol}`;

            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, message);
          }

          await env.BALANCE_STORE.put(kvKey, currentBalance);
        } catch (error) {
          console.error(`Error checking ${chain.name} balance for ${address}:`, error);
        }
      }
    }
  },

  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    return new Response('Chain Wallet Watcher is running. Use Scheduled Events for monitoring.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};