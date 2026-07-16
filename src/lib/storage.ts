// localStorage-backed persistence, mirroring the extension's chrome.storage
// wrapper but synchronous under the hood (kept async so call sites don't care).
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants";
import type { Resume, Settings, TemplateOverride } from "./types";

export function mergeDeep<T extends Record<string, any>>(target: T, source: any): T {
  if (!source || typeof source !== "object") {
    return target;
  }
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      (target as any)[key] = structuredClone(value);
      continue;
    }
    if (value && typeof value === "object") {
      if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
        (target as any)[key] = {};
      }
      mergeDeep(target[key], value);
      continue;
    }
    (target as any)[key] = value;
  }
  return target;
}

function readRaw<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function getSettings(): Promise<Settings> {
  const stored = readRaw<Settings>(STORAGE_KEYS.settings);
  const merged = mergeDeep(structuredClone(DEFAULT_SETTINGS), stored || {});
  for (const providerId of DEFAULT_SETTINGS.providerOrder) {
    if (!merged.providerOrder.includes(providerId)) {
      merged.providerOrder.push(providerId);
    }
  }
  return merged;
}

export async function saveSettings(settings: Settings): Promise<void> {
  writeRaw(STORAGE_KEYS.settings, settings);
}

export async function getResume(): Promise<Resume | null> {
  return readRaw<Resume>(STORAGE_KEYS.resume);
}

export async function saveResume(resume: Resume): Promise<void> {
  writeRaw(STORAGE_KEYS.resume, resume);
}

// Only ever written when the person clicks "Save" in Settings > Templates -
// edits are held in local component state until then (see TemplatesTab.tsx),
// so a stray keystroke can't silently overwrite a saved template.
export async function getTemplateOverrides(): Promise<Record<string, TemplateOverride>> {
  return readRaw<Record<string, TemplateOverride>>(STORAGE_KEYS.templateOverrides) || {};
}

export async function saveTemplateOverrides(overrides: Record<string, TemplateOverride>): Promise<void> {
  writeRaw(STORAGE_KEYS.templateOverrides, overrides);
}
