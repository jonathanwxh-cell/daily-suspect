"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import type { PublicCase, Suggested } from "@/lib/types";

// ============================================================
// DAILY SUSPECT — client game shell.
// All hidden truths live server-side; this component only ever
// sees public case data + per-turn API responses.
// ============================================================

type Msg = { role: "det" | "sus"; text: string; delta?: number; read?: string };

type Outcome = "CONFESSED" | "CASE_CLOSED" | "HUNCH" | "NEAR_MISS" | "WALKED_FREE";
type Verdict = {
  outcome: Outcome;
  correct: boolean;
  blindGuess: boolean;
  truthSealed: boolean;
  reveal: string;
  theory: string | null;
  rank: string;
  questionsUsed: number;
  budget: number;
  intelCount: number;
};

// ---------- Procedural SFX (Web Audio, zero assets) ----------
function makeSfx() {
  let ctx: AudioContext | null = null;
  const get = () => {
    if (!ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const env = (c: AudioContext, node: AudioNode, t0: number, peak: number, dur: number) => {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g);
    g.connect(c.destination);
  };
  return {
    tap() {
      const c = get(); if (!c) return;
      const o = c.createOscillator(); o.type = "square"; o.frequency.value = 740;
      env(c, o, c.currentTime, 0.04, 0.05); o.start(); o.stop(c.currentTime + 0.06);
    },
    type() {
      const c = get(); if (!c) return;
      const o = c.createOscillator(); o.type = "triangle";
      o.frequency.value = 1100 + Math.random() * 500;
      env(c, o, c.currentTime, 0.018, 0.025); o.start(); o.stop(c.currentTime + 0.03);
    },
    hit(big: boolean) {
      const c = get(); if (!c) return;
      const o = c.createOscillator(); o.type = "sine";
      const t = c.currentTime;
      o.frequency.setValueAtTime(big ? 320 : 240, t);
      o.frequency.exponentialRampToValueAtTime(big ? 90 : 130, t + 0.16);
      env(c, o, t, big ? 0.22 : 0.1, 0.2); o.start(); o.stop(t + 0.22);
    },
    stamp() {
      const c = get(); if (!c) return;
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.2);
      env(c, o, t, 0.5, 0.26); o.start(); o.stop(t + 0.3);
      const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const n = c.createBufferSource(); n.buffer = buf;
      env(c, n, t, 0.18, 0.08); n.start();
    },
    crack() {
      const c = get(); if (!c) return;
      const t = c.currentTime;
      [196, 207.65, 392].forEach((f, i) => {
        const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
        env(c, o, t + i * 0.02, 0.07, 0.9); o.start(t + i * 0.02); o.stop(t + 1);
      });
    },
    beat() {
      const c = get(); if (!c) return;
      const t = c.currentTime;
      [0, 0.22].forEach((dt, i) => {
        const o = c.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(70, t + dt);
        o.frequency.exponentialRampToValueAtTime(40, t + dt + 0.1);
        env(c, o, t + dt, i ? 0.12 : 0.18, 0.13); o.start(t + dt); o.stop(t + dt + 0.15);
      });
    },
  };
}

// ---------- Polygraph ----------
function Polygraph({ composure, pulse, flash }: { composure: number; pulse: number; flash: boolean }) {
  const stress = (100 - composure) / 100;
  const pts: string[] = [];
  const W = 300, H = 36, mid = H / 2;
  for (let x = 0; x <= W; x += 5) {
    const amp = 2 + stress * 15;
    const y =
      mid +
      Math.sin(x * 0.12 + pulse * 2.1) * amp * (0.4 + Math.abs(Math.sin(x * 0.05 + pulse))) +
      Math.sin(x * 0.7 + pulse * 5) * stress * 4;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  const col = composure > 50 ? "#5f9e6e" : composure > 20 ? "#c9913a" : "#b3262a";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 36 }} aria-hidden="true">
      <line x1="0" y1={mid} x2={W} y2={mid} stroke="#e8dfc8" strokeWidth="0.3" opacity="0.15" />
      <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth={flash ? 2.4 : 1.6} opacity={flash ? 1 : 0.9} />
    </svg>
  );
}

