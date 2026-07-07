# NUR Lingo — Merge, Fix & QA Plan

## 1. What each source actually is

| Source | Framework | Verdict | Role in merge |
|---|---|---|---|
| **Current Lovable project** | TanStack Start v1 + Vite 7 + Cloudflare Worker + Lovable Cloud (Supabase) | Authoritative trunk. Has newest curriculum engine, HAYQ wallet, MCP server, dialogue server fn, generator. | **Base** — nothing gets replaced without a stronger candidate. |
| **NUR_Lingo.zip** | **Next.js 14 (App Router)** + Supabase | Different framework. Cannot lift routes/components 1:1 — JSX runs, but Next-specific APIs (`next/link`, `next/navigation`, RSC, `app/api/*`, `layout.tsx`) do not. Business logic (`src/lib/*`), Supabase migrations, and `data/dictionaries/*.json` are portable. | **Logic + data donor** |
| **public.zip** | Raw assets (3 473 files, ~38 MB) | 3 000+ MP3 pronunciations under `public/audio/{en,hy,ru}/`, `nuri-{happy,sad,encouraging}.png`, `favicon.ico`, `logo.svg`, `manifest.json`, `sw.js`. | **Asset drop-in** (via Lovable Assets CDN for MP3s — do NOT commit 38 MB of audio to the repo) |
| **linguaflow-studio-main.zip** | TanStack Start (SAME stack as trunk) | Small, clean. Lift-and-shift candidates: `lesson-roadmap.tsx` (Duolingo snake path), `recorder.tsx`, `theme-provider.tsx`, `srs/srs.ts`, `audio/audio-cache.ts`. | **UI + arch donor** |

## 2. Per-feature merge decisions

| Feature | Winner | Why |
|---|---|---|
| Routing / framework | **Current** (TanStack) | Only option — Next code can't run here. |
| Curriculum engine (Course→Module→Lesson JSON) | **Current** | Already dynamic & lexicon-driven. |
| Lesson player UI | **LinguaFlow `lesson-player.tsx`** (adapted) | Cleaner state machine than current inline logic in `learn.tsx`. |
| Lesson roadmap / 125 islands | **LinguaFlow `lesson-roadmap.tsx`** | Duolingo-style snake path — user explicitly wants this. |
| Theme (light/dark) | **LinguaFlow `theme-provider.tsx` + next-themes** | Current has no working provider. Fixes reported dark-mode bug. |
| Mascot component (Nuri) | **NUR_Lingo `Nuri.tsx`** (501 lines, has happy/sad/encouraging states) + PNGs from public.zip | Current has minimal mascot; the reported "sad Nuri not shown" bug comes from missing states. |
| Dialogue UI | **NUR_Lingo `InteractiveDialogue.tsx`** (adapted to call current `continueDialogue` server fn) | 494 lines of polished flow. |
| Recording UI | **LinguaFlow `recorder.tsx`** | Web Audio API + WAV encode, correct per Lovable STT rules. |
| Dictionary UI | **Rebuild** on top of LinguaFlow `dictionary-service.ts` + NUR's `Headers_dictionary.json` | Both existing versions are incomplete; user wants split-store architecture (see §4). |
| Audio caching | **LinguaFlow `audio-cache.ts`** | Missing in trunk. |
| SRS review | **LinguaFlow `srs/srs.ts`** | Trunk has none. |
| HAYQ wallet & ledger | **Current** | Newest, has ledger + credit/debit API. |
| Rewards catalog | **NUR_Lingo `rewards/quests.ts` + `gamification/achievements.ts`** merged into current | Adds quests + badges. |
| Garden / spending | **New** (see §5) | Neither source finished this. |
| Supabase migrations | **NUR_Lingo `supabase/migrations/*`** | Trunk has none for user_recordings / lesson_completions / dictionary_entries. Requires Lovable Cloud enabled. |
| Bottom nav | **Current** | Simplest and already wired to TanStack routes. |

## 3. Bug fixes (all in-scope this delivery)

