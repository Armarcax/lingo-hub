import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Volume2, Plus, BookOpen } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getAll, addUserEntry, audioUrl, type LexEntry } from "@/lib/lexicon/unified";
import type { LangCode } from "@/lib/i18n";

export const Route = createFileRoute("/dictionary")({
  head: () => ({
    meta: [
      { title: "Dictionary — NUR Lingo" },
      { name: "description", content: "Browse and search 1000+ Armenian, English, and Russian words with audio." },
      { property: "og:title", content: "NUR Lingo Dictionary" },
      { property: "og:description", content: "Multilingual dictionary with audio pronunciations." },
    ],
  }),
  component: DictionaryPage,
});

function DictionaryPage() {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState({ hy: "", en: "", ru: "" });

  const all = useMemo(() => getAll(), [tick]);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all.slice(0, 60);
    return all
      .filter(
        (e) =>
          e.hy.toLowerCase().includes(term) ||
          e.en.toLowerCase().includes(term) ||
          e.ru.toLowerCase().includes(term),
      )
      .slice(0, 100);
  }, [q, all]);

  const play = (entry: LexEntry, lang: LangCode) => {
    const url = entry.audio?.[lang] ?? audioUrl(entry.id, lang);
    const audio = new Audio(url);
    audio.play().catch(() => {
      /* audio not yet uploaded — silent fail */
    });
  };

  const handleAdd = () => {
    if (!draft.hy.trim() || !draft.en.trim() || !draft.ru.trim()) return;
    addUserEntry(draft.hy.trim(), draft.en.trim(), draft.ru.trim());
    setDraft({ hy: "", en: "", ru: "" });
    setShowAdd(false);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <BookOpen size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Dictionary</h1>
                <p className="text-[10px] opacity-60 uppercase tracking-wider">
                  {all.length} words
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd((s) => !s)}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
              aria-label="Add word"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search in HY / EN / RU..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </header>

      {showAdd && (
        <div className="max-w-md mx-auto px-4 py-4 border-b border-border/50">
          <p className="text-sm font-semibold mb-2">Add new word</p>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={draft.hy}
              onChange={(e) => setDraft({ ...draft, hy: e.target.value })}
              placeholder="Հայերեն"
              className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={draft.en}
              onChange={(e) => setDraft({ ...draft, en: e.target.value })}
              placeholder="English"
              className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={draft.ru}
              onChange={(e) => setDraft({ ...draft, ru: e.target.value })}
              placeholder="Русский"
              className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!draft.hy || !draft.en || !draft.ru}
            className="mt-2 w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-4 space-y-2">
        {results.length === 0 && (
          <p className="text-center text-sm opacity-60 py-8">No words found.</p>
        )}
        {results.map((e) => (
          <div
            key={e.id}
            className="rounded-xl border border-border/50 bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono opacity-40">#{e.id}</span>
              {e.isUserAdded && (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  MINE
                </span>
              )}
            </div>
            <div className="mt-1 space-y-1">
              <Row entry={e} lang="hy" flag="🇦🇲" play={play} />
              <Row entry={e} lang="en" flag="🇬🇧" play={play} />
              <Row entry={e} lang="ru" flag="🇷🇺" play={play} />
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

function Row({
  entry,
  lang,
  flag,
  play,
}: {
  entry: LexEntry;
  lang: LangCode;
  flag: string;
  play: (e: LexEntry, l: LangCode) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">
        <span className="mr-2">{flag}</span>
        <span className="font-medium">{entry[lang]}</span>
      </span>
      <button
        onClick={() => play(entry, lang)}
        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition"
        aria-label={`Play ${lang} audio`}
      >
        <Volume2 size={14} />
      </button>
    </div>
  );
}
