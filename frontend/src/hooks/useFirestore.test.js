/**
 * @file useFirestore.test.js
 * @description Unit tests for the useFirestore hook covering data shape,
 *   loading state transitions, and simulation update logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Firebase services so tests don't need real credentials
vi.mock('../services/firebase', () => ({
  trackEvent: vi.fn(),
  db: {}
}));

import { useFirestore } from './useFirestore';

describe('useFirestore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts and resolves with venue data after initialization', async () => {
    const { result } = renderHook(() => useFirestore());

    await act(async () => {});
    expect(result.current.loading).toBe(false);
    expect(result.current.venueData).not.toBeNull();
  });

  it('provides correct top-level venue data structure', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    const { venueData } = result.current;
    expect(venueData.name).toBe('Apex Arena');
    expect(venueData.total_capacity).toBe(60000);
    expect(Array.isArray(venueData.gates)).toBe(true);
    expect(Array.isArray(venueData.zones)).toBe(true);
    expect(Array.isArray(venueData.concessions)).toBe(true);
    expect(Array.isArray(venueData.restrooms)).toBe(true);
    expect(Array.isArray(venueData.medical_posts)).toBe(true);
    expect(Array.isArray(venueData.parking)).toBe(true);
  });

  it('has 4 gates with required fields', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    const { gates } = result.current.venueData;
    expect(gates).toHaveLength(4);
    gates.forEach(gate => {
      expect(gate).toHaveProperty('id');
      expect(gate).toHaveProperty('name');
      expect(gate).toHaveProperty('wait_minutes');
      expect(gate.wait_minutes).toBeGreaterThan(0);
    });
  });

  it('has restrooms with accessibility flag', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    const { restrooms } = result.current.venueData;
    const accessible = restrooms.filter(r => r.accessible === true);
    expect(accessible.length).toBeGreaterThanOrEqual(1);
    restrooms.forEach(r => {
      expect(typeof r.accessible).toBe('boolean');
      expect(r.wait_minutes).toBeGreaterThan(0);
    });
  });

  it('parking lots have positive availability and capacity', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    result.current.venueData.parking.forEach(lot => {
      expect(lot.available).toBeGreaterThanOrEqual(0);
      expect(lot.capacity).toBeGreaterThan(0);
      expect(lot.available).toBeLessThanOrEqual(lot.capacity);
    });
  });

  it('sets lastUpdated timestamp on load', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('updates data after 30 second simulation interval', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    const initialWait = result.current.venueData.gates[0].wait_minutes;
    
    // Run 30 seconds of fake time
    await act(async () => {
      vi.advanceTimersByTime(30001);
    });

    // Data should have potentially changed (mutation is random but structure stays valid)
    const { gates } = result.current.venueData;
    gates.forEach(gate => {
      expect(gate.wait_minutes).toBeGreaterThanOrEqual(1);
      expect(gate.wait_minutes).toBeLessThanOrEqual(20);
    });
  });

  it('medical posts have required fields and realistic wait times', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    const { medical_posts } = result.current.venueData;
    expect(medical_posts).toHaveLength(2);
    medical_posts.forEach(post => {
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('is_24hr');
      expect(typeof post.is_24hr).toBe('boolean');
      expect(post.wait_minutes).toBeGreaterThan(0);
    });
  });

  it('zones have occupancy within capacity bounds', async () => {
    const { result } = renderHook(() => useFirestore());
    await act(async () => {});

    result.current.venueData.zones.forEach(zone => {
      expect(zone.current_occupancy).toBeGreaterThanOrEqual(0);
      expect(zone.current_occupancy).toBeLessThanOrEqual(zone.capacity);
    });
  });
});