1. **Dark/Light mode** — install `next-themes`, add `ThemeProvider` in `__root.tsx`, wire `ThemeToggle` into header. Verify Tailwind v4 `dark:` variant works (needs `@custom-variant dark` in `styles.css`).
2. **Favicon** — write real brand mark to `public/favicon.png`, add `<link rel="icon">` to root route, delete stale `favicon.svg` / template default.
3. **Sad Nuri not shown** — port NUR_Lingo `Nuri.tsx` with `mood` prop; wire `mood="sad"` on wrong-answer branch in lesson player.
4. **Stuck "active" option after wrong answer** — reset `selectedOption` state in the wrong-answer branch of `learn.tsx` (not just on next question).
5. **125 islands not a snake path** — replace linear grid in `world.tsx` with LinguaFlow `lesson-roadmap.tsx` (SVG path with sine offset).
6. **Dictionary voice recording unreliable** — replace ad-hoc MediaRecorder with LinguaFlow `recorder.tsx` (WAV via Web Audio, size floor guard, empty-blob detection).
7. **"Add New Word" too complex** — collapse to single-sheet form (word / translation / optional recording), remove the multi-dialog wizard.
8. **White-on-white in topic selector** — audit `TopicPicker` for hardcoded `bg-white`/`text-white`; move to semantic tokens (`bg-card text-card-foreground`).
9. **UI inconsistency** — enforce shadcn primitives (`Button`, `Card`, `Dialog`) across ported components; kill inline styles.
10. **Dictionary architecture** — see §4.

## 4. Self-healing dictionary architecture

Layer model (all layers behind one `DictionaryService`):

```text
┌──────────────────────────────────────────────┐
│ DictionaryService (single API surface)       │
│  - lookup(canonicalId | query)               │
│  - addUserWord(...)  → dedupes + links       │
│  - listAll()        → merged view            │
│  - recordAudio(canonicalId | userId, blob)   │
│  - migrate()        → runs on boot           │
└──────────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
 master (RO)    personal (RW)   recordings (RW)
 JSON bundled   Supabase or     Supabase Storage
 canonical IDs  localStorage    (audio blobs)
 hash-indexed   user_id + word  keyed by owner + word
```

- **Master**: `src/data/master-dictionary.json` — read-only, bundled, each entry has stable `canonicalId` (sha1 of `en|hy|ru` normalized).
- **Personal**: table `dictionary_entries` (already in NUR migration). Fields: `id`, `user_id`, `en`, `hy`, `ru`, `canonical_id` (nullable), `created_at`.
- **Recordings**: table `user_recordings` + Supabase Storage bucket `recordings/{user_id}/{targetId}.wav`. `targetId` = canonicalId when known, else personal entry id.
- **Dedup on write**: normalize triplet → compute canonicalId → if it exists in master, only store the recording (skip adding a personal entry). If it matches an existing personal row for the same user, upsert.
- **Migration**: on app boot, `DictionaryService.migrate()` scans personal rows whose `canonical_id IS NULL`, recomputes hash, and if it now matches master, links `canonical_id` and marks the row `promoted=true` (kept for audit, hidden from "My Words").
- **Modularity**: `DictionaryStore` interface with `LocalStore` (localStorage, works signed-out) and `SupabaseStore` (signed-in) implementations. Same service works with either.

## 5. HAYQ / Garden completion

- **Earn**: already wired (curriculum + `wallet.credit`). Add `daily_login` and `first_recording` events.
- **Spend catalog** (`src/lib/hayq/shop.ts`):
  - Garden plant seed (25 HAYQ)
  - Water can (10 HAYQ)
  - Streak freeze (100 HAYQ)
  - Heart refill (50 HAYQ)
  - Mascot outfit (200 HAYQ)
- **Garden state** (`src/lib/garden/state.ts`): plot grid (5×5), each cell `{ plant, plantedAt, waterLevel, stage }`. Growth ticks on visit. Buying a seed opens plot picker; water can boosts stage.
- **UI**: existing `/garden` route (if any) or new one — grid of cells, side panel with shop + balance + ledger tab.
- **Guardrails**: all spends via `wallet.debit()`; UI disables buttons when balance insufficient; ledger tab shows history from `wallet.history()`.

