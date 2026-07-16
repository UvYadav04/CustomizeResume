import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SkillItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function normalizeWhitespace(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/ /g, " ")
    .trim();
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatTextWithBoldMarkers(value: unknown): string {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function safeJsonParse<T>(value: string, fallback: T | null = null): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toSkillNameMap(list: SkillItem[] = []) {
  const map = new Map<string, SkillItem>();
  for (const item of list) {
    map.set(normalizeWhitespace(item.name).toLowerCase(), {
      name: item.name,
      bold: Boolean(item.bold)
    });
  }
  return map;
}

export function parseSkillWhitelist(value: string[] | string = []): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeWhitespace(item)).filter(Boolean);
  }
  return String(value || "")
    .split(/[\n,]/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
}

export function sanitizeSkillList(
  suggestedList: SkillItem[] = [],
  currentList: SkillItem[] = [],
  options: { maxItems?: number } = {}
): SkillItem[] {
  const currentMap = toSkillNameMap(currentList);
  const maxItems = Number(options.maxItems || 0);
  const used = new Set<string>();
  const sanitized: SkillItem[] = [];

  for (const item of suggestedList) {
    const key = normalizeWhitespace(item?.name).toLowerCase();
    if (!key || !currentMap.has(key) || used.has(key)) {
      continue;
    }
    sanitized.push({
      name: currentMap.get(key)!.name,
      bold: Boolean(item.bold)
    });
    used.add(key);
    if (maxItems && sanitized.length >= maxItems) {
      return sanitized;
    }
  }

  for (const item of currentList) {
    const key = normalizeWhitespace(item.name).toLowerCase();
    if (used.has(key)) {
      continue;
    }
    sanitized.push({ name: item.name, bold: Boolean(item.bold) });
    if (maxItems && sanitized.length >= maxItems) {
      return sanitized;
    }
  }

  return sanitized;
}

export function summarizeAttempts(attempts: { provider: string; status: string }[] = []) {
  return attempts.map((attempt) => `${attempt.provider}: ${attempt.status}`).join(" | ");
}

export function downloadFile(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
