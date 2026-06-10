/**
 * NUR Lingo — Content Generator
 * Turns the unified ContentLesson database into MultiLesson[] for any LangPair.
 * Plugs into the existing engine; no UI/architecture changes.
 */

import type { LangCode, LangPair, MultiExercise, MultiLesson, MultiUnit } from "../i18n/multilingual";
import {
  CONTENT_LESSONS, WORLDS, getAllLessonsOrdered,
  type ContentLesson, type PhraseItem, type VocabItem,
} from "./database";

// HAYQ rewards (per spec)
const HAYQ = {
  CORRECT: 10,
  PERFECT_LESSON: 50,
  DIALOGUE: 100,
  WORLD: 500,
};

function pairToLangs(pair: LangPair): { source: LangCode; target: LangCode } {
  const [s, t] = pair.split("-") as [LangCode, LangCode];
  return { source: s, target: t };
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickDistractors<T>(pool: T[], exclude: T, n: number, key: (x: T) => string): T[] {
  const filtered = pool.filter(x => key(x) !== key(exclude));
  return shuffle(filtered).slice(0, n);
}

// ─── Exercise builders (per concept) ─────────────────────────────────────────

function buildMC(
  v: VocabItem, idx: number, lesson: ContentLesson,
  source: LangCode, target: LangCode, vocabPool: VocabItem[]
): MultiExercise {
  const correct = v[target];
  const distractors = pickDistractors(vocabPool, v, 3, x => x.id).map(d => d[target]);
  const options = shuffle([correct, ...distractors]);
  return {
    id: `${lesson.id}_mc_${idx}`,
    type: "multiple_choice",
    prompt: {
      en: `What is "${v.en}" in ${langName("en", target)}?`,
      hy: `Ի՞նչ է «${v.hy}»-ը ${langName("hy", target)}ով։`,
      ru: `Как «${v.ru}» по-${langName("ru", target).toLowerCase()}?`,
    },
    targetAnswer: correct,
    acceptableAnswers: [correct],
    options,
    hayqReward: HAYQ.CORRECT,
  };
}

function buildTranslate(
  ph: PhraseItem, idx: number, lesson: ContentLesson,
  source: LangCode, target: LangCode
): MultiExercise {
  const targetAnswer = ph[target];
  const altsTarget = ph.alt?.[target] ?? [];
  return {
    id: `${lesson.id}_tr_${idx}`,
    type: "translate",
    prompt: {
      en: `Translate to ${langName("en", target)}: "${ph.en}"`,
      hy: `Թարգմանի՛ր ${langName("hy", target)}ով՝ «${ph.hy}»։`,
      ru: `Переведите на ${langName("ru", target).toLowerCase()}: «${ph.ru}»`,
    },
    targetAnswer,
    acceptableAnswers: [targetAnswer, ...altsTarget],
    hayqReward: HAYQ.CORRECT,
  };
}

function buildWordOrder(
  ph: PhraseItem, idx: number, lesson: ContentLesson,
  source: LangCode, target: LangCode
): MultiExercise | null {
  const sentence = ph[target];
  const words = sentence.replace(/[.!?,;:«»"]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  return {
    id: `${lesson.id}_wo_${idx}`,
    type: "word_order",
    prompt: {
      en: `Arrange the words: "${ph.en}"`,
      hy: `Դասավորի՛ր բառերը՝ «${ph.hy}»։`,
      ru: `Расставьте слова: «${ph.ru}»`,
    },
    targetAnswer: sentence,
    acceptableAnswers: [sentence, ...(ph.alt?.[target] ?? [])],
    words: shuffle(words),
    hayqReward: HAYQ.CORRECT,
  };
}

function langName(inLang: LangCode, target: LangCode): string {
  const names: Record<LangCode, Record<LangCode, string>> = {
    en: { en: "English", hy: "Armenian", ru: "Russian" },
    hy: { en: "անգլերեն", hy: "հայերեն", ru: "ռուսերեն" },
    ru: { en: "английский", hy: "армянский", ru: "русский" },
  };
  return names[inLang][target];
}

function buildMatchPairs(
  lesson: ContentLesson, idx: number, source: LangCode, target: LangCode
): MultiExercise | null {
  const picks = shuffle(lesson.vocabulary).slice(0, 4);
  if (picks.length < 3) return null;
  const pairs: Array<[string, string]> = picks.map(v => [v[source], v[target]]);
  return {
    id: `${lesson.id}_mp_${idx}`,
    type: "match_pairs",
    prompt: {
      en: "Match the pairs",
      hy: "Համապատասխանեցրու զույգերը",
      ru: "Соедините пары",
    },
    targetAnswer: pairs.map(p => p.join("=")).join("|"),
    pairs,
    hayqReward: HAYQ.CORRECT,
  };
}

function buildListening(
  ph: PhraseItem, idx: number, lesson: ContentLesson, target: LangCode
): MultiExercise {
  const answer = ph[target];
  return {
    id: `${lesson.id}_ls_${idx}`,
    type: "listening",
    prompt: {
      en: "Listen and type what you hear",
      hy: "Լսիր և գրիր լսածդ",
      ru: "Послушайте и напишите",
    },
    targetAnswer: answer,
    acceptableAnswers: [answer, ...(ph.alt?.[target] ?? [])],
    ttsText: answer,
    ttsLang: target,
    hayqReward: HAYQ.CORRECT,
  };
}

// ─── Lesson generator ────────────────────────────────────────────────────────

function generateExercises(
  lesson: ContentLesson, source: LangCode, target: LangCode
): MultiExercise[] {
  const out: MultiExercise[] = [];

  // 1) Multiple choice on vocabulary (first 6 items)
  for (let i = 0; i < Math.min(6, lesson.vocabulary.length); i++) {
    out.push(buildMC(lesson.vocabulary[i], i, lesson, source, target, lesson.vocabulary));
  }

  // 2) Translation on phrases (first 6 phrases)
  for (let i = 0; i < Math.min(6, lesson.phrases.length); i++) {
    out.push(buildTranslate(lesson.phrases[i], i, lesson, source, target));
  }

  // 3) Word order on shorter phrases (next 3)
  for (let i = 6; i < Math.min(9, lesson.phrases.length); i++) {
    const ex = buildWordOrder(lesson.phrases[i], i, lesson, source, target);
    if (ex) out.push(ex);
  }

  // 4) Match pairs from vocabulary
  const mp = buildMatchPairs(lesson, 0, source, target);
  if (mp) out.push(mp);

  // 5) Listening on a phrase (uses Web Speech API on client)
  if (lesson.phrases.length > 0) {
    out.push(buildListening(lesson.phrases[0], 0, lesson, target));
  }

  return out;
}

export function contentLessonToMulti(
  lesson: ContentLesson, pair: LangPair
): MultiLesson {
  const { source, target } = pairToLangs(pair);
  const exercises = generateExercises(lesson, source, target);
  return {
    id: lesson.id,
    unitId: lesson.worldId,
    cefr: lesson.difficulty,
    difficulty: ({ A1: 1, A2: 2, B1: 3, B2: 4 } as const)[lesson.difficulty] ?? 1,
    title: lesson.title,
    description: lesson.concept,
    estimatedMinutes: 8,
    hayqTotal: HAYQ.PERFECT_LESSON + exercises.length * HAYQ.CORRECT,
    exercises,
  };
}

// ─── Review challenges (every 5 lessons) ─────────────────────────────────────

export function generateReviewChallenge(
  lessons: ContentLesson[], pair: LangPair, reviewIndex: number
): MultiLesson {
  const { source, target } = pairToLangs(pair);
  const allVocab = lessons.flatMap(l => l.vocabulary);
  const allPhrases = lessons.flatMap(l => l.phrases);
  const exercises: MultiExercise[] = [];

  // Mix: 5 MCs + 5 translations from the prior 5 lessons
  const vocabPicks = shuffle(allVocab).slice(0, 5);
  vocabPicks.forEach((v, i) => exercises.push(buildMC(v, i, lessons[0], source, target, allVocab)));

  const phrasePicks = shuffle(allPhrases).slice(0, 5);
  phrasePicks.forEach((ph, i) => exercises.push(buildTranslate(ph, i, lessons[0], source, target)));

  return {
    id: `review_${reviewIndex}_${lessons[0].id}`,
    unitId: lessons[0].worldId,
    cefr: lessons[lessons.length - 1].difficulty,
    difficulty: 2,
    title: {
      en: `Review Challenge ${reviewIndex}`,
      hy: `Կրկնության մարտահրավեր ${reviewIndex}`,
      ru: `Повторение ${reviewIndex}`,
    },
    description: {
      en: `Mixed practice from lessons ${lessons[0].id} – ${lessons[lessons.length - 1].id}`,
      hy: `Խառը պրակտիկա նախորդ դասերից`,
      ru: `Смешанная практика предыдущих уроков`,
    },
    estimatedMinutes: 10,
    hayqTotal: HAYQ.PERFECT_LESSON + exercises.length * HAYQ.CORRECT,
    exercises,
  };
}

// ─── Public API: generate everything for a pair ──────────────────────────────

export function generateCurriculumForPair(pair: LangPair): {
  units: MultiUnit[];
  lessons: MultiLesson[];
} {
  const ordered = getAllLessonsOrdered();
  const lessons: MultiLesson[] = [];

  let reviewCounter = 0;
  let batch: ContentLesson[] = [];

  for (const l of ordered) {
    lessons.push(contentLessonToMulti(l, pair));
    batch.push(l);
    if (batch.length === 5) {
      reviewCounter++;
      lessons.push(generateReviewChallenge(batch, pair, reviewCounter));
      batch = [];
    }
  }
  // Trailing remainder review (if any)
  if (batch.length >= 3) {
    reviewCounter++;
    lessons.push(generateReviewChallenge(batch, pair, reviewCounter));
  }

  const units: MultiUnit[] = WORLDS.map(w => ({
    id: w.id,
    title: w.title,
    description: w.description,
    iconEmoji: w.iconEmoji,
    colorFrom: w.colorFrom,
    colorTo: w.colorTo,
    lessons: lessons.filter(l => l.unitId === w.id).map(l => l.id),
  }));

  return { units, lessons };
}

export { CONTENT_LESSONS, WORLDS };
export type { ContentLesson };
