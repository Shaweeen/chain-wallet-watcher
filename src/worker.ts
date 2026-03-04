/**
 * Chain Wallet Watcher - Cloudflare Worker
 * 
 * Multi-chain ETH balance monitor with Telegram notifications.
 * Uses native fetch (no Node.js dependencies).
 * 
 * Supported chains: Ethereum, Base, Arbitrum, BSC, Polygon, Optimism
 */

export interface Env {
  BALANCE_STORE: KVNamespace;
  WALLETS: string;           // Comma-separated wallet addresses
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ETH_RPC_URL?: string;
  BASE_RPC_URL?: string;
  ARB_RPC_URL?: string;
  BSC_RPC_URL?: string;
  POLYGON_RPC_URL?: string;
  OP_RPC_URL?: string;
}

interface ChainConfig {
  name: string;
  rpcUrl: string;
  symbol: string;
  decimals: number;
}

interface BalanceResult {
  chain: string;
  symbol: string;
  wallet: string;
  balance: string;
  previous: string | null;
  changed: boolean;
}

function getChains(env: Env): ChainConfig[] {
  const chains: ChainConfig[] = [];

  if (env.ETH_RPC_URL) {
    chains.push({ name: 'Ethereum', rpcUrl: env.ETH_RPC_URL, symbol: 'ETH', decimals: 18 });
  }
  if (env.BASE_RPC_URL) {
    chains.push({ name: 'Base', rpcUrl: env.BASE_RPC_URL, symbol: 'ETH', decimals: 18 });
  }
  if (env.ARB_RPC_URL) {
    chains.push({ name: 'Arbitrum', rpcUrl: env.ARB_RPC_URL, symbol: 'ETH', decimals: 18 });
  }
  if (env.BSC_RPC_URL) {
    chains.push({ name: 'BSC', rpcUrl: env.BSC_RPC_URL, symbol: 'BNB', decimals: 18 });
  }
  if (env.POLYGON_RPC_URL) {
    chains.push({ name: 'Polygon', rpcUrl: env.POLYGON_RPC_URL, symbol: 'MATIC', decimals: 18 });
  }
  if (env.OP_RPC_URL) {
    chains.push({ name: 'Optimism', rpcUrl: env.OP_RPC_URL, symbol: 'ETH', decimals: 18 });
  }

  return chains;
}

async function getBalance(rpcUrl: string, wallet: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [wallet, 'latest'],
    }),
  });

  const data = await response.json() as { result?: string; error?: { message: string } };

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result || '0x0';
}

function hexToEther(hex: string, decimals: number = 18): string {
  const wei = BigInt(hex);
  const divisor = BigInt(10 ** decimals);
  const whole = wei / divisor;
  const remainder = wei % divisor;
  const fractional = remainder.toString().padStart(decimals, '0').slice(0, 6);
  return `${whole}.${fractional}`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function sendTelegram(token: string, chatId: string, message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

async function checkBalances(env: Env): Promise<BalanceResult[]> {
  const wallets = env.WALLETS.split(',').map((w) => w.trim()).filter(Boolean);
  const chains = getChains(env);
  const results: BalanceResult[] = [];

  for (const wallet of wallets) {
    for (const chain of chains) {
      try {
        const hexBalance = await getBalance(chain.rpcUrl, wallet);
        const balance = hexToEther(hexBalance, chain.decimals);
        const kvKey = `${chain.name}:${wallet}`;
        const previous = await env.BALANCE_STORE.get(kvKey);

        const changed = previous !== null && previous !== balance;

        results.push({
          chain: chain.name,
          symbol: chain.symbol,
          wallet,
          balance,
          previous,
          changed,
        });

        // Store current balance
        await env.BALANCE_STORE.put(kvKey, balance);
      } catch (error) {
        console.error(`Error checking ${chain.name} balance for ${wallet}:`, error);
      }
    }
  }

  return results;
}

function buildNotification(results: BalanceResult[]): string | null {
  const changedResults = results.filter((r) => r.changed);

  if (changedResults.length === 0) {
    return null;
  }

  const lines = ['\u{1F4B0} <b>Wallet Balance Changes Detected</b>\n'];

  for (const r of changedResults) {
    const arrow = parseFloat(r.balance) > parseFloat(r.previous!) ? '\u{2B06}\u{FE0F}' : '\u{2B07}\u{FE0F}';
    lines.push(
      `${arrow} <b>${r.chain}</b> | ${shortenAddress(r.wallet)}` +
      `\n   ${r.previous} \u2192 ${r.balance} ${r.symbol}\n`
    );
  }

  lines.push(`\u{23F0} ${new Date().toISOString()}`);

  return lines.join('\n');
}

function buildStatusReport(results: BalanceResult[]): string {
  const lines = ['\u{1F4CA} <b>Wallet Balance Report</b>\n'];

  const byWallet = new Map<string, BalanceResult[]>();
  for (const r of results) {
    const arr = byWallet.get(r.wallet) || [];
    arr.push(r);
    byWallet.set(r.wallet, arr);
  }

  for (const [wallet, balances] of byWallet) {
    lines.push(`\u{1F4DD} <b>${shortenAddress(wallet)}</b>`);
    for (const b of balances) {
      lines.push(`   ${b.chain}: ${b.balance} ${b.symbol}`);
    }
    lines.push('');
  }

  lines.push(`\u{23F0} ${new Date().toISOString()}`);

  return lines.join('\n');
}

export default {
  // Scheduled trigger (every 5 minutes via cron)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered at:', new Date(event.scheduledTime).toISOString());

    const results = await checkBalances(env);

    const notification = buildNotification(results);
    if (notification) {
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, notification);
    }
  },

  // HTTP handler for manual checks
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/check') {
      const results = await checkBalances(env);

      const notification = buildNotification(results);
      if (notification) {
        await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, notification);
      }

      return new Response(JSON.stringify({ results, notified: !!notification }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/report') {
      const results = await checkBalances(env);
      const report = buildStatusReport(results);
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, report);

      return new Response(JSON.stringify({ results, report: 'sent' }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      name: 'Chain Wallet Watcher',
      version: '2.0.0',
      endpoints: ['/check', '/report'],
      status: 'running',
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
