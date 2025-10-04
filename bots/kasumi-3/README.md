# Kasumi-3: Multi-Model Telegram Bot for Arbius

A production-ready Telegram bot for the Arbius decentralized AI network with multi-model support, job queue management, and health monitoring.

## Features

- ✨ **Multi-Model Support** - Dynamic command generation for all registered models
- 🔄 **Job Queue System** - Concurrent processing with configurable limits
- 🤖 **V6 Contract Compatible** - Latest Arbius protocol
- 📊 **Health Monitoring** - HTTP endpoint + `/status` command
- 🧪 **Well Tested** - 325 tests, 78% coverage
- 🏗️ **Clean Architecture** - Service layer, dependency injection, TypeScript

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your credentials

# Run
npm run build
npm start
```

## Configuration

### Environment Variables

**Arbitrum One (Mainnet):**
```bash
BOT_TOKEN='your-telegram-bot-token'
RPC_URL='https://arb1.arbitrum.io/rpc'
PRIVATE_KEY='your-wallet-private-key'
ARBIUS_ADDRESS='0x9b51Ef044d3486A1fB0A2D55A6e0CeeAdd323E66'
ARBIUS_ROUTER_ADDRESS='0xecAba4E6a4bC1E3DE3e996a8B2c89e8B0626C9a1'
TOKEN_ADDRESS='0x4a24b101728e07a52053c13fb4db2bcf490cabc3'
REPLICATE_API_TOKEN='your-replicate-token'
PINATA_JWT='your-pinata-jwt'
```

**Arbitrum Sepolia (Testnet):**
```bash
RPC_URL='https://sepolia-rollup.arbitrum.io/rpc'
ARBIUS_ADDRESS='0xBb388FACEffd52941a789610a931CeaDb043B885'
ARBIUS_ROUTER_ADDRESS='0xb3D381D6eA21e04fe2eC3d712Fd512e80e5945fe'
TOKEN_ADDRESS='0x8D9753e0af7ed426c63c7D6F0424d83f257C7821'
```

**Optional Settings:**
```bash
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=60000
JOB_MAX_CONCURRENT=3
JOB_TIMEOUT_MS=900000
HEALTH_CHECK_PORT=3000  # 0 to disable
```

### Model Configuration

Edit `ModelsConfig.json`:
```json
{
  "models": [
    {
      "id": "0xmodel_id_from_blockchain",
      "name": "qwen",
      "templatePath": "../../templates/qwen.json",
      "replicateModel": "qwen/qwen-image"
    }
  ]
}
```

## Commands

### User Commands

```
/qwen <prompt>           - Generate with Qwen
/wai <prompt>            - Generate with WAI
/qwq <prompt>            - Reasoning with QwQ
/status                  - Health check
/kasumi                  - Wallet status
/queue                   - Queue statistics
/submit <model> <prompt> - Submit without waiting
/process <taskid>        - Process existing task
/help                    - Show all commands
```

### Status Command

```
/status
```

Shows:
- ✅/⚠️ Overall health
- ETH/AIUS balances
- Validator stake
- Queue statistics
- System uptime
- Active users

Warnings appear when:
- ETH < 0.01 (low gas)
- AIUS < 1 (low balance)
- Stake < minimum (can't validate)
- Queue > 10 processing (overload)

### Health Check API

HTTP endpoint for monitoring tools:

```bash
# Enable
HEALTH_CHECK_PORT=3000

# Check
curl http://localhost:3000/health
curl http://localhost:3000/ping
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1696352123,
  "uptime": 18723,
  "checks": {
    "eth": { "ok": true, "balance": "0.5" },
    "aius": { "ok": true, "balance": "100.0" },
    "stake": { "ok": true, "staked": "50.0" },
    "queue": { "ok": true, "stats": {...} }
  },
  "warnings": []
}
```

Use with Docker, Kubernetes, Prometheus, etc.

## Architecture

```
Telegram Bot (Telegraf)
    ├─► Rate Limiter (5 req/min)
    ├─► Command Handlers
    └─► Dynamic Model Commands
            │
            ▼
    Service Layer
        ├─► ModelRegistry
        ├─► BlockchainService
        ├─► JobQueue (FIFO, concurrent)
        ├─► TaskProcessor
        └─► ModelHandler (Replicate/Cog)
            │
            ▼
    External APIs
        ├─► Arbius Contract (Ethereum)
        ├─► Replicate API
        └─► IPFS (Pinata)
