export interface Env {
  RPC_URL: string;
  WALLET_ADDRESS: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  THRESHOLD_ETH: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleSchedule(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    await handleSchedule(env);
    return new Response("Worker is running");
  },
};

async function handleSchedule(env: Env) {
  try {
    const balanceWei = await getBalance(env.RPC_URL, env.WALLET_ADDRESS);
    const balanceEth = Number(balanceWei) / 1e18;
    const threshold = Number(env.THRESHOLD_ETH) || 0.1;

    console.log(`Wallet ${env.WALLET_ADDRESS} balance: ${balanceEth} ETH (Threshold: ${threshold} ETH)`);

    if (balanceEth < threshold) {
      await sendTelegramNotification(
        env.TELEGRAM_BOT_TOKEN,
        env.TELEGRAM_CHAT_ID,
        `â ï¸ ä½é¢ä¸è¶³è­¦æ¥\n\né±å: ${env.WALLET_ADDRESS}\nå½åä½é¢: ${balanceEth.toFixed(4)} ETH\néå¼: ${threshold} ETH`
      );
    }
  } catch (error) {
    console.error("Error in worker:", error);
  }
}

async function getBalance(rpcUrl: string, address: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"],
      id: 1,
    }),
  });

  const data: any = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result; // Hex string
}

async function sendTelegramNotification(token: string, chatId: string, message: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
}
