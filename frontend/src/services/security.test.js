/**
 * @file security.test.js
 * @description Unit tests for security utilities: input sanitization,
 *   seat validation, rate limiting, and API key masking.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeInput,
  validateSeatInput,
  checkRateLimit,
  maskApiKey
} from '../services/security';

describe('sanitizeInput', () => {
  it('strips HTML tags from input', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('removes HTML anchor injection', () => {
    expect(sanitizeInput('<a href="evil.com">click</a>')).toBe('click');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('enforces maximum length', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeInput(long).length).toBe(500);
  });

  it('respects custom maxLength', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello');
  });

  it('returns empty string for non-string inputs', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(42)).toBe('');
  });

  it('passes through clean plain text unchanged', () => {
    expect(sanitizeInput('Where are the restrooms?')).toBe('Where are the restrooms?');
  });
});

describe('validateSeatInput', () => {
  it('accepts valid seat codes', () => {
    expect(validateSeatInput('Z2').valid).toBe(true);
    expect(validateSeatInput('104').valid).toBe(true);
    expect(validateSeatInput('South Stand').valid).toBe(true);
    expect(validateSeatInput('A-12').valid).toBe(true);
  });

  it('accepts empty input (General Admission)', () => {
    expect(validateSeatInput('').valid).toBe(true);
    expect(validateSeatInput('   ').valid).toBe(true);
  });

  it('rejects seat codes that are too long', () => {
    const { valid, error } = validateSeatInput('A'.repeat(25));
    expect(valid).toBe(false);
    expect(error).toContain('too long');
  });

  it('rejects special characters like <, >, &', () => {
    expect(validateSeatInput('<script>').valid).toBe(false);
    expect(validateSeatInput('Z2&admin').valid).toBe(false);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within window', () => {
    // Use unique keys to avoid state bleed between tests
    expect(checkRateLimit('test-allow-1', 3, 60000)).toBe(true);
    expect(checkRateLimit('test-allow-1', 3, 60000)).toBe(true);
    expect(checkRateLimit('test-allow-1', 3, 60000)).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    checkRateLimit('test-block-1', 2, 60000);
    checkRateLimit('test-block-1', 2, 60000);
    expect(checkRateLimit('test-block-1', 2, 60000)).toBe(false);
  });

  it('resets after window expires', () => {
    checkRateLimit('test-reset-1', 1, 60000);
    expect(checkRateLimit('test-reset-1', 1, 60000)).toBe(false);

    vi.advanceTimersByTime(61000);
    expect(checkRateLimit('test-reset-1', 1, 60000)).toBe(true);
  });
});

describe('maskApiKey', () => {
  it('masks all but last 4 characters', () => {
    const masked = maskApiKey('AIzaSyBjbY5mQ4tg5VlKUmGJZW2WVXJ7NUCEdoc');
    expect(masked.endsWith('Edoc')).toBe(true);
    expect(masked.startsWith('•')).toBe(true);
  });

  it('handles short keys gracefully', () => {
    expect(maskApiKey('abc')).toBe('••••');
    expect(maskApiKey('')).toBe('••••');
  });
});
