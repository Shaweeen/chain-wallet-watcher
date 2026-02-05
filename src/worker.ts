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
    throw new Error(`Failed to get balance from ${rpcUrl}`);
  }
  return data.result;
}

function hexToEth(hex: string): string {
  const wei = BigInt(hex);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

async function sendTelegramMessage(token: string, chatId: string, message: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const results: BalanceChange[] = [];
    
    // 调试信息：检查配置状态
    const configStatus: any = {};
    
    for (const chain of CHAINS) {
      const walletStr = env[chain.walletKey] as string | undefined;
      const rpcUrl = env[chain.rpcKey] as string | undefined;
      
      const wallets = walletStr ? walletStr.split(',').map(w => w.trim()).filter(w => w.length > 0) : [];
      const hasRpc = !!rpcUrl;
      
      configStatus[chain.name] = {
        configured_wallets: wallets.length,
        has_rpc: hasRpc,
        wallet_preview: walletStr ? (walletStr.length > 10 ? walletStr.substring(0, 10) + '...' : walletStr) : 'not_set'
      };

      if (wallets.length > 0 && rpcUrl) {
        for (const address of wallets) {
          try {
            // 宽松校验：只要是字符串就尝试，报错会捕获
            if (!address.startsWith('0x')) {
              continue;
            }

            const currentBalanceHex = await getBalance(rpcUrl, address);
            const currentBalance = hexToEth(currentBalanceHex);

            const kvKey = `balance_${chain.name}_${address}`;
            const previousBalance = await env.BALANCE_STORE.get(kvKey) || '0';

            if (currentBalance !== previousBalance) {
              const diff = (Number(currentBalance) - Number(previousBalance)).toFixed(4);
              const changeStr = Number(diff) > 0 ? `+${diff}` : diff;

              results.push({
                chain: chain.name,
                address,
                previousBalance,
                currentBalance,
                change: changeStr,
                symbol: chain.symbol,
              });

              await env.BALANCE_STORE.put(kvKey, currentBalance);
            }
          } catch (error) {
            console.error(`Error checking ${chain.name} for ${address}: ${error}`);
          }
        }
      }
    }

    if (results.length > 0) {
      const message = results
        .map(
          (r) =>
            `<b>${r.chain} Balance Change</b>\n` +
            `Wallet: <code>${r.address}</code>\n` +
            `Change: <b>${r.change} ${r.symbol}</b>\n` +
            `New Balance: ${r.currentBalance} ${r.symbol}`
        )
        .join('\n\n');

      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, message);
    }
    
    if (url.searchParams.has('test_tg')) {
       await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, '🔔 <b>Chain Wallet Watcher Test</b>\nTelegram notification is working correctly!');
       return new Response(JSON.stringify({ status: 'ok', message: 'Test Telegram message sent' }), {
         headers: { 'Content-Type': 'application/json' },
       });
    }

    return new Response(JSON.stringify({ 
      status: 'ok', 
      results,
      config: configStatus,
      debug: {
        note: "Use ?test_tg=1 to test Telegram",
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(this.fetch(new Request('http://localhost/scheduled'), env));
  },
};