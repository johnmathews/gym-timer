import { describe, it, expect } from "vitest";
import { DEFAULT_PRESETS, parsePresets } from "./presets";

describe("parsePresets", () => {
  it("parses valid preset data", () => {
    const data = [
      { name: "A", work: 60, rest: 0, reps: 10 },
      { name: "B", work: 30, rest: 15, reps: 5 },
    ];
    const result = parsePresets(data);
    expect(result).toEqual(data);
  });

  it("trims whitespace from names", () => {
    const data = [{ name: "  Tabata  ", work: 20, rest: 10, reps: 8 }];
    expect(parsePresets(data)[0].name).toBe("Tabata");
  });

  it("throws on empty array", () => {
    expect(() => parsePresets([])).toThrow("non-empty array");
  });

  it("throws on non-array input", () => {
    expect(() => parsePresets("bad")).toThrow("non-empty array");
    expect(() => parsePresets(null)).toThrow("non-empty array");
  });

  it("throws on missing name", () => {
    expect(() => parsePresets([{ work: 60, rest: 0, reps: 10 }])).toThrow("name");
  });

  it("throws on empty name", () => {
    expect(() => parsePresets([{ name: "  ", work: 60, rest: 0, reps: 10 }])).toThrow("name");
  });

  it("throws on non-integer work", () => {
    expect(() => parsePresets([{ name: "A", work: 5.5, rest: 0, reps: 1 }])).toThrow("work");
  });

  it("throws on zero work", () => {
    expect(() => parsePresets([{ name: "A", work: 0, rest: 0, reps: 1 }])).toThrow("work");
  });

  it("throws on negative rest", () => {
    expect(() => parsePresets([{ name: "A", work: 60, rest: -1, reps: 1 }])).toThrow("rest");
  });

  it("throws on zero reps", () => {
    expect(() => parsePresets([{ name: "A", work: 60, rest: 0, reps: 0 }])).toThrow("reps");
  });

  it("throws on non-object entry", () => {
    expect(() => parsePresets(["bad"])).toThrow("must be an object");
  });
});

describe("DEFAULT_PRESETS (loaded from test fixture)", () => {
  it("has at least one preset", () => {
    expect(DEFAULT_PRESETS.length).toBeGreaterThan(0);
  });

  it("all presets have names", () => {
    for (const p of DEFAULT_PRESETS) {
      expect(p.name).toBeTruthy();
    }
  });

  it("all presets are unique combinations", () => {
    const keys = DEFAULT_PRESETS.map((p) => `${p.work}-${p.rest}-${p.reps}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("all work values are within slider range (5-600s) and on 5s grid", () => {
    for (const p of DEFAULT_PRESETS) {
      expect(p.work).toBeGreaterThanOrEqual(5);
      expect(p.work).toBeLessThanOrEqual(600);
      expect(p.work % 5).toBe(0);
    }
  });

  it("all rest values are within slider range (0-300s) and on 5s grid", () => {
    for (const p of DEFAULT_PRESETS) {
      expect(p.rest).toBeGreaterThanOrEqual(0);
      expect(p.rest).toBeLessThanOrEqual(300);
      expect(p.rest % 5).toBe(0);
    }
  });

  it("all reps are within slider range (1-20)", () => {
    for (const p of DEFAULT_PRESETS) {
      expect(p.reps).toBeGreaterThanOrEqual(1);
      expect(p.reps).toBeLessThanOrEqual(20);
    }
  });

  it("first preset matches test fixture defaults (60s work, 0s rest, 10 reps)", () => {
    expect(DEFAULT_PRESETS[0]).toEqual({ name: "Test EMOM", work: 60, rest: 0, reps: 10 });
  });
});
