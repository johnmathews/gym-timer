import { log } from "./logger";

export const PRESETS_STORAGE_KEY = "timer-presets";
export const STORAGE_VERSION = 1;
export const MAX_NAME_LENGTH = 40;

export interface Preset {
  id: string;
  name: string;
  work: number; // seconds
  rest: number; // seconds
  reps: number;
}

export type PresetValues = Pick<Preset, "work" | "rest" | "reps">;
export type SaveResult = { ok: true } | { ok: false; error: string };

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;
type CryptoLike = { randomUUID?: () => string };
type NavigatorLike = { storage?: { persist?: () => Promise<boolean> } };

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Accessing localStorage throws when storage is disabled
    return null;
  }
}

function isInt(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min;
}

function isValidValues(values: Record<string, unknown>): boolean {
  return isInt(values.work, 1) && isInt(values.rest, 0) && isInt(values.reps, 1);
}

/** Trimmed name if it is 1–MAX_NAME_LENGTH characters, otherwise null. */
export function normalizeName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_NAME_LENGTH ? trimmed : null;
}

function validatePreset(entry: unknown): Preset | null {
  if (typeof entry !== "object" || entry === null) return null;
  const obj = entry as Record<string, unknown>;
  const name = normalizeName(obj.name);
  if (typeof obj.id !== "string" || obj.id === "" || name === null || !isValidValues(obj)) return null;
  return { id: obj.id, name, work: obj.work as number, rest: obj.rest as number, reps: obj.reps as number };
}

function requireName(name: string): string {
  const normalized = normalizeName(name);
  if (normalized === null) throw new RangeError(`Preset name must be 1–${MAX_NAME_LENGTH} characters`);
  return normalized;
}

function requireValues(values: PresetValues): PresetValues {
  if (!isValidValues(values)) throw new RangeError("Preset values must be work ≥ 1, rest ≥ 0, reps ≥ 1 (integers)");
  return { work: values.work, rest: values.rest, reps: values.reps };
}

export function loadPresets(storage: ReadableStorage | null = browserStorage()): Preset[] {
  if (!storage) return [];
  let raw: string | null;
  try {
    raw = storage.getItem(PRESETS_STORAGE_KEY);
  } catch (err) {
    log("presets:load-invalid", { reason: String(err) });
    return [];
  }
  if (raw === null) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    log("presets:load-invalid", { reason: "unparseable" });
    return [];
  }

  const envelope = data as { version?: unknown; presets?: unknown } | null;
  if (typeof envelope !== "object" || envelope === null || envelope.version !== STORAGE_VERSION || !Array.isArray(envelope.presets)) {
    log("presets:load-invalid", { reason: "envelope" });
    return [];
  }

  const seen = new Set<string>();
  const presets: Preset[] = [];
  for (const entry of envelope.presets) {
    const preset = validatePreset(entry);
    if (preset && !seen.has(preset.id)) {
      seen.add(preset.id);
      presets.push(preset);
    }
  }
  return presets;
}

export function savePresets(presets: readonly Preset[], storage: WritableStorage | null = browserStorage()): SaveResult {
  if (!storage) {
    log("presets:save-failed", { reason: "storage unavailable" });
    return { ok: false, error: "Couldn't save presets: storage is unavailable on this device." };
  }
  try {
    storage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, presets }));
    return { ok: true };
  } catch (err) {
    log("presets:save-failed", { reason: String(err) });
    return { ok: false, error: "Couldn't save presets on this device." };
  }
}

export function addPreset(list: readonly Preset[], name: string, values: PresetValues, id: string = newId()): Preset[] {
  return [...list, { id, name: requireName(name), ...requireValues(values) }];
}

export function updatePreset(list: readonly Preset[], id: string, values: PresetValues): Preset[] {
  const next = requireValues(values);
  return list.map((p) => (p.id === id ? { ...p, ...next } : p));
}

export function renamePreset(list: readonly Preset[], id: string, name: string): Preset[] {
  const next = requireName(name);
  return list.map((p) => (p.id === id ? { ...p, name: next } : p));
}

export function removePreset(list: readonly Preset[], id: string): Preset[] {
  return list.filter((p) => p.id !== id);
}

export function movePreset(list: readonly Preset[], id: string, direction: -1 | 1): Preset[] {
  const from = list.findIndex((p) => p.id === id);
  const to = from + direction;
  const next = [...list];
  if (from === -1 || to < 0 || to >= list.length) return next;
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function matchesValues(preset: PresetValues, values: PresetValues): boolean {
  return preset.work === values.work && preset.rest === values.rest && preset.reps === values.reps;
}

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Default name for a new preset, e.g. "0:30 / 0:15 × 5". */
export function summaryName(values: PresetValues): string {
  return `${clock(values.work)} / ${clock(values.rest)} × ${values.reps}`;
}

let idCounter = 0;

export function newId(cryptoLike: CryptoLike | undefined = globalThis.crypto): string {
  if (typeof cryptoLike?.randomUUID === "function") return cryptoLike.randomUUID();
  idCounter += 1;
  return `p-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Ask the browser to exempt this origin's storage from eviction under disk
 * pressure. Resolves false when the Storage API is missing or the request fails.
 */
export async function requestPersistence(
  nav: NavigatorLike | undefined = typeof navigator === "undefined" ? undefined : navigator,
): Promise<boolean> {
  if (typeof nav?.storage?.persist !== "function") return false;
  try {
    return await nav.storage.persist();
  } catch {
    return false;
  }
}
