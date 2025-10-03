# Available Model Templates

This file lists all available model templates and their mapping status.

## ✅ Mapped Models

| Model Name | Template File | Model Hash | Network |
|------------|---------------|------------|---------|
| Kandinsky 2 | `kandinsky2.json` | `0x3ac907e782b35cf2096eadcbd5d347fb7705db98526adcd2232ea560abbbef90` | Testnet |

## 📋 Unmapped Templates

These templates are available but need model hashes from deployed contracts:

| Model Name | Template File | Status |
|------------|---------------|--------|
| Anything V3 | `anythingv3.json` | ⏳ Needs model hash |
| Damo Text-to-Video | `damo.json` | ⏳ Needs model hash |
| Qwen QwQ 32B | `qwen_qwq_32b.json` | ⏳ Needs model hash |
| Qwen Sepolia | `qwen_sepolia.json` | ⏳ Needs model hash |
| Robust Video Matting | `robust_video_matting.json` | ⏳ Needs model hash |
| WAI v120 | `wai_v120.json` | ⏳ Needs model hash |
| Zeroscope V2 XL | `zeroscopev2xl.json` | ⏳ Needs model hash |

## How to Add Model Hash

When a model is deployed on-chain:

1. Get the model hash from the deployment transaction or contract
2. Edit `scripts/update-model-mapping.js`:
   ```javascript
   const KNOWN_MODELS = {
     '0xYourModelHash': 'template-name.json',
     // ...
   };
   ```
3. Run: `node scripts/update-model-mapping.js`
4. Update this file to move the model to "Mapped Models"

## Finding Model Hashes

### From Contract Events
```bash
# Get RegisterModel events from the engine contract
cast logs --address 0x9b51Ef044d3486A1fB0A2D55A6e0CeeAdd323E66 \
  --from-block earliest \
  "RegisterModel(bytes32,address,uint256,uint256)"
```

### From Subgraph/Indexer
Query the indexer for all registered models and their hashes.

### Manual Calculation
Model hash is typically: `keccak256(abi.encodePacked(template_cid))`
