import { describe, it, expect } from 'vitest';
import { PRESETS } from './presets';

describe('presets', () => {
  it('has at least one preset', () => {
    expect(PRESETS.length).toBeGreaterThan(0);
  });

  it('all names are unique', () => {
    const names = PRESETS.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
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

  it('all reps are within slider range (1-10)', () => {
    for (const p of PRESETS) {
      expect(p.reps).toBeGreaterThanOrEqual(1);
      expect(p.reps).toBeLessThanOrEqual(10);
    }
  });

  it('all names are non-empty strings', () => {
    for (const p of PRESETS) {
      expect(typeof p.name).toBe('string');
      expect(p.name.trim().length).toBeGreaterThan(0);
    }
  });
});
