# Model Templates Directory

This directory contains cached model templates for fast loading in the Arbius Explorer.

## Structure

```
/public/templates/
├── model-mapping.json      # Maps model IDs (hashes) to template files
├── kandinsky2.json         # Template for Kandinsky 2 model
├── zeroscopev2xl.json      # Template for Zeroscope V2 XL
├── qwen_qwq_32b.json       # Template for Qwen QwQ 32B
├── anythingv3.json         # Template for Anything V3
├── damo.json               # Template for Damo text-to-video
├── robust_video_matting.json  # Template for video matting
└── wai_v120.json           # Template for WAI v120
```

## Adding a New Template

### Method 1: Automatic (Recommended)

1. Add the template JSON file to this directory
2. Update `scripts/update-model-mapping.js` with the model hash:
   ```javascript
   const KNOWN_MODELS = {
     '0xYourModelHash': 'your-template.json',
     // ... existing models
   };
   ```
3. Run: `node scripts/update-model-mapping.js`

### Method 2: Manual

1. Add the template JSON file to this directory
2. Edit `model-mapping.json` directly:
   ```json
   {
     "models": {
       "0xYourModelHash": "your-template.json"
     }
   }
   ```

## Model Mapping Format

The `model-mapping.json` file maps model IDs to template filenames:

```json
{
  "comment": "Maps model ID (hash) to template filename",
  "models": {
    "0x3ac907e782b35cf2096eadcbd5d347fb7705db98526adcd2232ea560abbbef90": "kandinsky2.json"
  }
}
```

## Template File Format

Each template file follows this structure:

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
      "description": "Input prompt",
      "min": 1,
      "max": 100,
      "choices": ["option1", "option2"]
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

### Supported Input Types

- `string`: Text input
- `int`: Integer number
- `decimal`: Floating point number
- `int_enum`: Integer with predefined choices
- `string_enum`: String with predefined choices

### Supported Output Types

- `image`: Image file (PNG, JPG, GIF, etc.)
- `video`: Video file (MP4, WebM, etc.)
- `text`: Text file
- `json`: JSON data

## Performance

Templates in this directory are:
- Loaded instantly from local files (~100ms)
- Cached in memory after first load
- Used as fallback before fetching from IPFS

## Syncing with Source

To sync with the main templates repository:

```bash
cp /path/to/arbius/templates/*.json /path/to/explorer/public/templates/
node scripts/update-model-mapping.js
```
