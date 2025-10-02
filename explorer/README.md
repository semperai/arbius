# Arbius Explorer

A blockchain explorer for the Arbius decentralized AI network, built with Next.js and connected to the V2_EngineV6 smart contract.

## Features

- **Real-time Contract Data**: Displays live information from the Arbius V2_EngineV6 contract on Arbitrum Sepolia
- **Task Details**: View individual task information including solutions and contestations
- **Model Information**: Explore AI model details, fees, and emission rates
- **Validator Tracking**: Check validator staking status and information
- **Search Functionality**: Search by task ID, model hash, or validator address

## Network Configuration

The explorer is currently configured to connect to:
- **Network**: Arbitrum One (Mainnet)
- **Chain ID**: 42161
- **RPC URL**: https://arb1.arbitrum.io/rpc
- **Engine Contract**: `0x9b51Ef044d3486A1fB0A2D55A6e0CeeAdd323E66` (V5_Engine)
- **Base Token**: `0x4a24b101728e07a52053c13fb4db2bcf490cabc3` (AIUS)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Search Functionality

1. **Task Search**: Enter a 66-character task ID (e.g., `0x1234...`)
2. **Model Search**: Enter a 66-character model hash
3. **Validator Search**: Enter a 42-character Ethereum address

### Limitations

Features requiring an external indexer are currently disabled:
- ❌ List all tasks/models/validators
- ❌ Task history and statistics
- ✅ Individual task/model/validator lookup works

## Environment Variables

See `.env.local` for configuration. Key variables:
- `NEXT_PUBLIC_ENGINE_ADDRESS`: Engine contract address (currently V5 on mainnet)
- `NEXT_PUBLIC_RPC_URL`: Arbitrum One RPC endpoint
- `NEXT_PUBLIC_CHAIN_ID`: 42161 (Arbitrum One)

## License

MIT

## IPFS Content Rendering

The explorer includes an IPFS content renderer that automatically displays task inputs and solution outputs from IPFS.

### Supported Content Types

- **Images**: PNG, JPG, GIF, WebP, SVG
- **Videos**: MP4, WebM, OGG
- **Text**: Plain text files, code, logs
- **JSON**: Formatted JSON data

### How It Works

1. Task and solution CIDs are automatically detected
2. Content is fetched from `https://ipfs.arbius.org/ipfs/{CID}`
3. Content type is determined from HTTP headers or model template
4. Appropriate renderer is displayed (image viewer, video player, text viewer, or JSON formatter)

### Example

When viewing a task that generates an image, the IPFS renderer will:
- Display the input prompt in the "Overview" tab
- Display the generated image in the "Solution" tab
- Provide a link to view the content directly on IPFS

## Model Templates

The explorer supports Arbius model templates, which define the structure and behavior of AI models.

### Local Template Caching

For performance, templates are cached locally in the explorer rather than fetched from IPFS each time:

- **Template Files**: Located in `/public/templates/`
- **Mapping File**: `/public/templates/model-mapping.json` maps model IDs to template filenames
- **Memory Cache**: Templates are cached in memory after first load
- **IPFS Fallback**: If a template isn't in the local cache, it falls back to fetching from IPFS

#### Adding a New Model Template

1. Add the template JSON file to `/public/templates/` (e.g., `my-model.json`)
2. Update `/public/templates/model-mapping.json` to add the mapping:
   ```json
   {
     "models": {
       "0xYourModelHash": "my-model.json"
     }
   }
   ```
3. Restart the dev server to see changes

### Template Format

Each model template is a JSON file stored on IPFS containing:

```json
{
  "meta": {
    "title": "Model Name",
    "description": "Model description",
    "git": "https://github.com/...",
    "docker": "docker image reference",
    "version": 1
  },
  "input": [
    {
      "variable": "prompt",
      "type": "string",
      "required": true,
      "default": "",
      "description": "Input prompt"
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

### Features

- **Automatic Output Type Detection**: The explorer uses the template to determine the expected output type (image, video, text, json)
- **Input Parameters Display**: View all input parameters, types, defaults, and constraints on the model detail page
- **Output Information**: See what files and types the model produces
- **Enhanced Rendering**: Solution outputs are rendered correctly based on template specifications

### Supported Output Types

- `image`: PNG, JPG, GIF, etc.
- `video`: MP4, WebM, etc.
- `text`: Plain text, code, logs
- `json`: JSON data

### Template Examples

See the `/public/templates` directory for example templates:
- `kandinsky2.json`: Text-to-image model (Kandinsky 2)
- `zeroscopev2xl.json`: Text-to-video model (Zeroscope V2 XL)
- `qwen_qwq_32b.json`: Text generation model (Qwen QwQ 32B)
- `anythingv3.json`: Image generation model
- `damo.json`: Text-to-video model (Damo)
- `robust_video_matting.json`: Video matting model

### Performance Benefits

- **Instant Loading**: Templates load from local files instead of IPFS (~100ms vs ~2-5 seconds)
- **No Network Dependency**: Works offline for known models
- **Reduced IPFS Load**: Less traffic to IPFS gateway
- **Memory Caching**: Once loaded, templates are cached in memory

