/**
 * HAYQ Reward Event catalog — central source of truth for all earnable events.
 * Wraps the wallet abstraction so business logic never hardcodes amounts.
 */
import { wallet, type HayqReason } from "./wallet";

export const HAYQ_EVENTS = {
  exercise_correct:    { amount: 10,  reason: "exercise_correct" as HayqReason },
  lesson_complete:     { amount: 50,  reason: "lesson_complete" as HayqReason },
  lesson_perfect:      { amount: 100, reason: "lesson_perfect" as HayqReason },
  module_complete:     { amount: 250, reason: "module_complete" as HayqReason },
  daily_lesson:        { amount: 20,  reason: "daily_lesson" as HayqReason },
  perfect_streak:      { amount: 75,  reason: "perfect_streak" as HayqReason },
  review_complete:     { amount: 30,  reason: "review_complete" as HayqReason },
  streak_milestone_7:  { amount: 100, reason: "streak_milestone" as HayqReason },
  streak_milestone_30: { amount: 500, reason: "streak_milestone" as HayqReason },
  dialogue_complete:   { amount: 100, reason: "dialogue_complete" as HayqReason },
  conversation_milestone: { amount: 200, reason: "conversation_milestone" as HayqReason },
} as const;

export type HayqEventKey = keyof typeof HAYQ_EVENTS;

export function award(event: HayqEventKey, meta?: Record<string, unknown>) {
  const ev = HAYQ_EVENTS[event];
  return wallet.credit(ev.amount, ev.reason, meta);
}
