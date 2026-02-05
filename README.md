# Crypto Balance Monitor

A Cloudflare Worker that monitors cryptocurrency wallet balances across multiple chains and sends notifications via Telegram when balances change.

## Features

- Multi-chain support (Ethereum, Base, Arbitrum, Optimism, Polygon, BSC, Avalanche, Fantom)
- Multiple wallet addresses per chain (comma-separated)
- Scheduled balance checks via Cloudflare Cron Triggers
- Telegram notifications for balance changes
- Persistent balance tracking using Cloudflare KV
- TypeScript for type safety

## Setup

### Prerequisites

- Node.js and npm installed
- Cloudflare account with Workers enabled
- Telegram Bot Token (create via [@BotFather](https://t.me/botfather))
- Telegram Chat ID (get from [@userinfobot](https://t.me/userinfobot))
- RPC endpoints for supported chains (e.g., Infura, Alchemy, or public RPCs)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crypto-balance-monitor
```

2. Install dependencies:
```bash
npm install
```

3. Create a KV namespace:
```bash
npx wrangler kv:namespace create BALANCE_STORE
```

4. Update `wrangler.toml` with your KV namespace ID:
```toml
[[kv_namespaces]]
binding = "BALANCE_STORE"
id = "your-namespace-id-here"
```

### Configuration

Set up environment variables in your Cloudflare Worker settings or via `wrangler secret put`:

#### Required Variables

```bash
# Telegram Configuration
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID

# Wallet Addresses (comma-separated for multiple addresses per chain)
wrangler secret put ETH_WALLET
wrangler secret put BASE_WALLET
wrangler secret put ARB_WALLET
wrangler secret put OP_WALLET
wrangler secret put MATIC_WALLET
wrangler secret put BSC_WALLET
wrangler secret put AVAX_WALLET
wrangler secret put FTM_WALLET

# RPC Endpoints
wrangler secret put ETH_RPC
wrangler secret put BASE_RPC
wrangler secret put ARB_RPC
wrangler secret put OP_RPC
wrangler secret put MATIC_RPC
wrangler secret put BSC_RPC
wrangler secret put AVAX_RPC
wrangler secret put FTM_RPC
```

#### Multiple Wallet Addresses Example

You can monitor multiple wallet addresses per chain by providing comma-separated values:

```bash
# Single address
wrangler secret put ETH_WALLET
# Enter: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Multiple addresses (comma-separated, no spaces)
wrangler secret put ETH_WALLET
# Enter: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,0x123456789abcdef123456789abcdef123456789a,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

The worker will monitor all provided addresses and report balances individually in Telegram notifications.

#### Supported Chains

| Chain | Wallet Variable | RPC Variable | Native Token |
|-------|----------------|--------------|-------------|
| Ethereum | `ETH_WALLET` | `ETH_RPC` | ETH |
| Base | `BASE_WALLET` | `BASE_RPC` | ETH |
| Arbitrum | `ARB_WALLET` | `ARB_RPC` | ETH |
| Optimism | `OP_WALLET` | `OP_RPC` | ETH |
| Polygon | `MATIC_WALLET` | `MATIC_RPC` | MATIC |
| BSC | `BSC_WALLET` | `BSC_RPC` | BNB |
| Avalanche | `AVAX_WALLET` | `AVAX_RPC` | AVAX |
| Fantom | `FTM_WALLET` | `FTM_RPC` | FTM |

### Deployment

1. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

2. The worker will automatically run on the schedule defined in `wrangler.toml` (default: every 10 minutes).

## Usage

### Manual Trigger

You can manually trigger a balance check by making a GET request to your worker URL:

```bash
curl https://your-worker.your-subdomain.workers.dev
```

### Scheduled Checks

The worker runs automatically based on the cron schedule in `wrangler.toml`:

```toml
[triggers]
crons = ["*/10 * * * *"]  # Every 10 minutes
```

Modify this to change the check frequency.

## How It Works

1. **Balance Retrieval**: The worker queries RPC endpoints for each configured chain and wallet address
2. **Change Detection**: Current balances are compared with previously stored balances in Cloudflare KV
3. **Notification**: If any balance changes are detected, a Telegram message is sent with details
4. **Storage Update**: New balances are stored in KV for future comparisons

## Telegram Notifications

Notifications include:
- Chain name
- Wallet address (truncated for readability)
- Previous balance
- Current balance
- Change amount (with emoji indicators)
- Timestamp

Example:
```
ð Balance Update

ð° Ethereum
Wallet: 0x742d...0bEb
Previous: 1.5000 ETH
Current: 1.5234 ETH
Change: +0.0234 ETH â¬ï¸

Wallet: 0x1234...789a
Previous: 0.5000 ETH
Current: 0.4800 ETH
Change: -0.0200 ETH â¬ï¸

â° 2024-01-15 10:30:00 UTC
```

## Development

### Local Development

```bash
npm run dev
```

### Testing

```bash
npm test
```

## Troubleshooting

### No notifications received
- Verify Telegram bot token and chat ID are correct
- Check that environment variables are properly set
- Ensure RPC endpoints are accessible and responding
- Check Cloudflare Workers logs for errors

### Balance not updating
- Verify wallet addresses are valid for their respective chains
- Check RPC endpoint rate limits
- Ensure KV namespace is properly bound

## Security Considerations

- Never commit secrets or private keys to version control
- Use Cloudflare's secret management for sensitive values
- RPC endpoints may expose your IP; consider using authenticated endpoints
- Monitor your Cloudflare Workers usage to avoid unexpected costs

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.