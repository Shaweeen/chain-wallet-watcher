# Chain Wallet Watcher

[English](#english) | [ä¸­æ](#ä¸­æ)

---

## English

### Introduction

Chain Wallet Watcher is a powerful multi-chain wallet monitoring tool designed to track cryptocurrency transactions across multiple blockchain networks in real-time. Built for deployment on Cloudflare Workers, this lightweight solution provides instant Telegram notifications whenever monitored wallets experience balance changes or transactions.

**Key Features:**
- ð Multi-chain support: Ethereum, BSC, Base, Arbitrum, Solana, and Bitcoin
- â¡ Real-time transaction monitoring
- ð± Instant Telegram notifications
- âï¸ Serverless deployment via Cloudflare Workers
- ð§ Easy configuration with environment variables
- ð° Support for major tokens: ETH, BNB, SOL, BTC, USDC, USDT

### Supported Chains and Tokens

| Chain | Native Token | Supported Tokens |
|-------|--------------|------------------|
| **Ethereum** | ETH | ETH, USDC, USDT |
| **BSC (Binance Smart Chain)** | BNB | BNB, USDC, USDT |
| **Base** | ETH | ETH, USDC, USDT |
| **Arbitrum** | ETH | ETH, USDC, USDT |
| **Solana** | SOL | SOL, USDC |
| **Bitcoin** | BTC | BTC |

### Deployment Guide (Cloudflare Workers)

#### Step 1: Fork or Clone Repository

```bash
git clone https://github.com/yourusername/chain-wallet-watcher.git
cd chain-wallet-watcher
```

Or fork the repository directly on GitHub.

#### Step 2: Connect to Cloudflare Pages/Workers

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Create Application** â **Workers**
4. Upload your project files or connect your GitHub repository
5. Follow the prompts to complete the initial setup

#### Step 3: Configure Environment Variables

In your Cloudflare Worker settings, navigate to **Settings** â **Variables** and add the following:

**Mandatory Variables:**

- `TELEGRAM_BOT_TOKEN` - Your Telegram Bot token obtained from [@BotFather](https://t.me/BotFather)
- `TELEGRAM_CHAT_ID` - Your Telegram user ID or group chat ID
- `CONFIG` - YAML configuration content for wallet monitoring (see Configuration section)

**Optional Variables (with fallback defaults):**

- `RPC_URLS_ETH` - Ethereum RPC endpoints (comma-separated)
- `RPC_URLS_BSC` - BSC RPC endpoints (comma-separated)
- `RPC_URLS_BASE` - Base RPC endpoints (comma-separated)
- `RPC_URLS_ARBITRUM` - Arbitrum RPC endpoints (comma-separated)
- `RPC_URLS_SOLANA` - Solana RPC endpoints (comma-separated)
- `BTC_API_URL` - Bitcoin API endpoint (default: public API)

**Example Configuration:**

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
RPC_URLS_ETH=https://eth-mainnet.g.alchemy.com/v2/your-api-key,https://rpc.ankr.com/eth
RPC_URLS_BSC=https://bsc-dataseed1.binance.org,https://bsc-dataseed2.binance.org
CONFIG=<your-yaml-config-content>
```

#### Step 4: Verification

1. Deploy your Worker
2. Trigger the monitoring function (via cron trigger or manual invocation)
3. Check your Telegram chat for test notifications
4. Monitor the Worker logs in Cloudflare Dashboard for any errors

### Environment Variables Configuration

#### Mandatory Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token obtained from [@BotFather](https://t.me/BotFather) | `1234567890:ABCdefGHI...` |
| `TELEGRAM_CHAT_ID` | Your personal chat ID or group chat ID | `123456789` |
| `CONFIG` | YAML configuration with wallet addresses and monitoring rules | See example below |

#### Optional Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `RPC_URLS_ETH` | Ethereum RPC URLs (comma-separated) | Public RPC endpoints |
| `RPC_URLS_BSC` | BSC RPC URLs (comma-separated) | Public RPC endpoints |
| `RPC_URLS_BASE` | Base RPC URLs (comma-separated) | Public RPC endpoints |
| `RPC_URLS_ARBITRUM` | Arbitrum RPC URLs (comma-separated) | Public RPC endpoints |
| `RPC_URLS_SOLANA` | Solana RPC URLs (comma-separated) | Public RPC endpoints |
| `BTC_API_URL` | Bitcoin blockchain API endpoint | Public blockchain API |

**CONFIG Example (YAML format):**

```yaml
wallets:
  - address: "0x1234567890abcdef1234567890abcdef12345678"
    chains:
      - ethereum
      - bsc
    tokens:
      - ETH
      - USDC
      - USDT
  - address: "YourSolanaWalletAddress"
    chains:
      - solana
    tokens:
      - SOL
      - USDC
```

### Precautions

#### RPC Node Limits and Recommendations

- **Free RPC nodes** often have rate limits (typically 25-100 requests per second)
- **Recommendation:** Use dedicated RPC providers like Alchemy, Infura, QuickNode, or Ankr for production
- Configure multiple RPC endpoints for failover redundancy
- Monitor your RPC usage to avoid hitting rate limits

#### API Rate Limits

- Cloudflare Workers free tier: 100,000 requests per day
- Telegram Bot API: 30 messages per second per bot
- Consider implementing request throttling for high-frequency monitoring
- Use caching mechanisms to reduce redundant API calls

#### Token Contract Address Accuracy

- Always verify token contract addresses from official sources
- Common token addresses:
  - USDC (Ethereum): `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
  - USDT (Ethereum): `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - USDC (BSC): `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`
- Incorrect addresses will result in failed balance queries

#### Telegram Bot Permission Settings

- Ensure your bot has permission to send messages to the specified chat
- For group chats, add the bot as a member and grant appropriate permissions
- Test with `/start` command before full deployment
- Keep your bot token secure and never commit it to public repositories

### Known Issues and Potential Bugs

#### 1. RPC Instability Leading to Query Failures

**Issue:** Public RPC nodes may experience downtime or rate limiting, causing transaction queries to fail.

**Workaround:** 
- Configure multiple RPC endpoints for redundancy
- Implement retry logic with exponential backoff
- Consider using paid RPC services for critical monitoring

#### 2. Free RPC Request Limits

**Issue:** Free tier RPC providers impose strict rate limits that may be exceeded during high-frequency monitoring.

**Workaround:**
- Increase monitoring intervals
- Distribute requests across multiple RPC providers
- Upgrade to paid RPC plans for higher limits

#### 3. Solana RPC Reliability

**Issue:** Solana's public RPC endpoints are often overloaded and may require paid nodes for reliable service.

**Workaround:**
- Use dedicated Solana RPC providers (Helius, QuickNode, Triton)
- Implement aggressive retry mechanisms
- Monitor Solana network status before querying

#### 4. Bitcoin API Dependency on Third-Party Services

**Issue:** Bitcoin monitoring relies on third-party blockchain explorers (Blockchain.info, BlockCypher) which may have availability issues.

**Workaround:**
- Configure multiple Bitcoin API endpoints
- Implement fallback to alternative providers
- Consider running your own Bitcoin node for critical applications

#### 5. Delay in Large Transaction Detection

**Issue:** During network congestion or with slow RPC responses, large transactions may be detected with a delay.

**Workaround:**
- Optimize polling intervals based on network conditions
- Use WebSocket connections where available for real-time updates
- Implement priority queuing for high-value wallets

### FAQ

**Q: How do I get my Telegram Chat ID?**

A: Start a chat with [@userinfobot](https://t.me/userinfobot) on Telegram, and it will send you your chat ID.

**Q: Can I monitor multiple wallets simultaneously?**

A: Yes, you can add multiple wallet addresses in your CONFIG YAML file.

**Q: What is the monitoring frequency?**

A: The monitoring frequency depends on your Cloudflare Workers cron trigger configuration. Recommended: every 1-5 minutes.

**Q: Are there any costs involved?**

A: Cloudflare Workers free tier covers most use cases. You may incur costs for premium RPC providers or if you exceed Cloudflare's free tier limits.

**Q: Can I monitor NFTs or other token types?**

A: Currently, the tool focuses on native tokens and major stablecoins. NFT support may be added in future versions.

**Q: How secure is my wallet information?**

A: The tool only monitors public blockchain data using wallet addresses. It never requires or accesses private keys. However, keep your Telegram bot token secure.

**Q: What happens if a transaction fails to be detected?**

A: Implement retry logic and use multiple RPC endpoints. Check Worker logs for error details.

**Q: Can I customize notification formats?**

A: Yes, you can modify the notification templates in the source code to customize message formats.

### License

MIT License - see LICENSE file for details.

### Contributing

Contributions are welcome! Please submit pull requests or open issues for bugs and feature requests.

### Support

For questions and support, please open an issue on GitHub or join our community discussions.

---

## ä¸­æ

### é¡¹ç®ä»ç»

Chain Wallet Watcher æ¯ä¸æ¬¾åè½å¼ºå¤§çå¤é¾é±åçæ§å·¥å·,æ¨å¨å®æ¶è·è¸ªå¤ä¸ªåºåé¾ç½ç»ä¸çå å¯è´§å¸äº¤æãè¯¥å·¥å·ä¸ä¸º Cloudflare Workers é¨ç½²èè®¾è®¡,æ¯ä¸ä¸ªè½»éçº§è§£å³æ¹æ¡,å¯å¨çæ§çé±ååçä½é¢ååæäº¤ææ¶éè¿ Telegram æä¾å³æ¶éç¥ã

**æ ¸å¿ç¹æ§:**
- ð å¤é¾æ¯æ:ä»¥å¤ªåãBSCãBaseãArbitrumãSolana åæ¯ç¹å¸
- â¡ å®æ¶äº¤æçæ§
- ð± å³æ¶ Telegram éç¥
- âï¸ éè¿ Cloudflare Workers æ æå¡å¨é¨ç½²
- ð§ éè¿ç¯å¢åéè½»æ¾éç½®
- ð° æ¯æä¸»è¦ä»£å¸:ETHãBNBãSOLãBTCãUSDCãUSDT

### æ¯æçé¾åä»£å¸

| åºåé¾ | åçä»£å¸ | æ¯æçä»£å¸ |
|-------|---------|----------|
| **ä»¥å¤ªå (Ethereum)** | ETH | ETH, USDC, USDT |
| **å¸å®æºè½é¾ (BSC)** | BNB | BNB, USDC, USDT |
| **Base** | ETH | ETH, USDC, USDT |
| **Arbitrum** | ETH | ETH, USDC, USDT |
| **Solana** | SOL | SOL, USDC |
| **æ¯ç¹å¸ (Bitcoin)** | BTC | BTC |

### é¨ç½²æå (Cloudflare Workers)

#### æ­¥éª¤ 1:Fork æåéä»åº

```bash
git clone https://github.com/yourusername/chain-wallet-watcher.git
cd chain-wallet-watcher
```

æç´æ¥å¨ GitHub ä¸ Fork è¯¥ä»åºã

#### æ­¥éª¤ 2:è¿æ¥å° Cloudflare Pages/Workers

1. ç»å½æ¨ç [Cloudflare æ§å¶å°](https://dash.cloudflare.com/)
2. å¯¼èªè³ **Workers & Pages**
3. ç¹å» **åå»ºåºç¨ç¨åº** â **Workers**
4. ä¸ä¼ æ¨çé¡¹ç®æä»¶æè¿æ¥æ¨ç GitHub ä»åº
5. æç§æç¤ºå®æåå§è®¾ç½®

#### æ­¥éª¤ 3:éç½®ç¯å¢åé

å¨æ¨ç Cloudflare Worker è®¾ç½®ä¸­,å¯¼èªè³ **è®¾ç½®** â **åé** å¹¶æ·»å ä»¥ä¸åå®¹:

**å¿éåé:**

- `TELEGRAM_BOT_TOKEN` - ä» [@BotFather](https://t.me/BotFather) è·åç Telegram Bot ä»¤ç
- `TELEGRAM_CHAT_ID` - æ¨ç Telegram ç¨æ· ID æç¾¤ç»èå¤© ID
- `CONFIG` - é±åçæ§ç YAML éç½®åå®¹(åè§éç½®é¨å)

**å¯éåé(å¸¦é»è®¤å¼åé):**

- `RPC_URLS_ETH` - ä»¥å¤ªå RPC ç«¯ç¹(éå·åé)
- `RPC_URLS_BSC` - BSC RPC ç«¯ç¹(éå·åé)
- `RPC_URLS_BASE` - Base RPC ç«¯ç¹(éå·åé)
- `RPC_URLS_ARBITRUM` - Arbitrum RPC ç«¯ç¹(éå·åé)
- `RPC_URLS_SOLANA` - Solana RPC ç«¯ç¹(éå·åé)
- `BTC_API_URL` - æ¯ç¹å¸ API ç«¯ç¹(é»è®¤:å¬å± API)

**éç½®ç¤ºä¾:**

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
RPC_URLS_ETH=https://eth-mainnet.g.alchemy.com/v2/your-api-key,https://rpc.ankr.com/eth
RPC_URLS_BSC=https://bsc-dataseed1.binance.org,https://bsc-dataseed2.binance.org
CONFIG=<ä½ çyamléç½®åå®¹>
```

#### æ­¥éª¤ 4:éªè¯

1. é¨ç½²æ¨ç Worker
2. è§¦åçæ§åè½(éè¿ cron è§¦åå¨ææå¨è°ç¨)
3. æ£æ¥æ¨ç Telegram èå¤©ä»¥è·åæµè¯éç¥
4. å¨ Cloudflare æ§å¶å°ä¸­çæ§ Worker æ¥å¿ä»¥æ¥æ¾ä»»ä½éè¯¯

### ç¯å¢åééç½®è¯´æ

#### å¿éåé

| åéå | è¯´æ | ç¤ºä¾ |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | ä» [@BotFather](https://t.me/BotFather) è·åç Bot ä»¤ç | `1234567890:ABCdefGHI...` |
| `TELEGRAM_CHAT_ID` | æ¨çä¸ªäººèå¤© ID æç¾¤ç»èå¤© ID | `123456789` |
| `CONFIG` | åå«é±åå°ååçæ§è§åç YAML éç½® | è§ä¸æ¹ç¤ºä¾ |

#### å¯éåé

| åéå | è¯´æ | é»è®¤å¼ |
|--------|------|--------|
| `RPC_URLS_ETH` | ä»¥å¤ªå RPC URL(éå·åé) | å¬å± RPC ç«¯ç¹ |
| `RPC_URLS_BSC` | BSC RPC URL(éå·åé) | å¬å± RPC ç«¯ç¹ |
| `RPC_URLS_BASE` | Base RPC URL(éå·åé) | å¬å± RPC ç«¯ç¹ |
| `RPC_URLS_ARBITRUM` | Arbitrum RPC URL(éå·åé) | å¬å± RPC ç«¯ç¹ |
| `RPC_URLS_SOLANA` | Solana RPC URL(éå·åé) | å¬å± RPC ç«¯ç¹ |
| `BTC_API_URL` | æ¯ç¹å¸åºåé¾ API ç«¯ç¹ | å¬å±åºåé¾ API |

**CONFIG ç¤ºä¾ (YAML æ ¼å¼):**

```yaml
wallets:
  - address: "0x1234567890abcdef1234567890abcdef12345678"
    chains:
      - ethereum
      - bsc
    tokens:
      - ETH
      - USDC
      - USDT
  - address: "ä½ çSolanaé±åå°å"
    chains:
      - solana
    tokens:
      - SOL
      - USDC
```

### æ³¨æäºé¡¹

#### RPC èç¹éå¶åå»ºè®®

- **åè´¹ RPC èç¹**éå¸¸æéçéå¶(éå¸¸ä¸ºæ¯ç§ 25-100 ä¸ªè¯·æ±)
- **å»ºè®®:**å¨çäº§ç¯å¢ä¸­ä½¿ç¨ä¸ç¨ RPC æä¾å,å¦ AlchemyãInfuraãQuickNode æ Ankr
- éç½®å¤ä¸ª RPC ç«¯ç¹ä»¥å®ç°æéè½¬ç§»åä½
- çæ§æ¨ç RPC ä½¿ç¨æåµä»¥é¿åè¾¾å°éçéå¶

#### API éçéå¶

- Cloudflare Workers åè´¹å¥é¤:æ¯å¤© 100,000 ä¸ªè¯·æ±
- Telegram Bot API:æ¯ä¸ªæºå¨äººæ¯ç§ 30 æ¡æ¶æ¯
- èèä¸ºé«é¢çæ§å®æ½è¯·æ±èæµ
- ä½¿ç¨ç¼å­æºå¶åå°åä½ API è°ç¨

#### ä»£å¸åçº¦å°ååç¡®æ§

- å§ç»ä»å®æ¹æ¥æºéªè¯ä»£å¸åçº¦å°å
- å¸¸è§ä»£å¸å°å:
  - USDC (ä»¥å¤ªå): `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
  - USDT (ä»¥å¤ªå): `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - USDC (BSC): `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`
- å°åéè¯¯å°å¯¼è´ä½é¢æ¥è¯¢å¤±è´¥

#### Telegram Bot æéè®¾ç½®

- ç¡®ä¿æ¨çæºå¨äººææåæå®çèå¤©åéæ¶æ¯
- å¯¹äºç¾¤ç»èå¤©,å°æºå¨äººæ·»å ä¸ºæåå¹¶æäºéå½çæé
- å¨å®å¨é¨ç½²ä¹åä½¿ç¨ `/start` å½ä»¤è¿è¡æµè¯
- ä¿ææ¨çæºå¨äººä»¤çå®å¨,åå¿å°å¶æäº¤å°å¬å±ä»åº

### å·²ç¥é®é¢åæ½å¨éè¯¯

#### 1. RPC ä¸ç¨³å®å¯¼è´æ¥è¯¢å¤±è´¥

**é®é¢:**å¬å± RPC èç¹å¯è½ä¼åºç°åæºæéçéå¶,å¯¼è´äº¤ææ¥è¯¢å¤±è´¥ã

**è§£å³æ¹æ³:**
- éç½®å¤ä¸ª RPC ç«¯ç¹ä»¥å®ç°åä½
- å®æ½å¸¦ææ°éé¿çéè¯é»è¾
- èèä½¿ç¨ä»è´¹ RPC æå¡è¿è¡å³é®çæ§

#### 2. åè´¹ RPC è¯·æ±éå¶

**é®é¢:**åè´¹å¥é¤ RPC æä¾åæ½å ä¸¥æ ¼çéçéå¶,å¨é«é¢çæ§æé´å¯è½ä¼è¶åºéå¶ã

**è§£å³æ¹æ³:**
- å¢å çæ§é´é
- å¨å¤ä¸ª RPC æä¾åä¹é´åéè¯·æ±
- åçº§å°ä»è´¹ RPC è®¡åä»¥è·å¾æ´é«çéå¶

#### 3. Solana RPC å¯é æ§

**é®é¢:**Solana çå¬å± RPC ç«¯ç¹ç»å¸¸è¿è½½,å¯è½éè¦ä»è´¹èç¹æè½è·å¾å¯é çæå¡ã

**è§£å³æ¹æ³:**
- ä½¿ç¨ä¸ç¨ç Solana RPC æä¾å(HeliusãQuickNodeãTriton)
- å®æ½ç§¯æçéè¯æºå¶
- å¨æ¥è¯¢ä¹åçæ§ Solana ç½ç»ç¶æ

#### 4. æ¯ç¹å¸ API ä¾èµäºç¬¬ä¸æ¹æå¡

**é®é¢:**æ¯ç¹å¸çæ§ä¾èµäºç¬¬ä¸æ¹åºåé¾æµè§å¨(Blockchain.infoãBlockCypher),è¿äºæå¡å¯è½å­å¨å¯ç¨æ§é®é¢ã

**è§£å³æ¹æ³:**
- éç½®å¤ä¸ªæ¯ç¹å¸ API ç«¯ç¹
- å®æ½åéå°æ¿ä»£æä¾å
- å¯¹äºå³é®åºç¨,èèè¿è¡æ¨èªå·±çæ¯ç¹å¸èç¹

#### 5. å¤§é¢äº¤ææ£æµå»¶è¿

**é®é¢:**å¨ç½ç»æ¥å¡æ RPC ååºç¼æ¢æé´,å¯è½ä¼å»¶è¿æ£æµå°å¤§é¢äº¤æã

**è§£å³æ¹æ³:**
- æ ¹æ®ç½ç»ç¶åµä¼åè½®è¯¢é´é
- å¨å¯ç¨çæåµä¸ä½¿ç¨ WebSocket è¿æ¥è¿è¡å®æ¶æ´æ°
- ä¸ºé«ä»·å¼é±åå®æ½ä¼åçº§éå

### å¸¸è§é®é¢

**é®:å¦ä½è·åæç Telegram Chat ID?**

ç­:å¨ Telegram ä¸ä¸ [@userinfobot](https://t.me/userinfobot) å¼å§èå¤©,å®ä¼åæ¨åéæ¨çèå¤© IDã

**é®:æå¯ä»¥åæ¶çæ§å¤ä¸ªé±åå?**

ç­:å¯ä»¥,æ¨å¯ä»¥å¨ CONFIG YAML æä»¶ä¸­æ·»å å¤ä¸ªé±åå°åã

**é®:çæ§é¢çæ¯å¤å°?**

ç­:çæ§é¢çåå³äºæ¨ç Cloudflare Workers cron è§¦åå¨éç½®ãå»ºè®®:æ¯ 1-5 åéä¸æ¬¡ã

**é®:æ¯å¦æ¶åä»»ä½è´¹ç¨?**

ç­:Cloudflare Workers åè´¹å¥é¤æ¶µçå¤§å¤æ°ç¨ä¾ãå¦ææ¨ä½¿ç¨é«çº§ RPC æä¾åæè¶è¿ Cloudflare çåè´¹å¥é¤éå¶,å¯è½ä¼äº§çè´¹ç¨ã

**é®:æå¯ä»¥çæ§ NFT æå¶ä»ä»£å¸ç±»åå?**

ç­:ç®å,è¯¥å·¥å·ä¸æ³¨äºåçä»£å¸åä¸»è¦ç¨³å®å¸ãNFT æ¯æå¯è½ä¼å¨æªæ¥çæ¬ä¸­æ·»å ã

**é®:æçé±åä¿¡æ¯æå¤å®å¨?**

ç­:è¯¥å·¥å·ä»ä½¿ç¨é±åå°åçæ§å¬å±åºåé¾æ°æ®ãå®ä»ä¸éè¦æè®¿é®ç§é¥ãä½æ¯,è¯·ä¿ææ¨ç Telegram æºå¨äººä»¤çå®å¨ã

**é®:å¦ææªè½æ£æµå°äº¤æä¼ææ ·?**

ç­:å®æ½éè¯é»è¾å¹¶ä½¿ç¨å¤ä¸ª RPC ç«¯ç¹ãæ£æ¥ Worker æ¥å¿ä»¥è·åéè¯¯è¯¦ç»ä¿¡æ¯ã

**é®:æå¯ä»¥èªå®ä¹éç¥æ ¼å¼å?**

ç­:å¯ä»¥,æ¨å¯ä»¥ä¿®æ¹æºä»£ç ä¸­çéç¥æ¨¡æ¿ä»¥èªå®ä¹æ¶æ¯æ ¼å¼ã

### è®¸å¯è¯

MIT è®¸å¯è¯ - è¯¦è§ LICENSE æä»¶ã

### è´¡ç®

æ¬¢è¿è´¡ç®!è¯·æäº¤æåè¯·æ±æä¸ºéè¯¯ååè½è¯·æ±æå¼é®é¢ã

### æ¯æ

å¦æé®é¢åæ¯æéæ±,è¯·å¨ GitHub ä¸æå¼é®é¢æå å¥æä»¬çç¤¾åºè®¨è®ºã