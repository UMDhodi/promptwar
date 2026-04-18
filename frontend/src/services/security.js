/**
 * @file security.js
 * @description Client-side security utilities: input sanitization,
 *   rate limiting, and content validation for user-supplied data.
 */

/** Maximum length for user chat messages to prevent prompt injection attacks */
const MAX_MESSAGE_LENGTH = 500;

/** Simple in-memory rate limiter — max N requests per window */
const rateLimitStore = new Map();

/**
 * Sanitizes user input to prevent XSS and prompt injection.
 * Strips HTML tags, control characters, and trims excess whitespace.
 * @param {string} input - Raw user input string
 * @param {number} [maxLength=MAX_MESSAGE_LENGTH] - Maximum allowed length
 * @returns {string} Sanitized string safe for display and API use
 */
export function sanitizeInput(input, maxLength = MAX_MESSAGE_LENGTH) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')  // Remove script blocks entirely
    .replace(/<style[\s\S]*?<\/style>/gi, '')    // Remove style blocks entirely
    .replace(/<[^>]*>/g, '')                      // Strip remaining HTML tags
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')  // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates that a seat section input is a reasonable format.
 * Accepts alphanumeric codes like "Z2", "104", "S-A12".
 * @param {string} seat - User-supplied seat section
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateSeatInput(seat) {
  if (!seat || seat.trim().length === 0) {
    return { valid: true, error: null }; // Empty means General Admission — OK
  }
  const cleaned = seat.trim();
  if (cleaned.length > 20) {
    return { valid: false, error: 'Seat section too long. Please use a short code like "Z2" or "104".' };
  }
  if (!/^[a-zA-Z0-9\-\s]+$/.test(cleaned)) {
    return { valid: false, error: 'Seat section contains invalid characters.' };
  }
  return { valid: true, error: null };
}

/**
 * Rate limiter for chat messages to prevent API abuse.
 * Allows up to `maxRequests` calls within `windowMs` milliseconds per key.
 * @param {string} key - Unique identifier (e.g., user ID or 'local')
 * @param {number} [maxRequests=10] - Max requests per window
 * @param {number} [windowMs=60000] - Window size in ms (default: 1 minute)
 * @returns {boolean} True if request is allowed, false if rate limited
 */
export function checkRateLimit(key = 'local', maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, windowStart: now };

  if (now - record.windowStart > windowMs) {
    // Reset window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limited
  }

  rateLimitStore.set(key, { ...record, count: record.count + 1 });
  return true;
}

/**
 * Masks a sensitive API key for safe display in logs (shows only last 4 chars).
 * @param {string} key
 * @returns {string} Masked key like "••••••••EdOc"
 */
export function maskApiKey(key = '') {
  if (key.length < 4) return '••••';
  return '•'.repeat(Math.max(0, key.length - 4)) + key.slice(-4);
}
