import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import Nuri, { NuriSpeech } from "@/components/Nuri";
import {
  loadRewards, syncHearts, checkAndApplyFreeze,
  checkStreakMilestones, checkDailyGoalBonus,
  type UserRewards,
} from "@/lib/rewards/seeds";
import { getLessonsForPair, type LangPair, type MultiLesson, type MultiUnit } from "@/lib/i18n/multilingual";
import { hayqToLevel } from "@/lib/lessons/engine";
import { loadLangConfig, type LangCode } from "@/lib/i18n/index";
import { loadSession } from "@/lib/lessons/session";

export const Route = createFileRoute("/world")({
  component: WorldPage,
});

function WorldPage() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [units, setUnits] = useState<MultiUnit[]>([]);
  const [allLessons, setAllLessons] = useState<MultiLesson[]>([]);
  const [native, setNative] = useState<LangCode>("en");
  const [pair, setPair] = useState<LangPair>("en-hy");
  const [resumeAvailable, setResumeAvailable] = useState<{ lessonId: string; pair: LangPair; pct: number } | null>(null);

  useEffect(() => {
    const cfg = loadLangConfig();
    const p = (cfg?.pair as LangPair) || "en-hy";
    const nat = (cfg?.native as LangCode) || "en";
    setNative(nat);
    setPair(p);

    const r = syncHearts();
    const f = checkAndApplyFreeze();
    const m = checkStreakMilestones();
    const g = checkDailyGoalBonus();
    setRewards({ ...r, ...f, ...m.rewards, ...g.rewards });

    const data = getLessonsForPair(p);
    setUnits(data.units);
    setAllLessons(data.lessons);

    const s = loadSession();
    if (s && s.totalSteps > 0) {
      setResumeAvailable({
        lessonId: s.lessonId,
        pair: s.pair,
        pct: Math.round((s.stepIndex / s.totalSteps) * 100),
      });
    }
  }, []);

  if (!rewards) return null;
  const level = hayqToLevel(rewards.totalHAYQ);

  const startLesson = (l: MultiLesson) => {
    navigate({ to: "/learn", search: { lesson: l.id, pair } });
  };

  const today = new Date().toISOString().split("T")[0];
  const dailyMinutes = rewards.dailyActivity[today] || 0;

  return (
    <div className="min-h-screen relative text-white overflow-hidden bg-[#1a0a0a]">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #D90012 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D90012] to-[#FFA500] flex items-center justify-center font-black text-xl shadow-lg border border-white/20">Ն</div>
            <span className="font-black tracking-tighter text-xl uppercase italic">NUR Lingo</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Rank</p>
              <p className="text-sm font-black" style={{ color: level.color }}>{level.title[native] ?? level.titleArmenian}</p>
            </div>
            <Stat icon="🪙" value={rewards.totalHAYQ} color="text-[#FFA500]" />
            <Stat icon="🍎" value={rewards.totalSeeds} />
            <Stat icon="🔥" value={`${rewards.streak}${rewards.streakFreeze > 0 ? " 🛡️" : ""}`} />
            <Stat icon="❤️" value={rewards.hearts} />
            <Stat icon="🎯" value={`${dailyMinutes}/${rewards.dailyGoal}`} />
          </div>
        </nav>

        {resumeAvailable && (
          <div className="mx-auto mt-6 max-w-2xl w-full px-4">
            <div className="bg-gradient-to-r from-[#FFA500]/20 to-[#D90012]/20 border border-[#FFA500]/40 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-sm uppercase tracking-wider text-[#FFA500]">Continue Lesson</p>
                <p className="text-xs text-white/60 mt-1">{resumeAvailable.pct}% complete</p>
              </div>
              <button
                onClick={() => navigate({ to: "/learn", search: { lesson: resumeAvailable.lessonId, pair: resumeAvailable.pair, resume: 1 } })}
                className="px-5 py-2.5 bg-white text-black rounded-xl font-bold text-sm">
                Resume
              </button>
            </div>
          </div>
        )}

        <div className="px-6 pt-10 pb-8 max-w-4xl mx-auto text-center">
          <Nuri mood={rewards.streak >= 3 ? "happy" : "idle"} size={100} />
          <h1 className="text-5xl md:text-7xl font-black leading-none mb-3 tracking-tighter italic mt-4">
            Seed <span className="text-[#D90012]">World</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">Organic learning path</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-32 w-full">
          <div className="flex flex-col gap-16">
            {units.map((unit) => {
              const lessons = allLessons.filter(l => l.unitId === unit.id);
              const completed = lessons.filter(l => (rewards.crowns[l.id] || 0) > 0).length;
              const pct = lessons.length ? (completed / lessons.length) * 100 : 0;
              return (
                <div key={unit.id}>
                  <div className="flex flex-col items-center mb-8">
                    <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/20">
                      <h2 className="text-xl md:text-2xl font-black text-[#FFA500]">{unit.title[native]}</h2>
                      <p className="text-[10px] text-center text-white/40 font-bold uppercase mt-1">{unit.description[native]}</p>
                    </div>
                    <div className="w-48 mt-3">
                      <div className="flex justify-between text-[10px] font-black uppercase text-white/40 mb-1">
                        <span>Progress</span><span>{completed}/{lessons.length}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full" style={{ background: unit.colorFrom, width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  <SnakePath
                    lessons={lessons}
                    unit={unit}
                    crowns={rewards.crowns}
                    onStart={startLesson}
                    native={native}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

// ── Duolingo-style snake path per unit ──────────────────────────────────────
function SnakePath({
  lessons,
  unit,
  crowns,
  onStart,
  native,
}: {
  lessons: MultiLesson[];
  unit: MultiUnit;
  crowns: Record<string, number>;
  onStart: (l: MultiLesson) => void;
  native: LangCode;
}) {
  const STEP_Y = 110;
  const AMPLITUDE = 110; // horizontal swing
  const WIDTH = 320;
  const centerX = WIDTH / 2;
  const height = Math.max(120, lessons.length * STEP_Y + 40);

  // Sine-wave offset per lesson index
  const nodeX = (i: number) =>
    centerX + Math.sin((i / Math.max(1, lessons.length - 1)) * Math.PI * (lessons.length / 3)) * AMPLITUDE;
  const nodeY = (i: number) => 40 + i * STEP_Y;

  // Build a smooth path through all nodes
  const pathD = lessons.reduce((acc, _, i) => {
    const x = nodeX(i);
    const y = nodeY(i);
    if (i === 0) return `M ${x} ${y}`;
    const prevX = nodeX(i - 1);
    const prevY = nodeY(i - 1);
    const midY = (prevY + y) / 2;
    return `${acc} C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
  }, "");

  // Find first non-completed lesson index for "current" indicator
  const currentIdx = lessons.findIndex(l => (crowns[l.id] || 0) === 0);

  return (
    <div className="relative mx-auto" style={{ width: WIDTH, height }}>
      <svg className="absolute inset-0 pointer-events-none" width={WIDTH} height={height}>
        <path
          d={pathD}
          fill="none"
          stroke={unit.colorFrom}
          strokeOpacity={0.35}
          strokeWidth={4}
          strokeDasharray="8 10"
          strokeLinecap="round"
        />
      </svg>
      {lessons.map((l, i) => {
        const done = (crowns[l.id] || 0) > 0;
        const isCurrent = i === currentIdx;
        const isReview = l.id.startsWith("review_");
        const unlocked = i === 0 || (crowns[lessons[i - 1].id] || 0) > 0;
        const x = nodeX(i);
        const y = nodeY(i);
        return (
          <motion.button
            key={l.id}
            whileHover={unlocked ? { scale: 1.08 } : {}}
            whileTap={unlocked ? { scale: 0.95 } : {}}
            onClick={() => unlocked && onStart(l)}
            disabled={!unlocked}
            className={`absolute -translate-x-1/2 -translate-y-1/2 group ${isCurrent ? "animate-bob" : ""}`}
            style={{ left: x, top: y }}
            title={l.title[native]}
          >
            {done && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] z-10 shadow">⭐</div>
            )}
            <div
              className={`w-16 h-16 md:w-18 md:h-18 rounded-[35%_65%_70%_30%/30%_30%_70%_70%] flex items-center justify-center text-3xl shadow-2xl border-4 ${
                !unlocked
                  ? "border-white/10 opacity-40 grayscale"
                  : done
                    ? "border-yellow-400"
                    : isReview
                      ? "border-purple-400/60"
                      : "border-white/20"
              }`}
              style={{
                background: unlocked
                  ? `linear-gradient(135deg, ${isReview ? "#9333ea" : unit.colorFrom}, ${isReview ? "#581c87" : unit.colorTo})`
                  : "rgba(255,255,255,0.05)",
              }}
            >
              <span className="drop-shadow-lg">{!unlocked ? "🔒" : isReview ? "🏆" : unit.iconEmoji}</span>
            </div>
            <p className="mt-1 text-[10px] font-bold text-white/70 max-w-[90px] truncate text-center">
              {l.title[native]}
            </p>
          </motion.button>
        );
      })}

function Stat({ icon, value, color }: { icon: string; value: string | number; color?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1 text-sm font-bold ${color || ""}`}>
      <span>{icon}</span><span>{value}</span>
    </div>
  );
}
