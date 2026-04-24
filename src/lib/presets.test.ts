import { describe, it, expect } from 'vitest';
import { PRESETS } from './presets';

describe('presets', () => {
  it('has at least one preset', () => {
    expect(PRESETS.length).toBeGreaterThan(0);
  });

  it('all presets are unique combinations', () => {
    const keys = PRESETS.map(p => `${p.work}-${p.rest}-${p.reps}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all work values are within slider range (5-600s) and on 5s grid', () => {
    for (const p of PRESETS) {
      expect(p.work).toBeGreaterThanOrEqual(5);
      expect(p.work).toBeLessThanOrEqual(600);
      expect(p.work % 5).toBe(0);
    }
  });

  it('all rest values are within slider range (0-300s) and on 5s grid', () => {
    for (const p of PRESETS) {
      expect(p.rest).toBeGreaterThanOrEqual(0);
      expect(p.rest).toBeLessThanOrEqual(300);
      expect(p.rest % 5).toBe(0);
    }
  });

  it('all reps are within slider range (1-20)', () => {
    for (const p of PRESETS) {
      expect(p.reps).toBeGreaterThanOrEqual(1);
      expect(p.reps).toBeLessThanOrEqual(20);
    }
  });

  it('first preset matches default values (60s work, 0s rest, 10 reps)', () => {
    expect(PRESETS[0]).toEqual({ work: 60, rest: 0, reps: 10 });
  });
});
