// Spaced Repetition System (SRS) — mastery tracking
export interface MasteryEntry {
  wordId: string;
  level: number;
  nextReviewDate: number;
  lastScore: number;
  intervalDays: number;
}

const STORAGE_KEY = "nur_mastery";
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];

export function loadMastery(): Record<string, MasteryEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMastery(mastery: Record<string, MasteryEntry>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mastery));
}

export function updateMastery(wordId: string, score: number): void {
  const mastery = loadMastery();
  const entry = mastery[wordId] ?? {
    wordId,
    level: 0,
    nextReviewDate: Date.now(),
    lastScore: 0,
    intervalDays: 0,
  };

  if (score >= 0.9) entry.level = Math.min(5, entry.level + 1);
  else if (score < 0.7) entry.level = Math.max(0, entry.level - 1);
  entry.intervalDays = INTERVAL_DAYS[entry.level];
  entry.lastScore = score;
  entry.nextReviewDate = Date.now() + entry.intervalDays * 24 * 60 * 60 * 1000;
  mastery[wordId] = entry;
  saveMastery(mastery);
}

export function getDueWords(): string[] {
  const now = Date.now();
  return Object.values(loadMastery())
    .filter((e) => e.nextReviewDate <= now && e.level < 5)
    .map((e) => e.wordId);
}

export function masteryStats() {
  const all = Object.values(loadMastery());
  const mastered = all.filter((e) => e.level >= 5).length;
  const learning = all.filter((e) => e.level > 0 && e.level < 5).length;
  return { total: all.length, mastered, learning };
}
