/**
 * Unified Lexicon — canonical multilingual dictionary loader.
 * Source: master-dictionary.json (1152 entries, id/hy/en/ru + audio paths).
 * Personal seed: user-dictionary.seed.json (208 user-contributed entries).
 *
 * Audio files live at /audio/{lang}/{id}.mp3 (uploaded separately to GitHub).
 */
import master from "./master-dictionary.json";
import userSeed from "./user-dictionary.seed.json";
import type { LangCode } from "../i18n";

export interface LexEntry {
  id: string;
  hy: string;
  en: string;
  ru: string;
  type: "vocab" | "user";
  isUserAdded?: boolean;
  audio?: Record<LangCode, string>;
}

const MASTER = master as LexEntry[];
const USER_SEED = userSeed as LexEntry[];

const USER_KEY = "nur_user_dictionary_v1";

export function getMaster(): LexEntry[] {
  return MASTER;
}

export function getUserEntries(): LexEntry[] {
  if (typeof window === "undefined") return USER_SEED;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      localStorage.setItem(USER_KEY, JSON.stringify(USER_SEED));
      return USER_SEED;
    }
    return JSON.parse(raw) as LexEntry[];
  } catch {
    return USER_SEED;
  }
}

export function saveUserEntries(entries: LexEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(entries));
}

export function addUserEntry(hy: string, en: string, ru: string): LexEntry {
  const entries = getUserEntries();
  const nextId = `9${String(900000 + entries.length + 1).slice(-6)}`;
  const entry: LexEntry = { id: nextId, hy, en, ru, type: "user", isUserAdded: true };
  entries.push(entry);
  saveUserEntries(entries);
  return entry;
}

export function getAll(): LexEntry[] {
  return [...MASTER, ...getUserEntries()];
}

export function search(query: string, lang?: LangCode): LexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAll().filter((e) => {
    if (lang) return e[lang]?.toLowerCase().includes(q);
    return (
      e.hy.toLowerCase().includes(q) ||
      e.en.toLowerCase().includes(q) ||
      e.ru.toLowerCase().includes(q)
    );
  }).slice(0, 100);
}

export function findById(id: string): LexEntry | null {
  return getAll().find((e) => e.id === id) ?? null;
}

export function audioUrl(id: string, lang: LangCode): string {
  return `/audio/${lang}/${id}.mp3`;
}
