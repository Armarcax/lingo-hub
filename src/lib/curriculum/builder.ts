/**
 * Curriculum Builder — generates Course/Module/Lesson structures from
 * the dictionary dataset + topic specs, for any supported language pair.
 *
 * No content is hardcoded into React. All lessons are produced as JSON
 * objects and cached in-memory per (pair) key.
 */
import dataset from "../lexicon/dataset.json";
import type { LangPair, MultiExercise } from "../i18n/multilingual";
import { TOPICS } from "./topics";
import type {
  CourseContent, ModuleContent, LessonContent,
  VocabularyEntry, DialogueScenario, MultiText, LangCode,
} from "./types";

type DictEntry = { en: string; hy: string; ru: string };
const DICT = dataset as Record<string, DictEntry>;

const LESSON_SIZE = 6; // ~6 vocab per lesson

function entry(word: string): DictEntry | null {
  return DICT[word.toLowerCase()] ?? null;
}

function mt(e: DictEntry): MultiText {
  return { en: e.en, hy: e.hy, ru: e.ru };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExercisesForVocab(
  lessonId: string,
  vocab: VocabularyEntry[],
  pair: LangPair,
): MultiExercise[] {
  const [src, tgt] = pair.split("-") as [LangCode, LangCode];
  const ex: MultiExercise[] = [];

  vocab.forEach((v, i) => {
    const target = v.word[tgt];
    const prompt = v.word[src];
    const distractors = shuffle(vocab.filter(x => x.id !== v.id))
      .slice(0, 3)
      .map(x => x.word[tgt]);
    const options = shuffle([target, ...distractors]);

    // Multiple choice
    ex.push({
      id: `${lessonId}_mc_${i}`,
      type: "multiple_choice",
      prompt: { en: `Choose: ${v.word.en}`, hy: `Ընտրիր՝ ${v.word.hy}`, ru: `Выбери: ${v.word.ru}` },
      options,
      targetAnswer: target,
      acceptableAnswers: [target],
      hint: v.word,
      hayqReward: 5,
    });

    // Translate
    ex.push({
      id: `${lessonId}_tr_${i}`,
      type: "translate",
      prompt: { en: `Translate: ${prompt}`, hy: `Թարգմանիր՝ ${prompt}`, ru: `Переведи: ${prompt}` },
      targetAnswer: target,
      acceptableAnswers: [target],
      hint: v.word,
      hayqReward: 10,
    });
  });

  // Match pairs (one per lesson)
  ex.push({
    id: `${lessonId}_match`,
    type: "match_pairs",
    prompt: { en: "Match the pairs", hy: "Կապիր զույգերը", ru: "Сопоставь пары" },
    targetAnswer: "",
    pairs: vocab.slice(0, 4).map(v => [v.word[src], v.word[tgt]] as [string, string]),
    hayqReward: 15,
  });

  return ex;
}

function buildLessons(
  moduleId: string,
  topicId: string,
  words: string[],
  pair: LangPair,
): LessonContent[] {
  const valid = words.map(entry).filter((e): e is DictEntry => !!e);
  const lessons: LessonContent[] = [];
  let order = 1;
  for (let i = 0; i < valid.length; i += LESSON_SIZE) {
    const chunk = valid.slice(i, i + LESSON_SIZE);
    if (chunk.length < 3) break;
    const lessonId = `${moduleId}_l${order}`;
    const vocab: VocabularyEntry[] = chunk.map((e, idx) => ({
      id: `${lessonId}_v${idx}`,
      word: mt(e),
    }));
    const exercises = buildExercisesForVocab(lessonId, vocab, pair);
    lessons.push({
      id: lessonId,
      moduleId,
      order,
      title: {
        en: `${topicId.replace(/_/g, " ")} — Part ${order}`,
        hy: `Մաս ${order}`,
        ru: `Часть ${order}`,
      },
      estimatedMinutes: 5,
      vocabulary: vocab,
      phrases: [],
      exercises,
      dialogues: [],
      rewards: { baseHAYQ: 50, perfectBonus: 25 },
    });
    order++;
  }
  return lessons;
}

function buildDialogue(topicId: string): DialogueScenario | null {
  const map: Record<string, DialogueScenario["scenario"]> = {
    food_dining: "restaurant",
    travel: "hotel",
    transport: "airport",
    work: "interview",
    shopping: "shopping",
    health: "doctor",
    social_communication: "everyday",
  };
  const scenario = map[topicId];
  if (!scenario) return null;
  return {
    id: `${topicId}_dlg`,
    title: { en: `${scenario} dialogue`, hy: `Երկխոսություն`, ru: `Диалог` },
    scenario,
    turns: [],
    hayqReward: 100,
  };
}

const CACHE = new Map<LangPair, CourseContent>();

export function buildCourse(pair: LangPair): CourseContent {
  const cached = CACHE.get(pair);
  if (cached) return cached;

  const courseId = `course_${pair}`;
  const modules: ModuleContent[] = TOPICS.map((t, i) => {
    const moduleId = `${courseId}_${t.id}`;
    const lessons = buildLessons(moduleId, t.id, t.words, pair);
    const dlg = buildDialogue(t.id);
    if (dlg && lessons.length > 0) {
      lessons[lessons.length - 1].dialogues.push(dlg);
    }
    return {
      id: moduleId,
      courseId,
      order: i + 1,
      title: t.title,
      description: t.title,
      icon: t.icon,
      lessons,
    };
  }).filter(m => m.lessons.length > 0);

  const course: CourseContent = {
    id: courseId,
    pair,
    title: { en: "NUR Lingo Course", hy: "ՆՈՒՐ Լինգո Դասընթաց", ru: "Курс NUR Lingo" },
    modules,
  };
  CACHE.set(pair, course);
  return course;
}

export function getModule(pair: LangPair, moduleId: string): ModuleContent | null {
  return buildCourse(pair).modules.find(m => m.id === moduleId) ?? null;
}

export function getLesson(pair: LangPair, lessonId: string): LessonContent | null {
  for (const m of buildCourse(pair).modules) {
    const l = m.lessons.find(x => x.id === lessonId);
    if (l) return l;
  }
  return null;
}

export function courseStats(pair: LangPair) {
  const c = buildCourse(pair);
  const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalExercises = c.modules.reduce(
    (s, m) => s + m.lessons.reduce((s2, l) => s2 + l.exercises.length, 0), 0);
  return { modules: c.modules.length, lessons: totalLessons, exercises: totalExercises };
}
