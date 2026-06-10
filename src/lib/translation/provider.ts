/**
 * Translation Provider abstraction.
 * Priority chain: Internal Dictionary → (future) Google Translate → (future) AI provider.
 * Business logic depends only on TranslationProvider, never on a concrete impl.
 */
import dataset from "../lexicon/dataset.json";
import type { LangCode } from "../curriculum/types";

export interface TranslationProvider {
  name: string;
  translate(text: string, source: LangCode, target: LangCode): Promise<string | null>;
  detectLanguage?(text: string): Promise<LangCode | null>;
}

type Entry = { en: string; hy: string; ru: string };
const DICT = dataset as Record<string, Entry>;

// Reverse-indexes built lazily for non-English source lookups.
const REVERSE: Record<LangCode, Map<string, string>> = {
  en: new Map(),
  hy: new Map(),
  ru: new Map(),
};
let reverseBuilt = false;
function buildReverse() {
  if (reverseBuilt) return;
  for (const [key, e] of Object.entries(DICT)) {
    REVERSE.en.set(e.en.toLowerCase(), key);
    REVERSE.hy.set(e.hy.toLowerCase(), key);
    REVERSE.ru.set(e.ru.toLowerCase(), key);
  }
  reverseBuilt = true;
}

export const dictionaryProvider: TranslationProvider = {
  name: "internal-dictionary",
  async translate(text, source, target) {
    if (!text) return null;
    if (source === target) return text;
    buildReverse();
    const key = REVERSE[source].get(text.trim().toLowerCase());
    if (!key) return null;
    const entry = DICT[key];
    return entry?.[target] ?? null;
  },
};

// Stub providers — pluggable, not enabled yet.
export const googleTranslateProvider: TranslationProvider = {
  name: "google-translate",
  async translate() { return null; },
};

export const aiTranslateProvider: TranslationProvider = {
  name: "ai-gateway",
  async translate() { return null; },
};

const CHAIN: TranslationProvider[] = [
  dictionaryProvider,
  googleTranslateProvider,
  aiTranslateProvider,
];

export async function translate(text: string, source: LangCode, target: LangCode): Promise<string | null> {
  for (const p of CHAIN) {
    const r = await p.translate(text, source, target);
    if (r) return r;
  }
  return null;
}