## 6. Delivery sequence (ordered checkpoints)

I will proceed through these in order and check in at each ✅. If any step exceeds a reasonable turn budget, I'll checkpoint and continue.

1. **Foundation** ✅
   - Enable Lovable Cloud (required for user recordings + personal dict).
   - Install `next-themes`; add ThemeProvider + fix dark mode + favicon.
   - Import Nuri PNGs (via `lovable-assets` for the 3 mascot images).
   - Import MP3 catalog via `lovable-assets` in batch — pointers under `src/assets/audio/{lang}/*.mp3.asset.json`.
2. **UI merge** ✅
   - Port `theme-provider`, `lesson-roadmap`, `recorder`, `audio-cache`, `srs`.
   - Port adapted `Nuri.tsx`, `InteractiveDialogue.tsx`.
   - Refactor `learn.tsx` to use `lesson-player` state machine; fix stuck-option + sad-Nuri bugs.
   - Rebuild `world.tsx` on `lesson-roadmap`.
3. **Dictionary rework** ✅
   - Ship master JSON with canonicalIds.
   - `DictionaryService` + `LocalStore` + `SupabaseStore`.
   - Simplified "Add Word" sheet.
   - Migration routine on boot.
   - Supabase migrations for `dictionary_entries`, `user_recordings`, storage bucket + RLS.
4. **HAYQ / Garden** ✅
   - Shop catalog, garden state, `/garden` UI, ledger view, spend hooks.
5. **QA sweep** ✅ (Playwright-driven, headed screenshots)
   - Every route: `/`, `/onboarding`, `/world`, `/learn`, `/dictionary`, `/garden`, `/dialogue`, `/review`.
   - Every button/modal — capture screenshot + console + network per interaction; log findings.
   - Responsive: mobile 375×812, tablet 768×1024, desktop 1440×900.
   - Light + dark theme.
   - Signed-out and signed-in states.
   - Build (`bun run build`) + typecheck (`bunx tsgo`) green.
6. **Deploy** ✅
   - Lovable-hosted: publish via preview_ui--publish.
   - Vercel: keep TanStack Start config; add `vercel.json` if needed; push via connected GitHub.

## 7. Technical constraints I need to flag now

- **Framework mismatch**: NUR_Lingo.zip is Next.js. I will NOT port `src/app/**` routes verbatim — I'll rebuild each as a TanStack route reusing the JSX body and swapping `next/link`→`Link`, `next/navigation`→`useNavigate`, `app/api/*`→`createServerFn` or `routes/api/*`.
- **Vercel + TanStack Start**: current template targets Cloudflare Workers. Dual-target ("Both") is possible but the Worker-only bits (`nitro` cloudflare preset in `@lovable.dev/vite-tanstack-config`) need a Vercel preset override in `vite.config.ts`. I'll add it and document the switch, but full Vercel parity depends on no Cloudflare-only APIs being used — currently there are none.
- **Audio size**: 38 MB across 3 000+ files. Committing to the repo is a bad idea (slow clones, git-lfs pain). I'll upload via `lovable-assets` in batches so the repo stays small and files serve from CDN. If you strictly want them in `public/`, say so — it works but bloats the bundle.
- **Lovable Cloud is currently OFF**. Personal dictionary + user recordings + Supabase migrations all require it. I'll pause and prompt you to enable it at the start of step 3 (or earlier if you prefer).

## 8. Out of scope for this delivery

- Blockchain HAYQ token (already stubbed in `hayq/token.ts` — kept as interface only).
- New AI models beyond the current Lovable AI Gateway wiring.
- Native mobile app.

---

**Approve this plan and I'll start executing at step 1.** If you want to reorder (e.g. bugs first, merge second) or drop scope (e.g. skip the 3 000 MP3 import until later), say so before I begin — reordering after step 3 is expensive.
