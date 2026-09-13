import { describe, it, expect, vi, afterEach } from "vitest";
import {
  PRESETS_STORAGE_KEY,
  PRESETS_BACKUP_KEY,
  MAX_NAME_LENGTH,
  type Preset,
  loadPresets,
  savePresets,
  addPreset,
  updatePreset,
  renamePreset,
  removePreset,
  movePreset,
  matchesValues,
  summaryName,
  newId,
  requestPersistence,
} from "./presetStore";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function envelope(presets: unknown, version: unknown = 1): string {
  return JSON.stringify({ version, presets });
}

const a: Preset = { id: "a", name: "EMOM", work: 60, rest: 0, reps: 10 };
const b: Preset = { id: "b", name: "3 Hangs", work: 30, rest: 15, reps: 3 };
const c: Preset = { id: "c", name: "5 Hangs", work: 30, rest: 15, reps: 5 };

describe("loadPresets", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(loadPresets(new MemoryStorage())).toEqual([]);
  });

  it("returns an empty list when storage is unavailable", () => {
    expect(loadPresets(null)).toEqual([]);
  });

  it("returns an empty list when reading storage throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(loadPresets(storage)).toEqual([]);
  });

  it("loads a valid envelope", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, envelope([a, b]));
    expect(loadPresets(storage)).toEqual([a, b]);
  });

  it("returns an empty list for unparseable JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, "{not json");
    expect(loadPresets(storage)).toEqual([]);
  });

  it("returns an empty list for an unknown version", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, envelope([a], 2));
    expect(loadPresets(storage)).toEqual([]);
  });

  it("returns an empty list when presets is not an array", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, envelope({ a }));
    expect(loadPresets(storage)).toEqual([]);
  });

  it("returns an empty list when the stored value is not an object", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, "42");
    expect(loadPresets(storage)).toEqual([]);
  });

  it("drops invalid entries and keeps valid ones", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      PRESETS_STORAGE_KEY,
      envelope([
        a,
        "not an object",
        null,
        { ...b, id: "" },
        { ...b, name: "   " },
        { ...b, name: "x".repeat(MAX_NAME_LENGTH + 1) },
        { ...b, work: 0 },
        { ...b, work: 1.5 },
        { ...b, rest: -5 },
        { ...b, reps: 0 },
        { ...b, reps: "3" },
        c,
      ]),
    );
    expect(loadPresets(storage)).toEqual([a, c]);
  });

  it("trims stored names", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, envelope([{ ...a, name: "  EMOM  " }]));
    expect(loadPresets(storage)[0].name).toBe("EMOM");
  });

  it("keeps the first entry when ids repeat", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, envelope([a, { ...b, id: "a" }, c]));
    expect(loadPresets(storage)).toEqual([a, c]);
  });
});

describe("backup of unreadable storage", () => {
  it("copies an unparseable value to the backup key before it can be overwritten", () => {
    const storage = new MemoryStorage();
    storage.setItem(PRESETS_STORAGE_KEY, "{not json");
    expect(loadPresets(storage)).toEqual([]);
    expect(storage.getItem(PRESETS_BACKUP_KEY)).toBe("{not json");
  });

  it("copies a value with an unknown version to the backup key", () => {
    const storage = new MemoryStorage();
    const future = envelope([a], 2);
    storage.setItem(PRESETS_STORAGE_KEY, future);
    expect(loadPresets(storage)).toEqual([]);
    expect(storage.getItem(PRESETS_BACKUP_KEY)).toBe(future);
  });

  it("writes no backup for a missing key or a valid envelope", () => {
    const storage = new MemoryStorage();
    loadPresets(storage);
    storage.setItem(PRESETS_STORAGE_KEY, envelope([a]));
    loadPresets(storage);
    expect(storage.getItem(PRESETS_BACKUP_KEY)).toBeNull();
  });

  it("still loads as empty when the backup write fails", () => {
    const storage = {
      getItem: () => "{not json",
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    };
    expect(loadPresets(storage)).toEqual([]);
  });
});

describe("savePresets", () => {
  it("writes a versioned envelope that loadPresets reads back", () => {
    const storage = new MemoryStorage();
    expect(savePresets([a, b], storage)).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem(PRESETS_STORAGE_KEY)!)).toEqual({ version: 1, presets: [a, b] });
    expect(loadPresets(storage)).toEqual([a, b]);
  });

  it("reports failure when setItem throws", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    };
    const result = savePresets([a], storage);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't save/i);
  });

  it("reports failure when storage is unavailable", () => {
    const result = savePresets([a], null);
    expect(result.ok).toBe(false);
  });
});

describe("addPreset", () => {
  it("appends a new preset with a trimmed name and returns a new array", () => {
    const input = [a];
    const result = addPreset(input, "  Tabata ", { work: 20, rest: 10, reps: 8 }, "t");
    expect(result).toEqual([a, { id: "t", name: "Tabata", work: 20, rest: 10, reps: 8 }]);
    expect(result).not.toBe(input);
    expect(input).toEqual([a]);
  });

  it("generates an id when none is given", () => {
    const result = addPreset([], "X", { work: 20, rest: 10, reps: 8 });
    expect(result[0].id).toMatch(/\S+/);
  });

  it("rejects a blank name", () => {
    expect(() => addPreset([], "   ", { work: 20, rest: 10, reps: 8 })).toThrow(RangeError);
  });

  it("rejects a name over the length limit", () => {
    expect(() => addPreset([], "x".repeat(MAX_NAME_LENGTH + 1), { work: 20, rest: 10, reps: 8 })).toThrow(
      RangeError,
    );
  });

  it("accepts a name exactly at the length limit", () => {
    const name = "x".repeat(MAX_NAME_LENGTH);
    expect(addPreset([], name, { work: 20, rest: 10, reps: 8 })[0].name).toBe(name);
  });

  it("rejects invalid values", () => {
    expect(() => addPreset([], "X", { work: 0, rest: 0, reps: 1 })).toThrow(RangeError);
    expect(() => addPreset([], "X", { work: 5, rest: -1, reps: 1 })).toThrow(RangeError);
    expect(() => addPreset([], "X", { work: 5, rest: 0, reps: 0 })).toThrow(RangeError);
  });
});

