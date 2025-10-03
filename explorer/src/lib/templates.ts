export interface ModelTemplate {
  meta: {
    title: string;
    description: string;
    git?: string;
    docker: string;
    version: number;
  };
  input: Array<{
    variable: string;
    type: string;
    required: boolean;
    default?: string | number | boolean;
    description: string;
    min?: number;
    max?: number;
    choices?: Array<string | number>;
  }>;
  output: Array<{
    filename: string;
    type: 'image' | 'video' | 'text' | 'json';
  }>;
}

interface ModelMapping {
  comment?: string;
  models: {
    [modelId: string]: string; // modelId -> template filename
  };
}

// Cache for templates and mapping
const templateCache: { [key: string]: ModelTemplate } = {};
let modelMapping: ModelMapping | null = null;

/**
 * Load the model mapping from local cache
 */
async function loadModelMapping(): Promise<ModelMapping | null> {
  if (modelMapping) return modelMapping;

  try {
    const response = await fetch('/templates/model-mapping.json');
    if (!response.ok) {
      console.warn('Model mapping not found, will use IPFS fallback');
      return null;
    }

    modelMapping = await response.json();
    return modelMapping;
  } catch (error) {
    console.warn('Error loading model mapping:', error);
    return null;
  }
}

/**
 * Fetch template from local cache
 */
async function fetchLocalTemplate(templateFilename: string): Promise<ModelTemplate | null> {
  // Check memory cache first
  if (templateCache[templateFilename]) {
    return templateCache[templateFilename];
  }

  try {
    const response = await fetch(`/templates/${templateFilename}`);
    if (!response.ok) {
      return null;
    }

    const template = await response.json();
    // Cache in memory
    templateCache[templateFilename] = template;
    return template as ModelTemplate;
  } catch (error) {
    console.error('Error loading local template:', error);
    return null;
  }
}

/**
 * Fetch template from IPFS (fallback)
 */
async function fetchIPFSTemplate(cid: string): Promise<ModelTemplate | null> {
  const IPFS_GATEWAY = 'https://ipfs.arbius.org/ipfs';

  try {
    // Clean CID
    const cleanCid = cid.replace('ipfs://', '').replace(/^0x/, '').trim();

    if (!cleanCid || cleanCid.length < 10) {
      return null;
    }

    // If CID looks like hex (starts with 1220), use directly
    const url = cleanCid.startsWith('1220')
      ? `${IPFS_GATEWAY}/${cleanCid}`
      : `${IPFS_GATEWAY}/${cleanCid}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Failed to fetch template from IPFS:', response.statusText);
      return null;
    }

    const template = await response.json();
    return template as ModelTemplate;
  } catch (error) {
    console.error('Error fetching template from IPFS:', error);
    return null;
  }
}

/**
 * Fetch and parse a model template
 * Tries local cache first, then falls back to IPFS
 *
 * @param modelIdOrCid - Either the model ID (hash) or the template CID
 */
export async function fetchModelTemplate(modelIdOrCid: string): Promise<ModelTemplate | null> {
  if (!modelIdOrCid) return null;

  try {
    // Try to load from local cache using model ID
    const mapping = await loadModelMapping();

    if (mapping && mapping.models[modelIdOrCid]) {
      const templateFilename = mapping.models[modelIdOrCid];
      console.log(`Loading template from local cache: ${templateFilename}`);
      const template = await fetchLocalTemplate(templateFilename);

      if (template) {
        return template;
      }
    }

    // Fallback to IPFS if not in local cache
    console.log('Template not in local cache, fetching from IPFS...');
    return await fetchIPFSTemplate(modelIdOrCid);
  } catch (error) {
    console.error('Error fetching model template:', error);
    return null;
  }
}

/**
 * Get the expected output type from a model template
 */
export function getExpectedOutputType(template: ModelTemplate | null): 'image' | 'video' | 'text' | 'json' | undefined {
  if (!template || !template.output || template.output.length === 0) {
    return undefined;
  }

  // Return the first output type
  return template.output[0].type || undefined;
}

/**
 * Get all expected output filenames from a model template
 */
export function getExpectedOutputs(template: ModelTemplate | null): Array<{ filename: string; type: string }> {
  if (!template || !template.output) {
    return [];
  }

  return template.output;
}

/**
 * Format input parameters from a model template for display
 */
export function formatInputParameters(template: ModelTemplate | null): Array<{ name: string; type: string; description: string; required: boolean }> {
  if (!template || !template.input) {
    return [];
  }

  return template.input.map(input => ({
    name: input.variable,
    type: input.type,
    description: input.description || '',
    required: input.required
  }));
}
