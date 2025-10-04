import {
  getExpectedOutputType,
  getExpectedOutputs,
  formatInputParameters,
  ModelTemplate
} from '@/lib/templates';

describe('templates', () => {
  const mockTemplate: ModelTemplate = {
    meta: {
      title: 'Test Model',
      description: 'A test model',
      docker: 'test/image:latest',
      version: 1
    },
    input: [
      {
        variable: 'prompt',
        type: 'string',
        required: true,
        description: 'The prompt text'
      },
      {
        variable: 'width',
        type: 'number',
        required: false,
        default: 512,
        description: 'Image width',
        min: 128,
        max: 2048
      },
      {
        variable: 'steps',
        type: 'number',
        required: true,
        description: 'Number of steps',
        choices: [10, 20, 30, 50]
      }
    ],
    output: [
      {
        filename: 'output.png',
        type: 'image'
      },
      {
        filename: 'metadata.json',
        type: 'json'
      }
    ]
  };

  describe('getExpectedOutputType', () => {
    it('should return undefined for null template', () => {
      expect(getExpectedOutputType(null)).toBeUndefined();
    });

    it('should return undefined for template with no output', () => {
      const template = { ...mockTemplate, output: [] };
      expect(getExpectedOutputType(template)).toBeUndefined();
    });

    it('should return first output type', () => {
      expect(getExpectedOutputType(mockTemplate)).toBe('image');
    });

    it('should handle video output', () => {
      const template: ModelTemplate = {
        ...mockTemplate,
        output: [{ filename: 'output.mp4', type: 'video' }]
      };
      expect(getExpectedOutputType(template)).toBe('video');
    });

    it('should handle text output', () => {
      const template: ModelTemplate = {
        ...mockTemplate,
        output: [{ filename: 'output.txt', type: 'text' }]
      };
      expect(getExpectedOutputType(template)).toBe('text');
    });

    it('should handle json output', () => {
      const template: ModelTemplate = {
        ...mockTemplate,
        output: [{ filename: 'output.json', type: 'json' }]
      };
      expect(getExpectedOutputType(template)).toBe('json');
    });
  });

  describe('getExpectedOutputs', () => {
    it('should return empty array for null template', () => {
      expect(getExpectedOutputs(null)).toEqual([]);
    });

    it('should return empty array for template with no output', () => {
      const template = { ...mockTemplate, output: undefined } as any;
      expect(getExpectedOutputs(template)).toEqual([]);
    });

    it('should return all outputs', () => {
      const outputs = getExpectedOutputs(mockTemplate);
      expect(outputs).toHaveLength(2);
      expect(outputs[0]).toEqual({ filename: 'output.png', type: 'image' });
      expect(outputs[1]).toEqual({ filename: 'metadata.json', type: 'json' });
    });

    it('should return outputs in order', () => {
      const outputs = getExpectedOutputs(mockTemplate);
      expect(outputs[0].type).toBe('image');
      expect(outputs[1].type).toBe('json');
    });
  });

  describe('formatInputParameters', () => {
    it('should return empty array for null template', () => {
      expect(formatInputParameters(null)).toEqual([]);
    });

    it('should return empty array for template with no input', () => {
      const template = { ...mockTemplate, input: undefined } as any;
      expect(formatInputParameters(template)).toEqual([]);
    });

    it('should format all input parameters', () => {
      const params = formatInputParameters(mockTemplate);
      expect(params).toHaveLength(3);
    });

    it('should include required fields', () => {
      const params = formatInputParameters(mockTemplate);
      expect(params[0]).toEqual({
        name: 'prompt',
        type: 'string',
        description: 'The prompt text',
        required: true
      });
    });

    it('should include optional fields', () => {
      const params = formatInputParameters(mockTemplate);
      expect(params[1]).toEqual({
        name: 'width',
        type: 'number',
        description: 'Image width',
        required: false
      });
    });

    it('should handle missing descriptions', () => {
      const template: ModelTemplate = {
        ...mockTemplate,
        input: [
          {
            variable: 'test',
            type: 'string',
            required: true,
            description: undefined as any
          }
        ]
      };
      const params = formatInputParameters(template);
      expect(params[0].description).toBe('');
    });

    it('should preserve parameter order', () => {
      const params = formatInputParameters(mockTemplate);
      expect(params.map(p => p.name)).toEqual(['prompt', 'width', 'steps']);
    });

    it('should handle fields with choices', () => {
      const params = formatInputParameters(mockTemplate);
      expect(params[2]).toEqual({
        name: 'steps',
        type: 'number',
        description: 'Number of steps',
        required: true
      });
    });
  });
});