describe("updatePreset", () => {
  it("replaces the values of the matching preset only", () => {
    const input = [a, b];
    const result = updatePreset(input, "b", { work: 45, rest: 20, reps: 4 });
    expect(result).toEqual([a, { ...b, work: 45, rest: 20, reps: 4 }]);
    expect(input).toEqual([a, b]);
  });

  it("returns the list unchanged for an unknown id", () => {
    expect(updatePreset([a], "zzz", { work: 45, rest: 20, reps: 4 })).toEqual([a]);
  });

  it("rejects invalid values", () => {
    expect(() => updatePreset([a], "a", { work: 0, rest: 0, reps: 1 })).toThrow(RangeError);
  });
});

describe("renamePreset", () => {
  it("renames the matching preset with a trimmed name", () => {
    const input = [a, b];
    expect(renamePreset(input, "a", "  Every Minute ")).toEqual([{ ...a, name: "Every Minute" }, b]);
    expect(input).toEqual([a, b]);
  });

  it("rejects a blank name", () => {
    expect(() => renamePreset([a], "a", "")).toThrow(RangeError);
  });

  it("rejects a name over the length limit", () => {
    expect(() => renamePreset([a], "a", "x".repeat(MAX_NAME_LENGTH + 1))).toThrow(RangeError);
  });

  it("returns the list unchanged for an unknown id", () => {
    expect(renamePreset([a], "zzz", "New")).toEqual([a]);
  });
});

describe("removePreset", () => {
  it("removes the matching preset", () => {
    const input = [a, b, c];
    expect(removePreset(input, "b")).toEqual([a, c]);
    expect(input).toEqual([a, b, c]);
  });

  it("returns the list unchanged for an unknown id", () => {
    expect(removePreset([a], "zzz")).toEqual([a]);
  });
});

describe("movePreset", () => {
  it("moves a preset later", () => {
    const input = [a, b, c];
    expect(movePreset(input, "a", 1)).toEqual([b, a, c]);
    expect(input).toEqual([a, b, c]);
  });

  it("moves a preset earlier", () => {
    expect(movePreset([a, b, c], "c", -1)).toEqual([a, c, b]);
  });

  it("does nothing when moving the first preset earlier", () => {
    expect(movePreset([a, b, c], "a", -1)).toEqual([a, b, c]);
  });

  it("does nothing when moving the last preset later", () => {
    expect(movePreset([a, b, c], "c", 1)).toEqual([a, b, c]);
  });

  it("does nothing for an unknown id", () => {
    expect(movePreset([a, b], "zzz", 1)).toEqual([a, b]);
  });
});

describe("matchesValues", () => {
  it("is true when work, rest and reps all match", () => {
    expect(matchesValues(a, { work: 60, rest: 0, reps: 10 })).toBe(true);
  });

  it("is false when any value differs", () => {
    expect(matchesValues(a, { work: 55, rest: 0, reps: 10 })).toBe(false);
    expect(matchesValues(a, { work: 60, rest: 5, reps: 10 })).toBe(false);
    expect(matchesValues(a, { work: 60, rest: 0, reps: 9 })).toBe(false);
  });
});

describe("summaryName", () => {
  it("formats work / rest × reps in m:ss", () => {
    expect(summaryName({ work: 30, rest: 15, reps: 5 })).toBe("0:30 / 0:15 × 5");
    expect(summaryName({ work: 60, rest: 0, reps: 10 })).toBe("1:00 / 0:00 × 10");
    expect(summaryName({ work: 600, rest: 300, reps: 1 })).toBe("10:00 / 5:00 × 1");
  });
});

describe("newId", () => {
  it("produces unique ids across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });

  it("falls back when crypto.randomUUID is missing", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId({})));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id).toMatch(/^p-/);
  });

  it("uses crypto.randomUUID when present", () => {
    expect(newId({ randomUUID: () => "fixed-uuid" })).toBe("fixed-uuid");
  });
});

describe("default browser storage", () => {
  afterEach(() => {
    // Restore globals first: a test may have stubbed localStorage away
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("uses window.localStorage when no storage is passed", () => {
    expect(savePresets([a])).toEqual({ ok: true });
    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).not.toBeNull();
    expect(loadPresets()).toEqual([a]);
  });

  it("treats a missing localStorage as unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadPresets()).toEqual([]);
    expect(savePresets([a]).ok).toBe(false);
  });

  it("treats a localStorage that throws on access as unavailable", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage")!;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
    try {
      expect(loadPresets()).toEqual([]);
      expect(savePresets([a]).ok).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "localStorage", original);
    }
  });
});

describe("requestPersistence", () => {
  it("uses the global navigator by default", async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal("navigator", { storage: { persist } });
    try {
      await expect(requestPersistence()).resolves.toBe(true);
      expect(persist).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("calls navigator.storage.persist and returns its answer", async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    await expect(requestPersistence({ storage: { persist } })).resolves.toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it("returns false when the Storage API is missing", async () => {
    await expect(requestPersistence({})).resolves.toBe(false);
  });

  it("returns false when persist rejects", async () => {
    const persist = () => Promise.reject(new Error("denied"));
    await expect(requestPersistence({ storage: { persist } })).resolves.toBe(false);
  });
});
