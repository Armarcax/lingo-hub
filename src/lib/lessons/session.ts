/**
 * Lesson Session — exit/resume + mistake tracking + smart retry
 * Tasks 2, 3, 5
 */
import type { MultiExercise, LangPair } from "../i18n/multilingual";

const KEY = "nur_lesson_session_v1";
const MISTAKES_KEY = "nur_lesson_mistakes_v1";

export interface LessonSession {
  lessonId: string;
  pair: LangPair;
  stepIndex: number;
  totalSteps: number;
  hayqEarned: number;
  correctCount: number;
  startedAt: number;
  updatedAt: number;
}

export function saveSession(s: LessonSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, updatedAt: Date.now() }));
  } catch {}
}

export function loadSession(): LessonSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as LessonSession;
    // Auto-expire after 24h
    if (Date.now() - s.updatedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

// ─── Mistake bank (per-lesson, for smart retry at end) ───────────────────────

export interface MistakeRecord {
  exerciseId: string;
  exercise: MultiExercise;
  attempts: number;
  revealed: boolean;
}

export function logMistake(lessonId: string, ex: MultiExercise, attempts: number, revealed: boolean) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    const all: Record<string, MistakeRecord[]> = raw ? JSON.parse(raw) : {};
    const list = all[lessonId] ?? [];
    const existing = list.findIndex(m => m.exerciseId === ex.id);
    const rec: MistakeRecord = { exerciseId: ex.id, exercise: ex, attempts, revealed };
    if (existing >= 0) list[existing] = rec;
    else list.push(rec);
    all[lessonId] = list;
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(all));
  } catch {}
}

export function getMistakes(lessonId: string): MistakeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, MistakeRecord[]>;
    return all[lessonId] ?? [];
  } catch {
    return [];
  }
}

export function clearMistakes(lessonId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as Record<string, MistakeRecord[]>;
    delete all[lessonId];
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(all));
  } catch {}
}

// Smart retry queue: returns exercises that need retry (clone with new ids)
export function buildRetryQueue(lessonId: string): MultiExercise[] {
  return getMistakes(lessonId).map(m => ({
    ...m.exercise,
    id: `${m.exercise.id}_retry`,
  }));
}
