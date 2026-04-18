/**
 * @file api.test.js
 * @description Integration tests for the chatWithAssistant fallback parser,
 *   validating correct intent detection and map_highlight routing for all
 *   major user query categories.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally — backend not available in test env
global.fetch = vi.fn(() => Promise.reject(new Error('Network unavailable in test')));

import { chatWithAssistant } from '../services/api';

describe('chatWithAssistant — offline intent fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure fetch always fails so fallback always runs in tests
    global.fetch = vi.fn(() => Promise.reject(new Error('Network unavailable')));
  });

  it('returns a valid response object shape', async () => {
    const result = await chatWithAssistant('hello', {}, []);
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('suggested_actions');
    expect(typeof result.response).toBe('string');
    expect(Array.isArray(result.suggested_actions)).toBe(true);
  });

  it('detects restroom intent and highlights R2', async () => {
    const result = await chatWithAssistant('Where are the restrooms?', {}, []);
    expect(result.map_highlight).toBe('R2');
    expect(result.response.toLowerCase()).toMatch(/restroom|r2|south/);
  });

  it('detects toilet intent (synonym) and highlights R2', async () => {
    const result = await chatWithAssistant('I need to use the toilet', {}, []);
    expect(result.map_highlight).toBe('R2');
  });

  it('detects bathroom intent (synonym) and highlights R2', async () => {
    const result = await chatWithAssistant('bathroom please', {}, []);
    expect(result.map_highlight).toBe('R2');
  });

  it('detects food/concession intent and highlights C2', async () => {
    const result = await chatWithAssistant('Where can I get food?', {}, []);
    expect(result.map_highlight).toBe('C2');
    expect(result.response.toLowerCase()).toMatch(/food|kiosk|south|wait/);
  });

  it('detects hungry intent (synonym) and highlights C2', async () => {
    const result = await chatWithAssistant("I'm hungry", {}, []);
    expect(result.map_highlight).toBe('C2');
  });

  it('detects exit intent and highlights G2', async () => {
    const result = await chatWithAssistant('What is the best exit?', {}, []);
    expect(result.map_highlight).toBe('G2');
    expect(result.response.toLowerCase()).toMatch(/gate|south|exit/);
  });

  it('detects parking intent and highlights P1', async () => {
    const result = await chatWithAssistant('How is parking?', {}, []);
    expect(['P1', 'P2']).toContain(result.map_highlight);
  });

  it('detects medical intent and highlights M2', async () => {
    const result = await chatWithAssistant('Where is medical help?', {}, []);
    expect(result.map_highlight).toBe('M2');
    expect(result.response).toMatch(/M2|South|medical|first aid/i);
  });

  it('returns non-empty suggested_actions for every intent', async () => {
    const queries = [
      'restroom', 'food', 'exit', 'parking', 'medical'
    ];
    for (const query of queries) {
      const result = await chatWithAssistant(query, {}, []);
      expect(result.suggested_actions.length).toBeGreaterThan(0);
      result.suggested_actions.forEach(action => {
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('query');
        expect(action.label.length).toBeGreaterThan(0);
      });
    }
  });

  it('handles generic question gracefully with helpful response', async () => {
    const result = await chatWithAssistant('Tell me about the stadium', {}, []);
    expect(result.response.length).toBeGreaterThan(10);
    expect(result.suggested_actions.length).toBeGreaterThan(0);
  });

  it('handles empty message without crashing', async () => {
    const result = await chatWithAssistant('', {}, []);
    expect(typeof result.response).toBe('string');
  });
});
