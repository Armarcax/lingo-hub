import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Nuri, { NuriSpeech } from "@/components/Nuri";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NUR Lingo — Հայկական AI Լեզվի Հարթակ" },
      { name: "description", content: "AI-native Armenian ↔ English language learning. Semantic understanding, HAYQ tokens, Նուռ mascot." },
      { property: "og:title", content: "NUR Lingo" },
      { property: "og:description", content: "Սովորիր հայերեն AI-ի հետ — semantic understanding, HAYQ reward system" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen text-white" style={{ background: "var(--color-bg)" }}>
      <div className="h-1.5 w-full flag-stripe" />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-widest text-sm uppercase" style={{ color: "var(--hy-orange)" }}>
            NUR Lingo
          </span>
        </div>
        <Link to="/onboarding"
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: "var(--hy-red)", color: "white", boxShadow: "0 4px 16px rgba(217,0,18,0.3)" }}
        >
          Սկսել →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 pt-16 pb-12 max-w-6xl mx-auto gap-12">
        <div className="flex-1 space-y-6">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background:"rgba(217,0,18,0.1)", border:"1px solid rgba(217,0,18,0.25)", color:"#ff8899" }}>
            🇦🇲 Հայկական AI Լեզվի Հարթակ
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className="text-5xl lg:text-6xl font-light leading-none">
            Սովորիր<br />
            <span style={{ color:"var(--hy-red)" }}>Հայերեն</span><br />
            <span className="text-3xl text-white/40">the smart way.</span>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="text-white/50 text-lg leading-relaxed max-w-md">
            Semantic engine-ը հասկանում է <span className="text-white font-medium">իմաստ</span>,
            ոչ թե ճշգրիտ բառ։ Ազատ բառակարգ, հոմանիշ, ձևաբանություն։
          </motion.p>

          {/* Rewards preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}
              className="flex items-center gap-4 p-4 rounded-2xl border"
              style={{ background:"rgba(242,168,0,0.05)", borderColor:"rgba(242,168,0,0.2)" }}>
              <span className="text-3xl">🪙</span>
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-white/30">Layer 1</p>
                <p className="font-bold" style={{ color:"var(--hy-orange)" }}>HAYQ Points</p>
                <p className="text-white/40 text-[10px]">Daily activity tokens</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35 }}
              className="flex items-center gap-4 p-4 rounded-2xl border"
              style={{ background:"rgba(217,0,18,0.05)", borderColor:"rgba(217,0,18,0.2)" }}>
              <span className="text-3xl">🍎</span>
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-white/30">Layer 2</p>
                <p className="font-bold" style={{ color:"var(--hy-red)" }}>Seeds</p>
                <p className="text-white/40 text-[10px]">Rare organic rewards</p>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            className="flex flex-wrap gap-3">
            <Link to="/onboarding" className="btn-primary rounded-2xl">Սկսել ուսուցումը →</Link>
            <a href="#demo" className="px-8 py-4 rounded-2xl font-medium text-white/50 hover:text-white transition-colors border"
              style={{ borderColor:"var(--color-border)" }}>Demo ↓</a>
          </motion.div>
        </div>

        {/* Mascot */}
        <motion.div initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.15, type:"spring", damping:12 }}
          className="flex flex-col items-center gap-4">
          <NuriSpeech text="Բարև! Ես Նուռն եմ 🍎 Կսովորեցնեմ հայերեն!" mood="happy" />
          <Nuri mood="happy" size={170} />
          <p className="text-white/25 text-xs">Նուռ — NUR Lingo-ի կերպար</p>
        </motion.div>
      </section>

      {/* Demo */}
      <section id="demo" className="px-6 pb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-light text-center mb-8">
          <span style={{ color:"var(--hy-orange)" }}>Semantic</span> Engine Demo
        </h2>
        <div className="rounded-3xl border p-6 space-y-3"
          style={{ background:"var(--color-card)", borderColor:"var(--color-border)" }}>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Translate: "I am going home"</p>
          {[
            { text:"Ես գնում եմ տուն",  ok:true,  note:"SOV — կատարյալ",     hayq:"+20 HAYQ" },
            { text:"Ես տուն եմ գնում",  ok:true,  note:"SVO — ճիշտ",         hayq:"+18 HAYQ" },
            { text:"Տուն եմ գնում",      ok:true,  note:"Subject dropped",    hayq:"+16 HAYQ" },
            { text:"Ես տնից եմ",        ok:false, note:"Սխալ հոլով",          hayq:"0"       },
          ].map((r) => (
            <div key={r.text} className={`flex items-center justify-between p-3 rounded-xl border ${
              r.ok ? "bg-emerald-950/25 border-emerald-800/25" : "bg-red-950/25 border-red-800/25"}`}>
              <div className="flex items-center gap-3">
                <span>{r.ok ? "✅" : "❌"}</span>
                <span className="font-armenian text-sm">{r.text}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-white/30 hidden sm:block">{r.note}</span>
                {r.ok && <span className="hayq-chip text-xs">{r.hayq}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-16" style={{ borderColor:"var(--color-border)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon:"🧠", color:"var(--hy-red)",    title:"Semantic NLP",  desc:"5-layer validation. Հասկանում է իմաստ, ոչ ճշգրիտ տեքստ։ Ազատ բառակարգ, հոմանիշ, ձևաբանություն" },
            { icon:"🪙", color:"var(--hy-orange)",  title:"HAYQ Token",   desc:"Ճիշտ պատասխան = HAYQ։ Streak bonuses, leaderboard, level rewards։ Հայկական լեզվի ուժ" },
            { icon:"🍎", color:"var(--hy-blue)",    title:"Նուռ Mascot",  desc:"Քո հայերեն ուղեկիցը։ Celebrating հաջողության, thinking դժվար հարցի, sad սխալ պատասխանի ժամանակ" },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border"
              style={{ background:"var(--color-card)", borderColor:"var(--color-border)" }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2" style={{ color:f.color }}>{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-1.5 w-full flag-stripe" />
      <Footer />
    </main>
  );
}
