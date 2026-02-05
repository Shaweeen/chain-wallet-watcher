# Chain Wallet Watcher ð

[English](#english) | [ä¸­æ](#ä¸­æ)

---

## English

A powerful multi-chain wallet monitoring tool that tracks fund movements across Ethereum, BSC, Polygon, Solana, and Bitcoin networks with real-time Telegram notifications.

### Features

- ð **Multi-Chain Support**: Monitor wallets on Ethereum, BSC, Polygon, Solana, and Bitcoin
- ð **Real-time Monitoring**: Track incoming and outgoing transactions in real-time
- ð± **Telegram Notifications**: Instant alerts via Telegram Bot
- ð§ **Configurable**: Easy YAML/JSON configuration for multiple wallets
- ð **High Performance**: Built with TypeScript for type safety and reliability
- ð **Extensible**: Easy to add new chains and notification channels

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Shaweeen/chain-wallet-watcher.git
cd chain-wallet-watcher

# Install dependencies
npm install

# Copy and configure
cp config/config.example.yaml config/config.yaml
# Edit config/config.yaml with your settings

# Build and run
npm run build
npm start
```

### Configuration

Create `config/config.yaml`:

```yaml
telegram:
  botToken: "YOUR_BOT_TOKEN"
  chatId: "YOUR_CHAT_ID"

chains:
  ethereum:
    enabled: true
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
    
  bsc:
    enabled: true
    rpcUrl: "https://bsc-dataseed.binance.org"
    
  polygon:
    enabled: true
    rpcUrl: "https://polygon-rpc.com"
    
  solana:
    enabled: true
    rpcUrl: "https://api.mainnet-beta.solana.com"
    
  bitcoin:
    enabled: true
    apiUrl: "https://blockstream.info/api"

wallets:
  - address: "0x..."
    chain: ethereum
    label: "Main ETH Wallet"
    
  - address: "0x..."
    chain: bsc
    label: "BSC Trading Wallet"
```

### Environment Variables

You can also use environment variables:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### API Documentation

| Endpoint | Description |
|----------|-------------|
| Ethereum | Uses ethers.js with any EVM-compatible RPC |
| BSC | BNB Smart Chain via standard JSON-RPC |
| Polygon | Polygon PoS chain via standard JSON-RPC |
| Solana | Solana Web3.js for SPL tokens and SOL |
| Bitcoin | Blockstream API for UTXO tracking |

### Development

```bash
# Development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Project Structure

```
chain-wallet-watcher/
âââ src/
â   âââ index.ts              # Entry point
â   âââ config/               # Configuration loader
â   âââ chains/               # Chain-specific implementations
â   â   âââ base.ts           # Base chain class
â   â   âââ ethereum.ts       # EVM chains (ETH, BSC, Polygon)
â   â   âââ solana.ts         # Solana implementation
â   â   âââ bitcoin.ts        # Bitcoin implementation
â   âââ notifications/        # Notification channels
â   â   âââ telegram.ts       # Telegram bot integration
â   âââ types/                # TypeScript type definitions
âââ config/
â   âââ config.example.yaml   # Example configuration
âââ package.json
âââ tsconfig.json
âââ README.md
```

### License

MIT License - see [LICENSE](LICENSE) for details.

---

## ä¸­æ

ä¸ä¸ªå¼ºå¤§çå¤é¾é±åçæ§å·¥å·ï¼æ¯æå®æ¶è¿½è¸ª EthereumãBSCãPolygonãSolana å Bitcoin ç½ç»ä¸çèµéæµå¨ï¼å¹¶éè¿ Telegram å³æ¶æ¨ééç¥ã

### åè½ç¹ç¹

- ð **å¤é¾æ¯æ**: çæ§ EthereumãBSCãPolygonãSolana å Bitcoin é±å
- ð **å®æ¶çæ§**: å®æ¶è¿½è¸ªè½¬å¥åè½¬åºäº¤æ
- ð± **Telegram éç¥**: éè¿ Telegram Bot å³æ¶æ¨éæé
- ð§ **çµæ´»éç½®**: æ¯æ YAML/JSON éç½®å¤ä¸ªé±åå°å
- ð **é«æ§è½**: ä½¿ç¨ TypeScript æå»ºï¼ç±»åå®å¨ä¸å¯é 
- ð **å¯æ©å±**: æäºæ·»å æ°é¾åéç¥æ¸ é

### å¿«éå¼å§

```bash
# åéä»åº
git clone https://github.com/Shaweeen/chain-wallet-watcher.git
cd chain-wallet-watcher

# å®è£ä¾èµ
npm install

# å¤å¶å¹¶éç½®
cp config/config.example.yaml config/config.yaml
# ç¼è¾ config/config.yaml å¡«å¥ä½ çéç½®

# æå»ºå¹¶è¿è¡
npm run build
npm start
```

### éç½®è¯´æ

åå»º `config/config.yaml`:

```yaml
telegram:
  botToken: "ä½ ç_BOT_TOKEN"
  chatId: "ä½ ç_CHAT_ID"

chains:
  ethereum:
    enabled: true
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/ä½ çAPIå¯é¥"
    
  bsc:
    enabled: true
    rpcUrl: "https://bsc-dataseed.binance.org"
    
  polygon:
    enabled: true
    rpcUrl: "https://polygon-rpc.com"
    
  solana:
    enabled: true
    rpcUrl: "https://api.mainnet-beta.solana.com"
    
  bitcoin:
    enabled: true
    apiUrl: "https://blockstream.info/api"

wallets:
  - address: "0x..."
    chain: ethereum
    label: "ä¸» ETH é±å"
    
  - address: "0x..."
    chain: bsc
    label: "BSC äº¤æé±å"
```

### å¼åå½ä»¤

```bash
# å¼åæ¨¡å¼ï¼ç­éè½½ï¼
npm run dev

# è¿è¡æµè¯
npm test

# ä»£ç æ£æ¥
npm run lint

# çäº§æå»º
npm run build
```

### è·å Telegram Bot Token

1. å¨ Telegram ä¸­æç´¢ @BotFather
2. åé `/newbot` åå»ºæ°æºå¨äºº
3. ææç¤ºè®¾ç½®æºå¨äººåç§°
4. è·å Bot Token
5. å° Token å¡«å¥éç½®æä»¶

### è·å Chat ID

1. å¯å¨ä½ ç Bot
2. åéä»»ææ¶æ¯ç» Bot
3. è®¿é® `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
4. å¨è¿åç JSON ä¸­æ¾å° `chat.id`

### æ¯æç RPC æå¡

| é¾ | æ¨èæå¡ |
|---|---------|
| Ethereum | Alchemy, Infura, QuickNode |
| BSC | å®æ¹èç¹, Ankr |
| Polygon | Alchemy, Polygon å®æ¹ |
| Solana | å®æ¹èç¹, QuickNode |
| Bitcoin | Blockstream API |

### è®¸å¯è¯

MIT è®¸å¯è¯ - è¯¦è§ [LICENSE](LICENSE) æä»¶ã

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you find this project helpful, please consider giving it a â­ï¸!
