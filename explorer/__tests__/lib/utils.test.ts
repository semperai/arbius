import {
  cn,
  truncateMiddle,
  truncateString,
  formatDate,
  formatDuration,
  formatTimeAgo
} from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle tailwind merge conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });
  });

  describe('truncateMiddle', () => {
    it('should return empty string for empty input', () => {
      expect(truncateMiddle('', 10)).toBe('');
    });

    it('should return original string if shorter than maxLength', () => {
      expect(truncateMiddle('short', 10)).toBe('short');
    });

    it('should truncate string in the middle', () => {
      expect(truncateMiddle('0x1234567890abcdef', 10)).toBe('0x123...bcdef');
    });

    it('should handle odd maxLength', () => {
      expect(truncateMiddle('0x1234567890abcdef', 11)).toBe('0x1234...bcdef');
    });
  });

  describe('truncateString', () => {
    it('should return original string if shorter than maxLength', () => {
      expect(truncateString('short', 10)).toBe('short');
    });

    it('should truncate string with ellipsis', () => {
      expect(truncateString('0x1234567890abcdef', 10)).toBe('0x123...bcdef');
    });
  });

  describe('formatDate', () => {
    it('should return "N/A" for invalid timestamp', () => {
      expect(formatDate(0)).toBe('N/A');
    });

    it('should format Unix timestamp correctly', () => {
      const timestamp = 1704067200; // Jan 1, 2024 00:00:00 UTC
      const result = formatDate(timestamp);
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to minutes', () => {
      expect(formatDuration(180)).toBe('3 minutes');
    });

    it('should format seconds to single minute', () => {
      expect(formatDuration(60)).toBe('1 minute');
    });

    it('should format seconds to hours', () => {
      expect(formatDuration(7200)).toBe('2 hours');
    });

    it('should format seconds to single hour', () => {
      expect(formatDuration(3600)).toBe('1 hour');
    });

    it('should format seconds to days', () => {
      expect(formatDuration(172800)).toBe('2 days');
    });

    it('should format seconds to single day', () => {
      expect(formatDuration(86400)).toBe('1 day');
    });

    it('should handle less than a minute', () => {
      expect(formatDuration(30)).toBe('0 minutes');
    });
  });

  describe('formatTimeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format seconds ago', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 30;
      expect(formatTimeAgo(timestamp)).toBe('30 sec ago');
    });

    it('should format minutes ago', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 300;
      expect(formatTimeAgo(timestamp)).toBe('5 min ago');
    });

    it('should format hours ago', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 7200;
      expect(formatTimeAgo(timestamp)).toBe('2 hr ago');
    });

    it('should format days ago', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 172800;
      expect(formatTimeAgo(timestamp)).toBe('2 days ago');
    });

    it('should format old dates as localized date string', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 2592000; // 30 days
      const result = formatTimeAgo(timestamp);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });
});
