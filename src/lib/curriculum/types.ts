/**
 * Curriculum Architecture
 * Course → Module → Lesson → Phases (learn/practice/review/challenge/dialogue/assessment)
 *
 * All curriculum content is JSON-driven. No hardcoded React content.
 */
import type { LangPair, MultiExercise } from "../i18n/multilingual";

export type LangCode = "en" | "hy" | "ru";

export interface MultiText {
  en: string;
  hy: string;
  ru: string;
}

export interface VocabularyEntry {
  id: string;
  word: MultiText;
  hint?: MultiText;
  image?: string;
  audio?: string;
}

export interface PhraseEntry {
  id: string;
  text: MultiText;
  context?: string;
}

export interface DialogueTurn {
  speaker: "nuri" | "user";
  text: MultiText;
  expectedReplyHints?: MultiText;
}

export interface DialogueScenario {
  id: string;
  title: MultiText;
  scenario: "restaurant" | "airport" | "hotel" | "interview" | "shopping" | "doctor" | "everyday";
  turns: DialogueTurn[];
  hayqReward: number;
}

export type LessonPhase = "learn" | "practice" | "review" | "challenge" | "dialogue" | "assessment";

export interface LessonContent {
  id: string;
  moduleId: string;
  order: number;
  title: MultiText;
  description?: MultiText;
  estimatedMinutes: number;
  vocabulary: VocabularyEntry[];
  phrases: PhraseEntry[];
  exercises: MultiExercise[];
  dialogues: DialogueScenario[];
  rewards: { baseHAYQ: number; perfectBonus: number };
}

export interface ModuleContent {
  id: string;
  courseId: string;
  order: number;
  title: MultiText;
  description: MultiText;
  icon: string;
  lessons: LessonContent[];
}

export interface CourseContent {
  id: string;
  pair: LangPair;
  title: MultiText;
  modules: ModuleContent[];
}

export interface TopicSpec {
  id: string;
  title: MultiText;
  icon: string;
  /** Lemmas (lowercase English keys) to look up in the dictionary dataset. */
  words: string[];
  /** Optional curated phrases per topic. */
  phrases?: PhraseEntry[];
  /** Optional dialogue scenarios for this topic. */
  dialogues?: DialogueScenario[];
}
