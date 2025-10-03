# Kasumi-3: Multi-Model Telegram Bot for Arbius

A production-ready, extensible Telegram bot that interfaces with the Arbius decentralized AI network, supporting multiple AI models with dynamic command routing and a robust job queue system.

## Features

✨ **Multi-Model Support** - Easy model registration via configuration
🔄 **Job Queue System** - Concurrent task processing with status tracking
🤖 **Dynamic Commands** - Automatic `/[model_name]` command generation
📊 **V6 Contract Compatible** - Latest Arbius protocol support
🏗️ **Clean Architecture** - Dependency injection, service layer, type safety
🧪 **Comprehensive Tests** - 60+ unit and integration tests
🔧 **Developer Friendly** - TypeScript, hot reload, extensive logging

## Quick Start

### Prerequisites

- Node.js v22+ (LTS/Jod)
- npm (included with Node.js)
- Telegram Bot Token
- Arbius network access
- Replicate.com API token (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Build TypeScript
npm run build
```

### Configuration

1. **Environment Variables** (`.env`)
```bash
BOT_TOKEN='your-telegram-bot-token'
RPC_URL='https://sepolia-rollup.arbitrum.io/rpc'
PRIVATE_KEY='your-wallet-private-key'
ARBIUS_ADDRESS='0xBb388FACEffd52941a789610a931CeaDb043B885'
ARBIUS_ROUTER_ADDRESS='0xb3D381D6eA21e04fe2eC3d712Fd512e80e5945fe'
TOKEN_ADDRESS='0x8D9753e0af7ed426c63c7D6F0424d83f257C7821'
REPLICATE_API_TOKEN='your-replicate-token'
PINATA_JWT='your-pinata-jwt'
```

2. **Mining Configuration** (`MiningConfig.json`)
```json
{
  "cache_path": "cache",
  "ml": {
    "strategy": "replicate",
    "replicate": {
      "api_token": "ENV:REPLICATE_API_TOKEN"
    }
  },
  "ipfs": {
    "strategy": "pinata",
    "pinata": {
      "jwt": "ENV:PINATA_JWT"
    }
  }
}
```

3. **Models Configuration** (`ModelsConfig.json`)
```json
{
  "models": [
    {
      "id": "0xefa2d138185cf4f840630a3d323ffde028ed7d01867324f027d513cc2c7d7c32",
      "name": "qwen",
      "templatePath": "../../templates/qwen_sepolia.json",
      "replicateModel": "qwen/qwen-image"
    }
  ]
}
```

### Running

```bash
# Development mode (with hot reload)
npm run start:dev

# Listener mode (process network events)
npm run start:listener

# Production mode
npm start
```

## Usage

### Telegram Bot Commands

**Dynamic Model Commands:**
```
/qwen <prompt>          - Generate with Qwen model
/wai <prompt>           - Generate with WAI anime model
/qwq <prompt>           - Reasoning with QwQ model
```

**Utility Commands:**
```
/start                  - Welcome message and available models
/help                   - Show all commands and examples
/kasumi                 - Show bot wallet status
/queue                  - View job queue statistics
/submit <model> <prompt> - Submit task without waiting
/process <taskid>       - Process an existing task
```

### Examples

```
User: /qwen a beautiful sunset over mountains
Bot: [submits task, generates image, returns result]

User: /submit qwen a cat playing piano
Bot: ✅ Task submitted! TaskID: 0x... Process with: /process 0x...

User: /queue
Bot: 📊 Queue Status:
     Total: 5, Pending: 2, Processing: 1, Completed: 2

User: /kasumi
Bot: Kasumi-3's address: 0x...
     Balances: 100 AIUS, 0.5 ETH, 50 AIUS Staked
```

## Architecture

### Directory Structure

```
src/
├── types/
│   └── index.ts              # TypeScript type definitions
├── services/
│   ├── BlockchainService.ts  # Blockchain interactions
│   ├── ModelRegistry.ts      # Model management
│   ├── ModelHandler.ts       # Inference handlers
│   ├── JobQueue.ts           # Queue management
│   └── TaskProcessor.ts      # Task orchestration
├── config.ts                 # Configuration loader
├── index.ts                  # Telegram bot entry point
├── listener.ts               # Event listener entry point
├── utils.ts                  # Utility functions
├── ipfs.ts                   # IPFS operations
└── log.ts                    # Logging setup
```

### Service Layer

**BlockchainService** - Handles all blockchain interactions
- Task submission
- Solution submission
- Validator staking
- Event listening

**ModelRegistry** - Manages available models
- Dynamic model loading
- Name-based and ID-based lookups
- Template management

**JobQueue** - Concurrent task processing
- Configurable concurrency (default: 3)
- Status tracking
- Automatic cleanup

**TaskProcessor** - Orchestrates task workflow
- Submit tasks to blockchain
- Process with appropriate model handler
- Pin results to IPFS

**ModelHandler** - Inference execution
- ReplicateModelHandler - Replicate.com API
- CogModelHandler - Self-hosted Cog models
- Factory pattern for extensibility

## Testing

### Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Test Coverage

- **60 tests** covering utils, services, and integration
- **>70% code coverage**
- Mocked external dependencies for fast execution
- See [TESTING.md](./TESTING.md) for details

## Adding New Models

1. Create template file in `../../templates/`:
```json
{
  "meta": {
    "title": "My Model",
    "description": "Description",
    "version": 1
  },
  "input": [
    {
      "variable": "prompt",
      "type": "string",
      "required": true
    }
  ],
  "output": [
    {
      "filename": "out-1.png",
      "type": "image"
    }
  ]
}
```

2. Add to `ModelsConfig.json`:
```json
{
  "id": "0x...",
  "name": "mymodel",
  "templatePath": "../../templates/mymodel.json",
  "replicateModel": "owner/model-name"
}
```

3. Restart bot - `/mymodel` command is now available!

## Development

### Scripts

```bash
npm run build          # Compile TypeScript
npm run start:dev      # Development with hot reload
npm run start:listener # Event listener
npm test               # Run test suite
npm run test:coverage  # Coverage report
```

### Code Style

- TypeScript strict mode
- ES2020 target
- CommonJS modules
- Prettier/ESLint ready

## Deployment

### Production Checklist

- [ ] Set all environment variables in `.env`
- [ ] Configure models in `ModelsConfig.json`
- [ ] Ensure wallet has AIUS tokens staked
- [ ] Test with `/kasumi` command
- [ ] Monitor logs for errors
- [ ] Set up process manager (PM2, systemd)

### PM2 Example

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start npm --name kasumi3-bot -- start

# Start listener
pm2 start npm --name kasumi3-listener -- run start:listener

# Monitor
pm2 logs
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Troubleshooting

### Bot not responding
- Check `BOT_TOKEN` is correct
- Verify bot is running: `pm2 list`
- Check logs: `tail -f log.txt`

### Tasks failing
- Verify wallet has AIUS staked: `/kasumi`
- Check Replicate API token
- Verify model configuration

### IPFS errors
- Check `PINATA_JWT` is valid
- Verify Pinata account has space
- Try alternative IPFS strategy

## Documentation

- [UPGRADE.md](./UPGRADE.md) - V6 upgrade guide and architecture
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [.env.example](./.env.example) - Environment variables template

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Submit pull request

## License

MIT License - See LICENSE file for details

## Support

- GitHub Issues: Report bugs and feature requests
- Arbius Discord: Community support
- Documentation: Check UPGRADE.md and TESTING.md

## Acknowledgments

Built for the Arbius decentralized AI network with ❤️ by the community.

---

**Status:** Production Ready ✅
**Tests:** 60/60 Passing ✅
**Coverage:** >70% ✅
**Node:** v22+ LTS ✅
