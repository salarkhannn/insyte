import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  it('should format bytes correctly', () => {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
    };

    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('should format numbers with commas', () => {
    const formatNumber = (num: number): string => {
      return new Intl.NumberFormat().format(num);
    };

    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('should merge class names', () => {
    const cn = (...classes: (string | undefined | false)[]): string => {
      return classes.filter(Boolean).join(' ');
    };

    expect(cn('a', 'b')).toBe('a b');
    expect(cn('a', false, 'b')).toBe('a b');
    expect(cn('a', undefined, 'b')).toBe('a b');
  });
});
