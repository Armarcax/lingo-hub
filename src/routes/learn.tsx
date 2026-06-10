import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nuri, { NuriSpeech, getMoodFromScore, type NuriMood } from "@/components/Nuri";
import { loadLangConfig, type LangCode } from "@/lib/i18n/index";
import { getLessonById, type MultiLesson, type MultiExercise, type LangPair } from "@/lib/i18n/multilingual";
import {
  loadRewards, saveRewards, addRewards, updateStreak, addHAYQ,
  syncHearts, deductHeart, saveCrownLevel,
} from "@/lib/rewards/seeds";
import {
  saveSession, loadSession, clearSession,
  logMistake, getMistakes, clearMistakes, buildRetryQueue,
} from "@/lib/lessons/session";

type AnswerState = "idle" | "submitting" | "correct" | "incorrect" | "revealed";

interface SearchParams {
  lesson?: string;
  pair?: LangPair;
  resume?: number;
}

export const Route = createFileRoute("/learn")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    lesson: typeof s.lesson === "string" ? s.lesson : undefined,
    pair: typeof s.pair === "string" ? s.pair as LangPair : undefined,
    resume: s.resume ? 1 : undefined,
  }),
  component: LearnPage,
});

const NURI_LINES: Record<string, string[]> = {
  correct_perfect: ["Կատարյալ! 🌟", "Հիանալի! 🏆", "Չեմ հավատում! 🎉"],
  correct:         ["Շատ լավ! ✅", "Ճիշտ է! 👍", "Շարունակիր!"],
  almost:          ["Գրեթե! Կրկին փորձիր 💪", "Մոտ էր! 🤏"],
  incorrect:       ["Կարող ես 💪", "Կրկնիր! Կստացվի", "Փորձիր նորից!"],
  reveal:          ["Արի սովորենք միասին 🍎", "Ահա ճիշտ պատասխանը 📖"],
  thinking:        ["Մտածիր... 💭", "🤔"],
  idle:            ["Բարև! 🍎", "Պատրա՞ստ ես:"],
};
const rline = (k: string) => {
  const a = NURI_LINES[k] ?? NURI_LINES.idle;
  return a[Math.floor(Math.random() * a.length)];
};

function LearnPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/learn" });
  const lessonId = search.lesson ?? "";
  const pairParam = search.pair;
  const wantResume = !!search.resume;

  const [lesson, setLesson] = useState<MultiLesson | null>(null);
  const [native, setNative] = useState<LangCode>("en");
  const [pair, setPair] = useState<LangPair>("en-hy");
  const [exercises, setExercises] = useState<MultiExercise[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [complete, setComplete] = useState(false);
  const [phase, setPhase] = useState<"main" | "retry">("main");
  const [retryStartIndex, setRetryStartIndex] = useState(0);

  const [userAnswer, setUserAnswer] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availWords, setAvailWords] = useState<string[]>([]);
  const [state, setState] = useState<AnswerState>("idle");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [nuriMood, setNuriMood] = useState<NuriMood>("idle");
  const [nuriSpeech, setNuriSpeech] = useState(rline("idle"));

  const [sessionHAYQ, setSessionHAYQ] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [startTime] = useState(() => Date.now());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const current = exercises[stepIndex];
  const progress = exercises.length ? ((stepIndex) / exercises.length) * 100 : 0;
  const isLastStep = stepIndex >= exercises.length - 1;

  // Load lesson + maybe resume
  useEffect(() => {
    const cfg = loadLangConfig();
    const p = (pairParam ?? cfg?.pair ?? "en-hy") as LangPair;
    const nat = (cfg?.native ?? "en") as LangCode;
    setNative(nat); setPair(p);

    const l = getLessonById(p, lessonId);
    if (!l) { if (lessonId) navigate({ to: "/world" }); return; }
    setLesson(l);
    setExercises(l.exercises);

    const r = syncHearts();
    setHearts(r.hearts);

    if (wantResume) {
      const s = loadSession();
      if (s && s.lessonId === l.id) {
        setStepIndex(Math.min(s.stepIndex, l.exercises.length - 1));
        setSessionHAYQ(s.hayqEarned);
        setSessionStats({ correct: s.correctCount, total: s.stepIndex });
      }
    } else {
      // fresh start — clear stale mistakes for this lesson
      clearMistakes(l.id);
    }
  }, [lessonId, pairParam, wantResume, navigate]);

  // Persist session on each step change
  useEffect(() => {
    if (!lesson || complete) return;
    saveSession({
      lessonId: lesson.id, pair, stepIndex,
      totalSteps: exercises.length,
      hayqEarned: sessionHAYQ,
      correctCount: sessionStats.correct,
      startedAt: startTime, updatedAt: Date.now(),
    });
  }, [lesson, pair, stepIndex, exercises.length, sessionHAYQ, sessionStats.correct, startTime, complete]);

  // Word-order setup
  useEffect(() => {
    if (current?.type === "word_order" && current.words) {
      setAvailWords([...current.words]); setSelectedWords([]);
    } else { setAvailWords([]); setSelectedWords([]); }
    setUserAnswer(""); setState("idle"); setFeedback(""); setScore(0); setAttempts(0);
    setNuriMood("idle"); setNuriSpeech(rline("idle"));
  }, [stepIndex, current?.id]);

  const goToStep = useCallback((idx: number) => {
    if (idx < 0 || idx >= exercises.length) return;
    setStepIndex(idx);
  }, [exercises.length]);

  const handleNext = useCallback(() => {
    if (!lesson) return;
    if (isLastStep) {
      // End of main phase → check for retry queue
      if (phase === "main") {
        const retryQ = buildRetryQueue(lesson.id);
        if (retryQ.length > 0) {
          setPhase("retry");
          setRetryStartIndex(exercises.length);
          setExercises(prev => [...prev, ...retryQ]);
          setStepIndex(exercises.length);
          return;
        }
      }
      // Truly done
      const perfectBonus = sessionStats.correct === sessionStats.total ? 50 : 0;
      addRewards(perfectBonus, 0, lesson.estimatedMinutes);
      saveCrownLevel(lesson.id, 1);
      clearSession();
      clearMistakes(lesson.id);
      setComplete(true);
      return;
    }
    setStepIndex(stepIndex + 1);
  }, [lesson, isLastStep, phase, exercises.length, stepIndex, sessionStats]);

  const submit = useCallback(async () => {
    if (!current || state === "submitting") return;
    const answer = current.type === "word_order"
      ? selectedWords.join(" ")
      : userAnswer.trim();
    if (!answer) return;

    setState("submitting"); setNuriMood("thinking"); setNuriSpeech(rline("thinking"));

    let accepted = false; let sc = 0; let fb = "";
    try {
      const res = await fetch("/api/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer: answer,
          expectedAnswer: current.targetAnswer,
          englishOriginal: current.prompt["en"] ?? current.targetAnswer,
          allValidAnswers: current.acceptableAnswers || [],
          sourceLanguage: native,
          targetLanguage: pair.split("-")[1],
          useAI: false,
        }),
      });
      const data = await res.json();
      accepted = !!data.accepted; sc = data.score ?? 0; fb = data.feedback ?? "";
    } catch {
      fb = "Connection error";
    }

    setScore(sc); setFeedback(fb);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (accepted) {
      const hayq = current.hayqReward ?? 10;
      setSessionStats(p => ({ correct: p.correct + 1, total: p.total + 1 }));
      const r = loadRewards();
      const updated = addHAYQ(updateStreak(r), hayq);
      saveRewards(updated);
      setSessionHAYQ(s => s + hayq);
      setState("correct");
      setNuriMood(getMoodFromScore(sc, true, 0));
      setNuriSpeech(rline(sc >= 0.98 ? "correct_perfect" : "correct"));
      if (lesson) logMistake(lesson.id, current, nextAttempts, false); // will be ignored on completion if not present
    } else {
      // Mistake recovery: 4-attempt tolerance (attempts 1-3 retry, 4th reveals explanation)
      if (nextAttempts >= 4) {
        // Reveal
        setState("revealed");
        setNuriMood("encouraging");
        setNuriSpeech(rline("reveal"));
        const r = deductHeart();
        setHearts(r.hearts);
        setSessionStats(p => ({ ...p, total: p.total + 1 }));
        if (lesson) logMistake(lesson.id, current, nextAttempts, true);
      } else {
        // Allow retry (no heart loss yet, no count yet)
        setState("incorrect");
        setNuriMood("sad");
        setNuriSpeech(rline(sc >= 0.6 ? "almost" : "incorrect"));
      }
    }
  }, [current, state, selectedWords, userAnswer, attempts, native, pair, lesson]);

  const retrySameStep = useCallback(() => {
    setUserAnswer(""); setSelectedWords([]);
    if (current?.type === "word_order" && current.words) setAvailWords([...current.words]);
    setState("idle"); setFeedback(""); setScore(0);
    setNuriMood("idle"); setNuriSpeech(rline("idle"));
  }, [current]);

  const exitToWorld = () => {
    // Session already saved on each step; allow resume.
    navigate({ to: "/world" });
  };

  if (complete && lesson) {
    return <CompletionScreen
      lesson={lesson} hayq={sessionHAYQ} stats={sessionStats}
      onWorld={() => navigate({ to: "/world" })}
    />;
  }

  if (!lesson || !current) {
    return <div className="min-h-screen flex items-center justify-center bg-[#1a0a0a] text-white">Loading…</div>;
  }

  const isRetryPhase = phase === "retry" && stepIndex >= retryStartIndex;
  const attemptsLeft = Math.max(0, 4 - attempts);

  return (
    <div className="min-h-screen flex flex-col relative text-white bg-[#1a0a0a]">
      {/* Header with full nav (Task 1) */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-white/10 sticky top-0 bg-[#1a0a0a]/95 backdrop-blur z-30">
        <button onClick={() => setShowExitConfirm(true)} aria-label="Exit"
          className="text-white/50 hover:text-white text-2xl px-2">✕</button>
        <button onClick={() => navigate({ to: "/world" })} className="hidden md:flex text-xs text-white/60 hover:text-white px-2 py-1 rounded border border-white/10">
          🌍 World
        </button>
        <div className="flex-1 mx-2">
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full bg-green-500" animate={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-white/40 mt-1 text-center font-bold uppercase">
            {isRetryPhase ? "Smart Retry · " : ""}Step {stepIndex + 1} / {exercises.length}
          </p>
        </div>
        <div className="text-lg whitespace-nowrap">❤️ {hearts}</div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 gap-6">
        <NuriSpeech text={nuriSpeech} mood={nuriMood} />
        <Nuri mood={nuriMood} size={120} />

        <div className="w-full max-w-2xl bg-white/5 p-5 md:p-8 rounded-3xl border border-white/10">
          {isRetryPhase && (
            <p className="text-xs font-black uppercase tracking-widest text-purple-300 mb-2">🔁 Review Mistake</p>
          )}
          <h2 className="text-xl md:text-2xl font-bold mb-4">{current.prompt[native] ?? current.prompt["en"]}</h2>

          {state === "incorrect" && attempts < 4 && (
            <p className="text-amber-300 text-sm mb-3 font-bold">
              Try again — {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left
            </p>
          )}

          {state === "revealed" && (
            <div className="mb-4 p-4 bg-blue-900/30 border border-blue-400/30 rounded-2xl">
              <p className="text-xs font-black uppercase tracking-widest text-blue-300 mb-2">Let's learn from this answer</p>
              <p className="text-lg font-bold text-white mb-2">✅ {current.targetAnswer}</p>
              {current.acceptableAnswers && current.acceptableAnswers.length > 1 && (
                <p className="text-xs text-white/60">Also valid: {current.acceptableAnswers.slice(1, 4).join(", ")}</p>
              )}
              {current.hint?.[native] && (
                <p className="text-xs text-white/70 mt-2">💡 {current.hint[native]}</p>
              )}
            </div>
          )}

          <div className="mt-4">
            {current.type === "word_order" ? (
              <WordOrderInput
                selected={selectedWords} available={availWords}
                onSelect={(w) => { setSelectedWords([...selectedWords, w]); setAvailWords(availWords.filter(x => x !== w)); }}
                onDeselect={(w) => { setAvailWords([...availWords, w]); setSelectedWords(selectedWords.filter(x => x !== w)); }}
                disabled={state === "submitting" || state === "correct" || state === "revealed"}
              />
            ) : current.type === "multiple_choice" && current.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.options.map(opt => (
                  <button key={opt}
                    disabled={state === "submitting" || state === "correct" || state === "revealed"}
                    onClick={() => setUserAnswer(opt)}
                    className={`p-3 md:p-4 rounded-xl border-2 text-left transition ${userAnswer === opt ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)}
                disabled={state === "submitting" || state === "correct" || state === "revealed"}
                className="w-full bg-black/20 p-3 rounded-xl h-24 border border-white/10 focus:border-white/30 outline-none"
                placeholder="Type your answer…" />
            )}
          </div>

          {feedback && state !== "idle" && state !== "submitting" && (
            <p className={`mt-4 text-sm ${state === "correct" ? "text-green-300" : "text-amber-300"}`}>{feedback}</p>
          )}
        </div>
      </div>

      {/* Footer nav — Task 1 prev/next + check */}
      <div className="p-4 md:p-6 border-t border-white/10 bg-black/30 backdrop-blur sticky bottom-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-2 md:gap-3">
          <button onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0}
            className="px-3 md:px-4 py-3 rounded-xl border border-white/15 text-sm font-bold disabled:opacity-30 hover:bg-white/5">
            ← Prev
          </button>

          {state === "idle" || state === "submitting" ? (
            <button onClick={submit} disabled={state === "submitting"}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold disabled:opacity-50">
              {state === "submitting" ? "Checking…" : "Check"}
            </button>
          ) : state === "incorrect" && attempts < 4 ? (
            <button onClick={retrySameStep}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold">
              Try Again ({attemptsLeft} left)
            </button>
          ) : (
            <button onClick={handleNext}
              className="flex-1 py-3 bg-white text-black rounded-xl font-bold">
              {isLastStep ? (phase === "main" && getMistakes(lesson.id).length > 0 ? "Start Smart Retry →" : "Finish Lesson →") : "Continue →"}
            </button>
          )}

          <button onClick={() => goToStep(stepIndex + 1)} disabled={isLastStep || state === "idle"}
            title={state === "idle" ? "Answer first" : ""}
            className="px-3 md:px-4 py-3 rounded-xl border border-white/15 text-sm font-bold disabled:opacity-30 hover:bg-white/5">
            Skip →
          </button>
        </div>
      </div>

      {/* Exit confirm modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-6"
            onClick={() => setShowExitConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#2a1414] border border-white/15 rounded-3xl p-6 max-w-sm w-full text-center">
              <Nuri mood="sad" size={80} />
              <h3 className="text-xl font-black mt-3 mb-2">Exit lesson?</h3>
              <p className="text-sm text-white/60 mb-5">Your progress is saved. You can resume anytime.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/15 font-bold">Stay</button>
                <button onClick={exitToWorld} className="flex-1 py-3 rounded-xl bg-white text-black font-bold">Exit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WordOrderInput({ selected, available, onSelect, onDeselect, disabled }: {
  selected: string[]; available: string[];
  onSelect: (w: string) => void; onDeselect: (w: string) => void; disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-xl min-h-[60px] border border-white/10">
        {selected.map((w, i) => (
          <button key={`s-${w}-${i}`} onClick={() => !disabled && onDeselect(w)}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-bold">{w}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((w, i) => (
          <button key={`a-${w}-${i}`} onClick={() => !disabled && onSelect(w)}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">{w}</button>
        ))}
      </div>
    </div>
  );
}

function CompletionScreen({ lesson, hayq, stats, onWorld }: {
  lesson: MultiLesson; hayq: number; stats: { correct: number; total: number }; onWorld: () => void;
}) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#1a0a0a] text-white">
      <Nuri mood="excited" size={140} glow />
      <h1 className="text-4xl md:text-5xl font-black mt-6 mb-3">Lesson Complete! 🎉</h1>
      <p className="text-white/60 mb-8 text-sm">{lesson.title.en}</p>
      <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-xs">
        <Tile label="Accuracy" value={`${accuracy}%`} />
        <Tile label="HAYQ" value={`+${hayq}`} />
      </div>
      <button onClick={onWorld} className="w-full max-w-xs py-4 bg-white text-black rounded-2xl font-black">
        Back to World
      </button>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] uppercase opacity-50 font-bold tracking-widest">{label}</p>
    </div>
  );
}
