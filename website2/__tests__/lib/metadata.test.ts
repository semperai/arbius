/**
 * Tests for metadata utilities
 */

import { defaultMetadata, createMetadata } from '@/lib/metadata';

describe('metadata', () => {
  describe('defaultMetadata', () => {
    it('should have correct metadataBase', () => {
      expect(defaultMetadata.metadataBase).toBeInstanceOf(URL);
      expect(defaultMetadata.metadataBase?.toString()).toBe('https://arbius.ai/');
    });

    it('should have correct title', () => {
      expect(defaultMetadata.title).toBe('Arbius - Decentralized Machine Learning');
    });

    it('should have correct description', () => {
      expect(defaultMetadata.description).toBe(
        'Decentralized network for machine learning with a fixed total supply token.'
      );
    });

    it('should have correct openGraph properties', () => {
      expect(defaultMetadata.openGraph).toBeDefined();
      expect(defaultMetadata.openGraph?.siteName).toBe('Arbius');
      expect(defaultMetadata.openGraph?.locale).toBe('en_US');
      expect(defaultMetadata.openGraph?.type).toBe('website');
    });

    it('should have correct twitter properties', () => {
      expect(defaultMetadata.twitter).toBeDefined();
      expect(defaultMetadata.twitter?.creator).toBe('@arbius_ai');
      expect(defaultMetadata.twitter?.card).toBe('summary_large_image');
    });

    it('should be a complete metadata object', () => {
      expect(defaultMetadata).toMatchObject({
        metadataBase: expect.any(URL),
        title: expect.any(String),
        description: expect.any(String),
        openGraph: expect.any(Object),
        twitter: expect.any(Object),
      });
    });
  });

  describe('createMetadata', () => {
    it('should return default metadata when no overrides provided', () => {
      const metadata = createMetadata({});

      expect(metadata.title).toBe(defaultMetadata.title);
      expect(metadata.description).toBe(defaultMetadata.description);
      expect(metadata.metadataBase).toBe(defaultMetadata.metadataBase);
    });

    it('should override title', () => {
      const customTitle = 'Custom Page Title';
      const metadata = createMetadata({ title: customTitle });

      expect(metadata.title).toBe(customTitle);
      expect(metadata.description).toBe(defaultMetadata.description);
    });

    it('should override description', () => {
      const customDescription = 'Custom page description';
      const metadata = createMetadata({ description: customDescription });

      expect(metadata.description).toBe(customDescription);
      expect(metadata.title).toBe(defaultMetadata.title);
    });

    it('should merge openGraph properties', () => {
      const metadata = createMetadata({
        openGraph: {
          title: 'Custom OG Title',
        },
      });

      expect(metadata.openGraph?.title).toBe('Custom OG Title');
      expect(metadata.openGraph?.siteName).toBe('Arbius');
      expect(metadata.openGraph?.locale).toBe('en_US');
      expect(metadata.openGraph?.type).toBe('website');
    });

    it('should merge twitter properties', () => {
      const metadata = createMetadata({
        twitter: {
          title: 'Custom Twitter Title',
        },
      });

      expect(metadata.twitter?.title).toBe('Custom Twitter Title');
      expect(metadata.twitter?.creator).toBe('@arbius_ai');
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });

    it('should handle multiple overrides', () => {
      const metadata = createMetadata({
        title: 'Custom Title',
        description: 'Custom Description',
        openGraph: {
          title: 'Custom OG Title',
          description: 'Custom OG Description',
        },
        twitter: {
          title: 'Custom Twitter Title',
        },
      });

      expect(metadata.title).toBe('Custom Title');
      expect(metadata.description).toBe('Custom Description');
      expect(metadata.openGraph?.title).toBe('Custom OG Title');
      expect(metadata.openGraph?.description).toBe('Custom OG Description');
      expect(metadata.twitter?.title).toBe('Custom Twitter Title');
    });

    it('should preserve default values when partially overriding openGraph', () => {
      const metadata = createMetadata({
        openGraph: {
          url: 'https://arbius.ai/custom-page',
        },
      });

      expect(metadata.openGraph?.url).toBe('https://arbius.ai/custom-page');
      expect(metadata.openGraph?.siteName).toBe('Arbius');
      expect(metadata.openGraph?.locale).toBe('en_US');
      expect(metadata.openGraph?.type).toBe('website');
    });

    it('should preserve default values when partially overriding twitter', () => {
      const metadata = createMetadata({
        twitter: {
          site: '@arbius_ai',
        },
      });

      expect(metadata.twitter?.site).toBe('@arbius_ai');
      expect(metadata.twitter?.creator).toBe('@arbius_ai');
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });

    it('should handle undefined openGraph in overrides', () => {
      const metadata = createMetadata({
        title: 'Custom Title',
      });

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.siteName).toBe('Arbius');
    });

    it('should handle undefined twitter in overrides', () => {
      const metadata = createMetadata({
        title: 'Custom Title',
      });

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.creator).toBe('@arbius_ai');
    });

    it('should allow overriding all default properties', () => {
      const metadata = createMetadata({
        title: 'New Title',
        description: 'New Description',
        metadataBase: new URL('https://example.com'),
        openGraph: {
          siteName: 'New Site',
          locale: 'fr_FR',
          type: 'article',
        },
        twitter: {
          creator: '@new_creator',
          card: 'summary',
        },
      });

      expect(metadata.title).toBe('New Title');
      expect(metadata.description).toBe('New Description');
      expect(metadata.metadataBase?.toString()).toBe('https://example.com/');
      expect(metadata.openGraph?.siteName).toBe('New Site');
      expect(metadata.openGraph?.locale).toBe('fr_FR');
      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.twitter?.creator).toBe('@new_creator');
      expect(metadata.twitter?.card).toBe('summary');
    });

    it('should create independent metadata objects', () => {
      const metadata1 = createMetadata({ title: 'Title 1' });
      const metadata2 = createMetadata({ title: 'Title 2' });

      expect(metadata1.title).toBe('Title 1');
      expect(metadata2.title).toBe('Title 2');
      expect(metadata1.title).not.toBe(metadata2.title);
    });
  });
});