// ---------- Portrait ----------
function Portrait({ caze, size = 84, mood = "calm", tilt = -2 }: { caze: PublicCase; size?: number; mood?: string; tilt?: number }) {
  const [err, setErr] = useState(false);
  const ring =
    mood === "breaking"
      ? "0 0 18px #b3262a99, 0 4px 14px #000000aa"
      : mood === "rattled"
      ? "0 0 12px #c9913a55, 0 4px 14px #000000aa"
      : "0 4px 14px #000000aa";
  return (
    <div
      className={"ds-polaroid" + (mood === "breaking" ? " ds-pulse" : "")}
      style={{ width: size, height: size, background: "#1c1916", flexShrink: 0, boxShadow: ring, transform: `rotate(${tilt}deg)` }}
    >
      {caze.portrait && !err ? (
        <img
          src={caze.portrait}
          alt={caze.name}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: `saturate(0.65) contrast(1.08)${mood === "breaking" ? " brightness(1.08)" : ""}` }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full" style={{ color: caze.color, fontSize: size * 0.34, fontFamily: "'Special Elite', monospace" }}>
          {caze.initials}
        </div>
      )}
    </div>
  );
}

// ---------- Typewriter ----------
function useTypewriter(text: string, active: boolean, onTick: (() => void) | null) {
  const [len, setLen] = useState(active ? 0 : (text || "").length);
  useEffect(() => {
    if (!active) { setLen((text || "").length); return; }
    setLen(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 2;
      setLen(i);
      if (onTick && i % 6 === 0) onTick();
      if (i >= (text || "").length) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [text, active]);
  const done = len >= (text || "").length;
  return [(text || "").slice(0, len), done, () => setLen((text || "").length)] as const;
}

function SuspectLine({ m, caze, isLatest, sfxOn, sfx }: { m: Msg; caze: PublicCase; isLatest: boolean; sfxOn: boolean; sfx: any }) {
  const [shown, done, skip] = useTypewriter(m.text, isLatest, sfxOn ? sfx.type : null);
  return (
    <div className="ds-fade mb-2.5" onClick={() => !done && skip()}>
      <p className="text-[10px] tracking-widest opacity-50">
        {caze.name.toUpperCase()}
        {m.delta ? <span style={{ color: m.delta <= -18 ? "#e05555" : "#c9913a" }}> {m.delta}</span> : null}
        {m.read ? <span className="opacity-60 italic normal-case tracking-normal"> · {m.read}</span> : null}
      </p>
      <p className="text-sm leading-snug">
        {shown}
        {!done && <span className="ds-caret">▌</span>}
      </p>
    </div>
  );
}

// ---------- Main ----------
export default function Game() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState("");
  const [screen, setScreen] = useState<"title" | "brief" | "enter" | "room" | "accuse" | "verdict">("title");
  const [caze, setCaze] = useState<PublicCase | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [composure, setComposure] = useState(100);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [suggested, setSuggested] = useState<Suggested[]>([]);
  const [busy, setBusy] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [customQ, setCustomQ] = useState("");
  const [pulse, setPulse] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [floatDelta, setFloatDelta] = useState<{ v: number; k: number } | null>(null);
  const [intelUnlocked, setIntelUnlocked] = useState<string[]>([]);
  const [toast, setToast] = useState<{ text: string; k: number } | null>(null);
  const [biggestHit, setBiggestHit] = useState(0);
  const [streak, setStreak] = useState(0);
  const [theoryOrder, setTheoryOrder] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sfxRef = useRef<any>(null);
  if (!sfxRef.current && typeof window !== "undefined") sfxRef.current = makeSfx();
  const sfx = sfxRef.current || { tap() {}, type() {}, hit() {}, stamp() {}, crack() {}, beat() {} };

  // Daily identity: a stable day index + a localStorage streak that ticks on wins.
  const dayNumber = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  const shuffle = (arr: number[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const bumpStreak = () => {
    try {
      const raw = localStorage.getItem("ds-streak");
      const prev = raw ? JSON.parse(raw) : { day: 0, streak: 0 };
      if (prev.day === dayNumber) return;
      const next = prev.day === dayNumber - 1 ? (prev.streak || 0) + 1 : 1;
      localStorage.setItem("ds-streak", JSON.stringify({ day: dayNumber, streak: next }));
      setStreak(next);
    } catch {}
  };

  const loadCases = async () => {
    setCasesLoading(true);
    setCasesError("");
    try {
      const data = await apiFetch<{ cases: PublicCase[] }>("/api/cases");
      setCases(data.cases || []);
    } catch {
      setCasesError("Case board is offline. Try again in a moment.");
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 0.15), 80);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ds-streak");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.day === dayNumber || s.day === dayNumber - 1) setStreak(s.streak || 0);
      }
    } catch {}
  }, [dayNumber]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 400;
  });

  useEffect(() => {
    if (screen !== "room" || !soundOn || cracked || !caze) return;
    if (composure / caze.startComposure > 0.3) return;
    const iv = setInterval(() => sfx.beat(), 1100);
    return () => clearInterval(iv);
  }, [screen, soundOn, composure, cracked, caze]);

  const mood = (() => {
    if (!caze) return "calm";
    const r = composure / caze.startComposure;
    return r > 0.6 ? "calm" : r > 0.3 ? "rattled" : "breaking";
  })();

  const startCase = (c: PublicCase) => { if (soundOn) sfx.tap(); setCaze(c); setScreen("brief"); };

  const enterRoom = async () => {
    if (!caze) return;
    if (soundOn) sfx.stamp();
    setErrMsg("");
    setBusy(true);
    try {
      const data = await apiFetch<{
        sessionId: string;
        transcript: Msg[];
        composure: number;
        questionsUsed: number;
        suggested: Suggested[];
      }>("/api/session", {
        method: "POST",
        body: JSON.stringify({ caseId: caze.id }),
      });
      setSessionId(data.sessionId);
      setTranscript(data.transcript?.length ? data.transcript : [{ role: "sus", text: caze.opening }]);
      setComposure(data.composure ?? caze.startComposure);
      setQuestionsUsed(data.questionsUsed ?? 0);
      setSuggested(data.suggested?.length ? data.suggested : caze.starters);
      setCracked(false);
      setVerdict(null);
      setIntelUnlocked([]);
      setBiggestHit(0);
      setTheoryOrder(shuffle([...Array(caze.theories.length).keys()]));
      setScreen("enter");
      setTimeout(() => setScreen("room"), 1400);
    } catch {
      setErrMsg("Case room is offline. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicOn) audioRef.current.pause();
    else { audioRef.current.volume = 0.45; audioRef.current.play().catch(() => {}); }
    setMusicOn(!musicOn);
  };
  const toggleSound = () => { if (!soundOn) sfx.tap(); setSoundOn(!soundOn); };

  const fetchVerdict = async (theoryIndex: number, theoryLabel: string | null) => {
    if (!caze || !sessionId) return;
    try {
      const r = await apiFetch<Verdict>("/api/accuse", {
        method: "POST",
        body: JSON.stringify({ sessionId, theoryIndex }),
      });
      const v: Verdict = { ...r, theory: r.theory ?? theoryLabel };
      setVerdict(v);
      if (v.outcome === "CONFESSED" || v.outcome === "CASE_CLOSED") bumpStreak();
    } catch {
      setVerdict({
        outcome: theoryIndex === -1 ? "CONFESSED" : "WALKED_FREE",
        correct: theoryIndex === -1,
        blindGuess: false,
        truthSealed: theoryIndex !== -1,
        reveal: "",
        theory: theoryLabel,
        rank: theoryIndex === -1 ? "B" : "F",
        questionsUsed,
        budget: caze.budget,
        intelCount: intelUnlocked.length,
      });
    }
  };

  const ask = async (q: string) => {
    if (busy || cracked || !caze || !sessionId) return;
    if (soundOn) sfx.tap();
    setBusy(true);
    setErrMsg("");
    setCustomQ("");
    const newTranscript: Msg[] = [...transcript, { role: "det", text: q }];
    setTranscript(newTranscript);
    try {
      const r = await apiFetch<{
        reply: string;
        delta: number;
        read?: string;
        composure: number;
        cracked: boolean;
        suggested: Suggested[];
        intel: string | null;
      }>("/api/interrogate", {
        method: "POST",
        body: JSON.stringify({ sessionId, question: q }),
      });
      setTranscript([...newTranscript, { role: "sus", text: r.reply, delta: r.delta, read: r.read }]);
      setComposure(r.composure);
      setQuestionsUsed(questionsUsed + 1);
      setBiggestHit((b) => Math.max(b, -r.delta));
      setFloatDelta({ v: r.delta, k: Date.now() });
      if (r.intel) {
        setIntelUnlocked((u) => [...u, r.intel]);
        setToast({ text: r.intel, k: Date.now() });
        setTimeout(() => setToast(null), 3800);
      }
      if (r.delta <= -18) {
        setShake(true); setFlash(true);
        setTimeout(() => { setShake(false); setFlash(false); }, 450);
        if (soundOn) sfx.hit(true);
      } else if (r.delta <= -9 && soundOn) sfx.hit(false);
      if (r.cracked) {
        setCracked(true);
        if (soundOn) sfx.crack();
        fetchVerdict(-1, null);
        setTimeout(() => { if (soundOn) sfx.stamp(); setScreen("verdict"); }, 2600);
      } else if (Array.isArray(r.suggested) && r.suggested.length) {
        setSuggested(r.suggested.slice(0, 3));
      }
      if (!r.cracked && questionsUsed + 1 >= caze.budget) {
        setTimeout(() => setScreen("accuse"), 1800);
      }
    } catch (e: any) {
      setTranscript(newTranscript.slice(0, -1));
      setErrMsg(e.message === "SAPIENS_API_KEY is not configured on the server." ? "Server missing API key -- see README." : "Line went dead. Ask again.");
    }
    setBusy(false);
  };

  const makeAccusation = (idx: number) => {
    if (!caze) return;
    if (soundOn) sfx.stamp();
    fetchVerdict(idx, caze.theories[idx]);
    setScreen("verdict");
  };

  const outcome: Outcome | null = verdict?.outcome ?? (cracked ? "CONFESSED" : null);
  const won = outcome === "CONFESSED" || outcome === "CASE_CLOSED";
  const rank = verdict?.rank ?? "—";

  const shareText = () => {
    if (!caze || !outcome) return "";
    const label =
      outcome === "CONFESSED" ? "CONFESSION" :
      outcome === "CASE_CLOSED" ? "CASE CLOSED" :
      outcome === "HUNCH" ? "LUCKY HUNCH" :
      outcome === "NEAR_MISS" ? "SO CLOSE" : "WALKED FREE";
    const icon =
      outcome === "CONFESSED" ? "🚨" :
      outcome === "CASE_CLOSED" ? "🔒" :
      outcome === "HUNCH" ? "🎲" :
      outcome === "NEAR_MISS" ? "😬" : "🚪";
    const broke = Math.max(0, Math.min(8, Math.round((1 - composure / caze.startComposure) * 8)));
    const bar = "🟥".repeat(broke) + "⬛".repeat(8 - broke);
    const streakLine = streak > 1 ? `\n🔥 ${streak}-day streak` : "";
    return `DAILY SUSPECT #${dayNumber} — ${caze.crime}\n${icon} ${label} · ${questionsUsed}/${caze.budget} Q · RANK ${rank}\n${bar}${streakLine}\ndaily-suspect.vercel.app`;
  };

  const copyShare = () => {
    const txt = shareText();
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    } else fallbackCopy(txt, done);
  };
  const fallbackCopy = (txt: string, done: () => void) => {
    const ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch {}
    document.body.removeChild(ta);
  };

  const reset = () => {
    if (soundOn) sfx.tap();
    setScreen("title");
    setCaze(null);
    setSessionId(null);
    setErrMsg("");
  };

  const tacticColor: Record<string, string> = { PRESSURE: "#e05555", EMPATHY: "#5f9e6e", LOGIC: "#5d93bd", BLUFF: "#c9913a" };

  return (
    <div className={"ds-root" + (shake ? " ds-shake" : "")}>
      <div className="ds-grain" />
      <div className="ds-vig" />
      <audio ref={audioRef} src="/media/theme.mp3" loop preload="none" />

      {toast && (
        <div className="ds-toast ds-paper" key={toast.k}>
          <div className="ds-paper-edge" />
          <div className="p-3">
            <p className="text-[10px] tracking-widest mb-0.5" style={{ color: "#b3262a", fontWeight: 700 }}>★ NEW INTEL</p>
            <p className="text-xs leading-snug">{toast.text}</p>
          </div>
        </div>
      )}

      <div className={(screen === "title" ? "max-w-6xl" : "max-w-md") + " mx-auto px-4 pb-10 pt-5 relative"} style={{ zIndex: 10 }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={reset} className="ds-display text-lg tracking-widest" style={{ color: "#e8dfc8", background: "none", border: "none" }}>
            DAILY SUSPECT
          </button>
          {screen === "title" && (
            <nav className="hidden md:flex items-center gap-6 text-[11px] tracking-widest opacity-70">
              <a href="#case-board" className="hover:opacity-100">CASES</a>
              <a href="#how-it-works" className="hover:opacity-100">HOW IT WORKS</a>
              <a href="#free-forever" className="hover:opacity-100">FREE FOREVER</a>
            </nav>
          )}
          <div className="flex gap-1.5">
            <button onClick={toggleSound} className="text-[11px] px-2 py-1 ds-chip" aria-label="Toggle sound effects">
              {soundOn ? "SFX ✓" : "SFX ✗"}
            </button>
            <button onClick={toggleMusic} className="text-[11px] px-2 py-1 ds-chip" aria-label="Toggle music">
              {musicOn ? "♫ ✓" : "♫ ✗"}
            </button>
          </div>
        </div>

        {screen === "title" && (
          <div className="ds-fade ds-front">
            <section className="ds-hero">
              <div className="ds-hero-copy">
                <h1 className="ds-display ds-hero-title ds-title-flicker">
                  Daily<br className="hidden sm:block" /> Suspect
                </h1>
                <p className="ds-hero-line">One suspect. A handful of questions. One hidden truth.</p>
                <p id="free-forever" className="ds-free-line">Free forever. No account. No paid case locks.</p>
                <div className="ds-hero-actions">
                  <button
                    onClick={() => document.getElementById("case-board")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="ds-hero-primary"
                  >
                    START INVESTIGATION
                  </button>
                  <button
                    onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="ds-hero-secondary"
                  >
                    HOW IT WORKS
                  </button>
                </div>
              </div>
              <div className="ds-case-board" aria-hidden="true">
                <div className="ds-board-string" />
                <div className="ds-evidence ds-evidence-a">
                  <span>LIVE FILE</span>
                  <strong>AI SUSPECT</strong>
                </div>
                <div className="ds-evidence ds-evidence-b">
                  <span>VERDICT</span>
                  <strong>HIDDEN</strong>
                </div>
                <div className="ds-evidence-photo">
                  {cases[0] ? <Portrait caze={cases[0]} size={118} tilt={-3} /> : <div className="ds-photo-skeleton" />}
                </div>
                <div className="ds-board-stamp ds-display">Free<br />Forever</div>
              </div>
            </section>

            <section className="ds-front-stats" aria-label="Game facts">
              <div><strong>3</strong><span>launch cases</span></div>
              <div><strong>1</strong><span>live AI turn per question</span></div>
              <div><strong>0</strong><span>paid locks</span></div>
            </section>

            <section id="how-it-works" className="ds-steps" aria-label="How it works">
              <div>
                <span>01</span>
                <h2 className="ds-display">Pick a suspect</h2>
                <p>Choose a case file and read the evidence before entering the room.</p>
              </div>
              <div>
                <span>02</span>
                <h2 className="ds-display">Ask better questions</h2>
                <p>Use empathy, logic, pressure, or bluffing to hit the real weak point.</p>
              </div>
              <div>
                <span>03</span>
                <h2 className="ds-display">Close the file</h2>
                <p>Break their composure for a confession, or spend your last question on a theory.</p>
              </div>
            </section>

            <section id="case-board" className="ds-front-cases">
              <div className="ds-section-head">
                <h2 className="ds-display">Open Case Files</h2>
                <p>Every case is playable. Every future case stays free.</p>
              </div>
            {casesLoading ? (
              <div className="ds-paper p-4 text-xs opacity-75">Loading case board...</div>
            ) : casesError ? (
              <div className="ds-paper p-4">
                <p className="text-xs mb-3" style={{ color: "#e05555" }}>{casesError}</p>
                <button onClick={loadCases} className="ds-chip px-3 py-2 text-xs">TRY AGAIN</button>
              </div>
            ) : (
              <div className="ds-case-grid">
                {cases.map((c, i) => (
                  <button key={c.id} onClick={() => startCase(c)} className="w-full ds-paper p-0 text-left" style={{ border: "none", display: "block", transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}>
                    <div className="ds-paper-edge" />
                    <div className="p-3 flex gap-3 items-center">
                      <Portrait caze={c} size={64} tilt={i % 2 ? 2 : -2} />
                      <div className="min-w-0">
                        <span className="ds-display text-base">{c.crime}</span>
                        <p className="text-xs opacity-80 leading-snug mt-0.5">{c.tagline}</p>
                        <div className="flex gap-2 mt-1.5 text-[10px] tracking-widest">
                          <span style={{ color: c.color, fontWeight: 700 }}>{c.difficulty}</span>
                          <span className="opacity-60">{c.budget} QUESTIONS</span>
                          <span className="opacity-60">COMPOSURE {c.startComposure}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] opacity-50 mt-5 leading-relaxed">
              Every suspect hides one truth. Hit a pressure point and their composure drops — drop it to zero and they break. Or run out of questions and stake your accusation.
            </p>
            </section>
          </div>
        )}

        {screen === "brief" && caze && (
          <div className="ds-fade">
            <div className="ds-paper" style={{ transform: "rotate(-0.4deg)" }}>
              <div className="ds-paper-edge" />
              <div className="p-4">
                <div className="flex gap-3 items-start mb-3">
                  <Portrait caze={caze} size={84} />
                  <div>
                    <p className="text-[10px] tracking-widest opacity-60">CASE FILE — {caze.difficulty}</p>
                    <h2 className="ds-display text-xl leading-tight">{caze.crime}</h2>
                    <p className="text-xs mt-1">{caze.name}, {caze.age}</p>
                  </div>
                </div>
                <p className="text-[10px] tracking-widest opacity-60 mb-1.5">EVIDENCE ON FILE</p>
                <ul className="space-y-1.5">
                  {caze.briefing.map((b, i) => (
                    <li key={i} className="text-xs leading-snug flex gap-2">
                      <span style={{ color: caze.color }}>▪</span><span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 text-[11px] opacity-70" style={{ borderTop: "1px dashed #2a241955" }}>
                  Budget: <b>{caze.budget} questions</b> · Composure: <b>{caze.startComposure}/100</b> · Hidden intel: <b>2 fragments</b>
                </div>
              </div>
            </div>
            <button onClick={enterRoom} disabled={busy} className="w-full mt-4 py-3 ds-display tracking-widest text-base disabled:opacity-60" style={{ background: caze.color, color: "#14120f", border: "none" }}>
              ENTER THE ROOM →
            </button>
            {errMsg && <p className="text-xs mt-2" style={{ color: "#e05555" }}>{errMsg}</p>}
            <button onClick={reset} className="w-full mt-2 py-2 text-xs opacity-60" style={{ background: "none", border: "none", color: "#e8dfc8" }}>
              back to the board
            </button>
          </div>
        )}

        {screen === "enter" && caze && (
          <div className="ds-lamp text-center" style={{ paddingTop: "26vh" }}>
            <p className="text-[10px] tracking-widest opacity-60 mb-2">RECORDING IN PROGRESS</p>
            <h2 className="ds-display text-2xl" style={{ textShadow: "0 0 30px #e8dfc833" }}>{caze.room}</h2>
            <p className="text-xs opacity-60 mt-2">{caze.name} is waiting.</p>
          </div>
        )}

        {screen === "room" && caze && (
          <div className="ds-fade">
            <div className="flex items-center gap-3 mb-1 relative">
              <Portrait caze={caze} size={56} mood={mood} />
              <div className="flex-1 min-w-0 relative">
                <div className="flex justify-between items-baseline">
                  <span className="ds-display text-sm">{caze.name}</span>
                  <span className="text-[10px] tracking-widest" style={{ opacity: 0.8, color: caze.budget - questionsUsed <= 2 ? "#e05555" : "#e8dfc8" }}>
                    Q {questionsUsed}/{caze.budget}
                  </span>
                </div>
                <Polygraph composure={composure} pulse={pulse} flash={flash} />
                <div className="flex justify-between text-[9px] tracking-widest opacity-60">
                  <span style={{ color: mood === "breaking" ? "#e05555" : mood === "rattled" ? "#c9913a" : "#5f9e6e" }}>
                    {mood === "breaking" ? "● BREAKING" : mood === "rattled" ? "● RATTLED" : "● COMPOSED"}
                  </span>
                  <span>COMPOSURE {composure}</span>
                </div>
                {floatDelta && floatDelta.v < 0 && (
                  <span key={floatDelta.k} className="ds-float text-sm" style={{ color: floatDelta.v <= -18 ? "#e05555" : "#c9913a" }}>
                    {floatDelta.v}
                  </span>
                )}
              </div>
            </div>

            <div ref={scrollRef} className="ds-scroll overflow-y-auto pr-1 my-2" style={{ height: "36vh", minHeight: 190 }}>
              <div className="ds-paper mb-3">
                <div className="ds-paper-edge" />
                <div className="p-3">
                  <p className="text-[10px] tracking-widest opacity-60 mb-1.5">CASE FILE · {caze.difficulty}</p>
                  <ul className="space-y-1">
                    {caze.briefing.map((b, bi) => (
                      <li key={bi} className="text-[11px] leading-snug flex gap-1.5">
                        <span style={{ color: caze.color }}>▪</span><span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {intelUnlocked.length > 0 && (
                    <div className="mt-2 pt-2" style={{ borderTop: "1px dashed #2a241955" }}>
                      {intelUnlocked.map((note, ii) => (
                        <p key={ii} className="text-[11px] leading-snug" style={{ color: "#b3262a", fontWeight: 700 }}>★ {note}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {transcript.map((m, i) =>
                m.role === "det" ? (
                  <div key={i} className="ds-fade mb-2.5">
                    <p className="text-[10px] tracking-widest opacity-50">DETECTIVE</p>
                    <p className="text-sm leading-snug opacity-80 italic">{m.text}</p>
                  </div>
                ) : (
                  <SuspectLine key={i} m={m} caze={caze} isLatest={i === transcript.length - 1 && i > 0} sfxOn={soundOn} sfx={sfx} />
                )
              )}
              {busy && <p className="text-sm opacity-60"><span className="ds-caret">▌</span></p>}
              {cracked && (
                <div className="text-center py-3">
                  <span className="ds-stamp text-2xl" style={{ color: "#e05555" }}>Cracked</span>
                </div>
              )}
            </div>

            {errMsg && <p className="text-xs mb-2" style={{ color: "#e05555" }}>{errMsg}</p>}

            {!cracked && (
              <div className="space-y-1.5">
                {suggested.map((s, i) => (
                  <button key={i} disabled={busy} onClick={() => ask(s.q)} className="ds-chip w-full px-3 py-2 flex gap-2 items-baseline disabled:opacity-40">
                    <span className="text-[9px] tracking-widest shrink-0" style={{ color: tacticColor[s.tactic] || "#e8dfc8" }}>{s.tactic}</span>
                    <span className="text-xs leading-snug">{s.q}</span>
                  </button>
                ))}
                <div className="flex gap-1.5 pt-1">
                  <input
                    value={customQ}
                    onChange={(e) => setCustomQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && customQ.trim() && !busy) ask(customQ.trim()); }}
                    placeholder="or ask your own…"
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none"
                    style={{ border: "1px solid #e8dfc833", color: "#e8dfc8" }}
                  />
                  <button disabled={busy || !customQ.trim()} onClick={() => ask(customQ.trim())} className="px-3 text-xs ds-display disabled:opacity-30" style={{ border: "1px solid #e8dfc855", background: "none", color: "#e8dfc8" }}>
                    ASK
                  </button>
                </div>
                <div className="mt-3 pt-2.5" style={{ borderTop: "1px dashed #e8dfc822" }}>
                  <button onClick={() => { if (soundOn) sfx.tap(); setScreen("accuse"); }} disabled={busy} className="w-full py-2 text-xs tracking-widest disabled:opacity-40" style={{ border: "1px solid #b3262a88", color: "#e08884", background: "none" }}>
                    ⚖ CLOSE THE FILE & ACCUSE
                  </button>
                  <p className="text-[9px] opacity-40 text-center mt-1.5 leading-snug">
                    Break them for a confession — or close the file when you&rsquo;ve got the truth. Accuse wrong and it stays sealed.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "accuse" && caze && (
          <div className="ds-fade">
            <p className="text-[10px] tracking-widest opacity-60 mb-1">
              {questionsUsed >= caze.budget ? "OUT OF QUESTIONS" : "CLOSING THE FILE"}
            </p>
            <h2 className="ds-display text-2xl mb-3">What really happened?</h2>
            {intelUnlocked.length > 0 && (
              <div className="ds-paper mb-3">
                <div className="ds-paper-edge" />
                <div className="p-3">
                  <p className="text-[10px] tracking-widest opacity-60 mb-1">YOUR INTEL</p>
                  {intelUnlocked.map((note, idx) => (
                    <p key={idx} className="text-xs leading-snug mb-1">★ {note}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {(theoryOrder.length ? theoryOrder : caze.theories.map((_, i) => i)).map((origIdx) => (
                <button key={origIdx} onClick={() => makeAccusation(origIdx)} className="ds-chip w-full px-3 py-3 text-xs leading-snug">
                  {caze.theories[origIdx]}
                </button>
              ))}
            </div>
            <p className="text-[10px] opacity-50 text-center mt-2">One shot. If you&rsquo;re wrong, the truth stays sealed.</p>
            {questionsUsed < caze.budget && (
              <button onClick={() => setScreen("room")} className="w-full mt-3 py-2 text-xs opacity-60" style={{ background: "none", border: "none", color: "#e8dfc8" }}>
                ← back to the room ({caze.budget - questionsUsed} questions left)
              </button>
            )}
          </div>
        )}

        {screen === "verdict" && caze && (
          <div className="ds-fade text-center">
            <div className="py-5">
              <span className="ds-stamp text-3xl" style={{ color: won ? "#5f9e6e" : (outcome === "HUNCH" || outcome === "NEAR_MISS") ? "#c9913a" : "#e05555" }}>
                {outcome === "CONFESSED" ? "Confessed" : outcome === "CASE_CLOSED" ? "Case Closed" : outcome === "HUNCH" ? "Lucky Hunch" : outcome === "NEAR_MISS" ? "So Close" : "Walked Free"}
              </span>
              <p className="text-[11px] opacity-70 mt-3 px-6 leading-snug">
                {outcome === "CONFESSED" ? "You broke them. Full confession on the record." :
                 outcome === "CASE_CLOSED" ? "Right call, backed by your interrogation. Truth declassified." :
                 outcome === "HUNCH" ? "You guessed right — but you never earned the why." :
                 outcome === "NEAR_MISS" ? "You had them on the ropes — wrong theory, but you did the work." :
                 "Wrong call. They walked, and the truth stays sealed."}
              </p>
              <div className="mt-4">
                <span className="ds-display text-5xl" style={{ color: rank === "S" ? "#c9913a" : rank === "F" || rank === "?" ? "#e05555" : "#e8dfc8", textShadow: "0 0 26px currentColor" }}>
                  {rank}
                </span>
                <p className="text-[10px] tracking-widest opacity-60 mt-1">
                  DETECTIVE RANK{streak > 1 ? ` · 🔥 ${streak}-DAY STREAK` : ""}
                </p>
              </div>
            </div>
            {verdict?.truthSealed ? (
              <div className="text-left" style={{ border: "1px dashed #b3262a66", padding: 16 }}>
                <p className="text-[10px] tracking-widest mb-1" style={{ color: "#e08884" }}>THE TRUTH — SEALED</p>
                <p className="text-xs leading-relaxed opacity-80">
                  {outcome === "HUNCH"
                    ? "A lucky theory isn’t an investigation. Question the suspect — crack them, or earn it with evidence — to declassify what really happened."
                    : outcome === "NEAR_MISS"
                    ? "You pushed them to the brink, but pinned the wrong theory. The truth stays sealed — come back and close it clean."
                    : "Case filed unsolved. Break the suspect, or accuse correctly with real evidence, to declassify the truth."}
                </p>
              </div>
            ) : (
              <div className="ds-paper text-left" style={{ transform: "rotate(-0.4deg)" }}>
                <div className="ds-paper-edge" />
                <div className="p-4">
                  <p className="text-[10px] tracking-widest opacity-60 mb-1">THE TRUTH — DECLASSIFIED</p>
                  <p className="text-xs leading-relaxed">{verdict?.reveal || "…"}</p>
                  {outcome === "CONFESSED" && (
                    <p className="text-xs leading-relaxed mt-2 italic opacity-80">Broken in {questionsUsed} question{questionsUsed === 1 ? "" : "s"}. Biggest hit: −{biggestHit} composure.</p>
                  )}
                  {outcome === "CASE_CLOSED" && verdict?.theory && (
                    <p className="text-xs mt-2" style={{ color: "#3c6e4c" }}>Your theory: “{verdict.theory}” — correct.</p>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 p-3 text-left text-xs whitespace-pre-wrap" style={{ border: "1px dashed #e8dfc844" }}>
              {shareText()}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={copyShare} className="flex-1 py-3 ds-display tracking-widest" style={{ background: "#e8dfc8", color: "#14120f", border: "none" }}>
                {copied ? "COPIED ✓" : "SHARE RESULT"}
              </button>
              <button onClick={reset} className="flex-1 py-3 ds-display tracking-widest" style={{ border: "1px solid #e8dfc855", background: "none", color: "#e8dfc8" }}>
                NEXT CASE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
