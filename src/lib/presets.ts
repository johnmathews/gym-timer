import yaml from "js-yaml";
import rawPresets from "$presets";

export interface Preset {
  name: string;
  work: number; // seconds
  rest: number; // seconds
  reps: number;
}

export function parsePresets(data: unknown): Preset[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("presets.yml must contain a non-empty array");
  }
  return data.map((entry: unknown, i: number) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Preset ${i}: must be an object`);
    }
    const obj = entry as Record<string, unknown>;
    if (typeof obj.name !== "string" || obj.name.trim() === "") {
      throw new Error(`Preset ${i}: name must be a non-empty string`);
    }
    if (typeof obj.work !== "number" || !Number.isInteger(obj.work) || obj.work < 1) {
      throw new Error(`Preset ${i}: work must be a positive integer`);
    }
    if (typeof obj.rest !== "number" || !Number.isInteger(obj.rest) || obj.rest < 0) {
      throw new Error(`Preset ${i}: rest must be a non-negative integer`);
    }
    if (typeof obj.reps !== "number" || !Number.isInteger(obj.reps) || obj.reps < 1) {
      throw new Error(`Preset ${i}: reps must be a positive integer`);
    }
    return { name: obj.name.trim(), work: obj.work, rest: obj.rest, reps: obj.reps };
  });
}

/** Build-time defaults compiled from presets.yml */
export const DEFAULT_PRESETS: Preset[] = parsePresets(rawPresets);

/**
 * Fetch presets from the server at runtime.
 * Returns parsed presets if the server has a mounted presets.yml,
 * or null if the fetch fails (caller should fall back to defaults).
 */
export async function fetchPresets(): Promise<Preset[] | null> {
  try {
    const res = await fetch("/presets.yml");
    if (!res.ok) return null;
    const text = await res.text();
    const data = yaml.load(text);
    return parsePresets(data);
  } catch {
    return null;
  }
}
