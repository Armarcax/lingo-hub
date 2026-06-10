/**
 * NUR Lingo — HAYQ Wallet & Ledger Abstraction (Task 8)
 *
 * Thin abstraction layered on top of `src/lib/rewards/seeds.ts`.
 * - Provides a single audited entry point for every HAYQ mutation.
 * - Persists an append-only ledger (last 200 entries) for transparency.
 * - Future-proof: swap localStorage backend for a server wallet without
 *   touching call sites.
 *
 * NOTE: This is additive. Existing rewards logic still works as-is.
 *       New code should prefer `wallet.credit()` / `wallet.debit()`.
 */

import { loadRewards, saveRewards, type UserRewards } from "../rewards/seeds";

const LEDGER_KEY = "nur_hayq_ledger_v1";
const MAX_ENTRIES = 200;

export type HayqReason =
  | "exercise_correct"
  | "lesson_perfect"
  | "lesson_complete"
  | "review_complete"
  | "dialogue_complete"
  | "world_complete"
  | "streak_bonus"
  | "daily_goal"
  | "purchase_heart_refill"
  | "purchase_streak_freeze"
  | "manual_adjust";

export interface LedgerEntry {
  id: string;
  ts: number;
  delta: number;        // positive = credit, negative = debit
  reason: HayqReason;
  balanceAfter: number;
  meta?: Record<string, unknown>;
}

function readLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLedger(entries: LedgerEntry[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(LEDGER_KEY, JSON.stringify(trimmed));
  } catch {}
}

function appendEntry(delta: number, reason: HayqReason, balanceAfter: number, meta?: Record<string, unknown>) {
  const entry: LedgerEntry = {
    id: `hayq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    delta,
    reason,
    balanceAfter,
    meta,
  };
  const all = readLedger();
  all.push(entry);
  writeLedger(all);
  return entry;
}

// ─── Public wallet API ──────────────────────────────────────────────────────

export const wallet = {
  balance(): number {
    return loadRewards().totalHAYQ;
  },

  credit(amount: number, reason: HayqReason, meta?: Record<string, unknown>): UserRewards {
    if (amount <= 0) return loadRewards();
    const current = loadRewards();
    const updated: UserRewards = { ...current, totalHAYQ: current.totalHAYQ + amount };
    saveRewards(updated);
    appendEntry(amount, reason, updated.totalHAYQ, meta);
    return updated;
  },

  debit(amount: number, reason: HayqReason, meta?: Record<string, unknown>): { ok: boolean; rewards: UserRewards; error?: string } {
    if (amount <= 0) return { ok: true, rewards: loadRewards() };
    const current = loadRewards();
    if (current.totalHAYQ < amount) {
      return { ok: false, rewards: current, error: "Insufficient HAYQ balance" };
    }
    const updated: UserRewards = { ...current, totalHAYQ: current.totalHAYQ - amount };
    saveRewards(updated);
    appendEntry(-amount, reason, updated.totalHAYQ, meta);
    return { ok: true, rewards: updated };
  },

  history(limit = 50): LedgerEntry[] {
    return readLedger().slice(-limit).reverse();
  },

  clearHistory() {
    writeLedger([]);
  },
};