```

**Key Services:**
- **BlockchainService** - Task submission, solution posting, stake management
- **ModelRegistry** - Dynamic model loading and lookup
- **JobQueue** - Concurrent processing (default: 3), event-driven
- **TaskProcessor** - Orchestrates submit → process → pin → solve
- **HealthCheckServer** - HTTP monitoring endpoint

## Development

### Scripts

```bash
npm run start:dev       # Hot reload
npm run start:listener  # Event listener
npm test                # All tests
npm run test:coverage   # Coverage report
npm run build           # Compile TypeScript
```

### Adding Models

1. Create `../../templates/mymodel.json`:
```json
{
  "meta": { "title": "My Model", "version": 1 },
  "input": [{ "variable": "prompt", "type": "string" }],
  "output": [{ "filename": "out.png", "type": "image" }]
}
```

2. Add to `ModelsConfig.json`:
```json
{
  "id": "0x...",
  "name": "mymodel",
  "templatePath": "../../templates/mymodel.json",
  "replicateModel": "owner/model"
}
```

3. Restart → `/mymodel` command available!

### Testing

```bash
npm test                 # All tests (325)
npm run test:watch       # Watch mode
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
```

Coverage: 78.27% (exceeds 70% goal)

### Code Standards

- TypeScript strict mode
- Service layer architecture
- Dependency injection
- Error handling with retries
- Comprehensive logging
- Event-driven job completion

## Deployment

### PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start npm --name kasumi3-bot -- start
pm2 start npm --name kasumi3-listener -- run start:listener

# Monitor
pm2 logs kasumi3-bot
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/ping || exit 1
```

### Production Checklist

- [ ] Set `.env` variables (BOT_TOKEN, PRIVATE_KEY, etc.)
- [ ] Configure `ModelsConfig.json`
- [ ] Ensure wallet has AIUS staked (check minimum with `/status`)
- [ ] Test with `/kasumi` and `/status`
- [ ] Set up PM2 or systemd
- [ ] Configure health check port
- [ ] Monitor logs

## Troubleshooting

### Bot not responding
```bash
pm2 list                # Check if running
pm2 logs kasumi3-bot    # Check logs
tail -f log.txt         # View bot logs
```

### Tasks failing
1. Check `/status` for warnings
2. Verify `/kasumi` shows staked AIUS
3. Check ETH balance for gas
4. Verify model configuration

### Low balance warnings
```bash
# Check with /status command
# Deposit ETH (minimum 0.01 for gas)
# Deposit AIUS (minimum 1 for tasks)
# Stake AIUS (check minimum in /status)
```

### IPFS errors
- Verify `PINATA_JWT` is valid
- Check Pinata account quota
- Increase timeout: `JOB_TIMEOUT_MS=1800000`

## FAQ

**Q: How much AIUS do I need staked?**
A: Check with `/status` - typically 600 AIUS minimum.

**Q: Can I run multiple models?**
A: Yes! Add all models to `ModelsConfig.json`.

**Q: How do I switch networks?**
A: Change `RPC_URL` and contract addresses in `.env`.

**Q: What's the rate limit?**
A: Default 5 requests/minute per user (configurable).

**Q: How do I monitor the bot?**
A: Use `/status` command or HTTP health endpoint on port 3000.

**Q: Can I use custom ML providers?**
A: Yes! Implement `IModelHandler` interface.

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests: `npm test`
4. Build: `npm run build`
5. Commit: `git commit -m "feat: description"`
6. Push and create PR

**Code Standards:**
- TypeScript strict mode
- Service layer pattern
- Comprehensive tests
- Clear commit messages

## Links

- [Arbius Website](https://arbius.ai)
- [Contract Addresses](https://docs.arbius.ai/ca)
- [Arbius Discord](https://discord.gg/arbius)
- [GitHub Issues](https://github.com/semperai/arbius/issues)

## License

MIT License - See LICENSE file for details
