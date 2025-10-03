#!/usr/bin/env node

/**
 * Script to update model-mapping.json with known model IDs
 *
 * Usage:
 *   node scripts/update-model-mapping.js
 *
 * This script helps maintain the mapping between model hashes and template files
 */

const fs = require('fs');
const path = require('path');

// Known model mappings (add new models here)
const KNOWN_MODELS = {
  // Kandinsky 2 - from testnet config
  '0x3ac907e782b35cf2096eadcbd5d347fb7705db98526adcd2232ea560abbbef90': 'kandinsky2.json',

  // TODO: Add actual model hashes from deployed contracts
  // These are placeholder mappings - replace with real model IDs when available
  // 'REPLACE_WITH_ACTUAL_HASH': 'anythingv3.json',
  // 'REPLACE_WITH_ACTUAL_HASH': 'damo.json',
  // 'REPLACE_WITH_ACTUAL_HASH': 'qwen_qwq_32b.json',
  // 'REPLACE_WITH_ACTUAL_HASH': 'qwen_sepolia.json',
  // 'REPLACE_WITH_ACTUAL_HASH': 'robust_video_matting.json',
  // 'REPLACE_WITH_ACTUAL_HASH': 'wai_v120.json',
  // 'REPLACE_WITH_ACTUAL_HASH': 'zeroscopev2xl.json',
};

const mappingPath = path.join(__dirname, '../public/templates/model-mapping.json');

try {
  // Read existing mapping if it exists
  let existingMapping = { models: {} };

  if (fs.existsSync(mappingPath)) {
    const content = fs.readFileSync(mappingPath, 'utf8');
    existingMapping = JSON.parse(content);
  }

  // Merge with known models (don't overwrite existing)
  const updatedMapping = {
    comment: 'Maps model ID (hash) to template filename. Auto-generated, do not edit directly.',
    models: {
      ...KNOWN_MODELS,
      ...existingMapping.models, // Existing takes precedence
    }
  };

  // Write back to file
  fs.writeFileSync(
    mappingPath,
    JSON.stringify(updatedMapping, null, 2) + '\n',
    'utf8'
  );

  console.log('✅ Model mapping updated successfully!');
  console.log(`   Total models: ${Object.keys(updatedMapping.models).length}`);
  console.log(`   File: ${mappingPath}`);
} catch (error) {
  console.error('❌ Error updating model mapping:', error);
  process.exit(1);
}
