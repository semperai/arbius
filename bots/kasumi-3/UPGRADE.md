# Kasumi-3 V6 Upgrade - Architecture Improvements

## Overview

Kasumi-3 has been completely refactored with a clean, extensible architecture supporting:
- **V6 Contract Compatibility**
- **Multi-model support** with dynamic command routing
- **Job queue system** for concurrent task processing
- **Replicate.com and Cog integration** for flexible inference
- **Proper dependency injection** and service-oriented design
- **Type safety** throughout the codebase

## New Architecture

### Core Components

#### 1. **Type System** (`src/types/index.ts`)
- Comprehensive TypeScript interfaces for all data structures
- Type-safe configuration management
- Interface definitions for all services

#### 2. **Services Layer**

**BlockchainService** (`src/services/BlockchainService.ts`)
- Handles all blockchain interactions
- V6 contract compatibility
- Automatic validator staking and approvals
- Transaction parsing and event handling

**ModelRegistry** (`src/services/ModelRegistry.ts`)
- Central registry for all supported models
- Load models from templates
- Support for name-based and ID-based lookups

**JobQueue** (`src/services/JobQueue.ts`)
- Concurrent job processing (default: 3 concurrent jobs)
- Status tracking (pending, processing, completed, failed)
- Automatic cleanup of old jobs
- Queue statistics

**TaskProcessor** (`src/services/TaskProcessor.ts`)
- Task submission and processing orchestration
- Integration with blockchain and model handlers
- IPFS pinning

**ModelHandler** (`src/services/ModelHandler.ts`)
- Abstract base class for model handlers
- `ReplicateModelHandler` - Replicate.com integration
- `CogModelHandler` - Self-hosted Cog models
- Factory pattern for handler creation

#### 3. **Configuration System** (`src/config.ts`)

**ConfigLoader**
- Loads and validates MiningConfig.json
- Resolves `ENV:` prefixed values from environment variables
- Creates cache directories automatically

**ModelsConfig**
- Separate configuration for model registry
- Maps model IDs to templates and endpoints

### New Features

#### Dynamic Model Commands
```
/qwen <prompt>          - Generate with Qwen model
/wai <prompt>           - Generate with WAI model
/qwq <prompt>           - Generate with QwQ reasoning model
```

Each model gets its own command automatically!

#### Job Queue System
```
/queue                  - View queue status
/submit <model> <prompt> - Submit without waiting
/process <taskid>       - Process existing task
```

#### Multi-Model Support
Models are configured in `ModelsConfig.json`:
```json
{
  "models": [
    {
      "id": "0xefa2d138...",
      "name": "qwen",
      "templatePath": "../../templates/qwen_sepolia.json",
      "replicateModel": "qwen/qwen-image"
    }
  ]
}
```

## Configuration

### Environment Variables (.env)
```bash
BOT_TOKEN=<telegram_bot_token>
RPC_URL=<arbitrum_rpc_url>
PRIVATE_KEY=<wallet_private_key>
ARBIUS_ADDRESS=<arbius_contract_address>
ARBIUS_ROUTER_ADDRESS=<router_contract_address>
TOKEN_ADDRESS=<token_contract_address>
REPLICATE_API_TOKEN=<replicate_api_token>
PINATA_JWT=<pinata_jwt_token>
```

### MiningConfig.json
```json
{
  "cache_path": "cache",
  "blockchain": {
    "rpc_url": "ENV:RPC_URL"
  },
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

### ModelsConfig.json
Define all supported models with their templates and endpoints.

## Migration Guide

### Old Code (v5)
```typescript
const QwenModel = {
  id: modelId,
  template: QwenTemplate,
  getfiles: async (m: any, taskid: string, input: any) => {
    // Hardcoded Replicate logic
  }
};
```

### New Code (v6)
```typescript
const modelRegistry = new ModelRegistry();
modelRegistry.loadModelsFromConfig(modelsConfig.models);

const handler = ModelHandlerFactory.createHandler(
  modelConfig,
  miningConfig
);
```

## Running the Bot

### Development
```bash
npm run start:dev        # Start bot with nodemon
npm run start:listener   # Start listener with nodemon
```

### Production
```bash
npm run build            # Compile TypeScript
npm start                # Run compiled bot
```

## Adding New Models

1. Create a template file in `../../templates/`:
```json
{
  "meta": {
    "title": "My Model",
    "description": "...",
    "version": 1
  },
  "input": [...],
  "output": [...]
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

3. Restart bot - the `/mymodel` command is now available!

## Architecture Benefits

✅ **Type Safety** - Full TypeScript coverage with strict types
✅ **Testability** - Dependency injection makes unit testing easy
✅ **Extensibility** - Add new models without changing core code
✅ **Maintainability** - Clear separation of concerns
✅ **Scalability** - Job queue handles concurrent processing
✅ **Security** - Secrets in environment variables, not config files
✅ **V6 Ready** - Compatible with latest Arbius contracts

## File Structure

```
src/
├── types/
│   └── index.ts                  # Type definitions
├── services/
│   ├── BlockchainService.ts      # Blockchain interactions
│   ├── ModelRegistry.ts          # Model management
│   ├── ModelHandler.ts           # Inference handlers
│   ├── JobQueue.ts               # Queue management
│   └── TaskProcessor.ts          # Task orchestration
├── config.ts                     # Configuration loader
├── index.ts                      # Telegram bot
├── listener.ts                   # Event listener
├── utils.ts                      # Utilities
├── ipfs.ts                       # IPFS operations
└── log.ts                        # Logging

Config files:
├── MiningConfig.json             # Mining configuration
├── ModelsConfig.json             # Model definitions
├── .env                          # Environment secrets
└── package.json                  # Dependencies
```

## Breaking Changes

- Old `index.ts` and `listener.ts` backed up as `.old.ts`
- Environment variable `MODEL_ID` no longer used (use ModelsConfig.json)
- MiningConfig.json now uses `ENV:` prefix for secrets
- Job queue introduces slight delay for processing

## Future Enhancements

- [ ] Add database for persistent job storage
- [ ] Web dashboard for queue monitoring
- [ ] Multiple Telegram bot instances
- [ ] Auto-retry failed jobs
- [ ] Webhook support for job completion
- [ ] Model performance metrics
