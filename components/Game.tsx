"use client";

import { useState, useRef, useEffect } from "react";
import type { PublicCase, Suggested } from "@/lib/cases";

// ============================================================
// DAILY SUSPECT — client game shell.
// All hidden truths live server-side; this component only ever
// sees public case data + per-turn API responses.
// ============================================================

type Msg = { role: "det" | "sus"; text: string; delta?: number };

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
      </p>
      <p className="text-sm leading-snug">
        {shown}
        {!done && <span className="ds-caret">▌</span>}
      </p>
    </div>
  );
}

// ---------- Main ----------
export default function Game({ cases }: { cases: PublicCase[] }) {
  const [screen, setScreen] = useState<"title" | "brief" | "enter" | "room" | "accuse" | "verdict">("title");
  const [caze, setCaze] = useState<PublicCase | null>(null);
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [composure, setComposure] = useState(100);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [suggested, setSuggested] = useState<Suggested[]>([]);
  const [busy, setBusy] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [verdict, setVerdict] = useState<{ correct: boolean; reveal: string; theory: string | null } | null>(null);
  const [customQ, setCustomQ] = useState("");
  const [pulse, setPulse] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [floatDelta, setFloatDelta] = useState<{ v: number; k: number } | null>(null);
  const [intelUnlocked, setIntelUnlocked] = useState<string[]>([]);
  const [toast, setToast] = useState<{ text: string; k: number } | null>(null);
  const [biggestHit, setBiggestHit] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sfxRef = useRef<any>(null);
  if (!sfxRef.current && typeof window !== "undefined") sfxRef.current = makeSfx();
  const sfx = sfxRef.current || { tap() {}, type() {}, hit() {}, stamp() {}, crack() {}, beat() {} };

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 0.15), 80);
    return () => clearInterval(t);
  }, []);

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

  const enterRoom = () => {
    if (!caze) return;
    if (soundOn) sfx.stamp();
    setTranscript([{ role: "sus", text: caze.opening }]);
    setComposure(caze.startComposure);
    setQuestionsUsed(0);
    setSuggested(caze.starters);
    setCracked(false);
    setVerdict(null);
    setErrMsg("");
    setIntelUnlocked([]);
    setBiggestHit(0);
    setScreen("enter");
    setTimeout(() => setScreen("room"), 1400);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicOn) audioRef.current.pause();
    else { audioRef.current.volume = 0.45; audioRef.current.play().catch(() => {}); }
    setMusicOn(!musicOn);
  };
  const toggleSound = () => { if (!soundOn) sfx.tap(); setSoundOn(!soundOn); };

  const fetchVerdict = async (theoryIndex: number, theoryLabel: string | null) => {
    if (!caze) return;
    try {
      const res = await fetch("/api/accuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caze.id, theoryIndex }),
      });
      const r = await res.json();
      setVerdict({ correct: !!r.correct, reveal: r.reveal || "", theory: theoryLabel });
    } catch {
      setVerdict({ correct: theoryIndex === -1, reveal: "", theory: theoryLabel });
    }
  };

  const ask = async (q: string) => {
    if (busy || cracked || !caze) return;
    if (soundOn) sfx.tap();
    setBusy(true);
    setErrMsg("");
    setCustomQ("");
    const newTranscript: Msg[] = [...transcript, { role: "det", text: q }];
    setTranscript(newTranscript);
    try {
      const res = await fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caze.id, transcript, question: q, composure }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "request failed");
      }
      const r = await res.json();
      setTranscript([...newTranscript, { role: "sus", text: r.reply, delta: r.delta }]);
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
      setErrMsg(e.message === "ANTHROPIC_API_KEY is not configured on the server." ? "Server missing API key — see README." : "Line went dead. Ask again.");
    }
    setBusy(false);
  };

  const makeAccusation = (idx: number) => {
    if (!caze) return;
    if (soundOn) sfx.stamp();
    fetchVerdict(idx, caze.theories[idx]);
    setScreen("verdict");
  };

  const won = cracked || !!(verdict && verdict.correct);

  const rank = (() => {
    if (!caze) return "—";
    if (cracked) {
      const ratio = questionsUsed / caze.budget;
      return ratio <= 0.45 ? "S" : ratio <= 0.75 ? "A" : "B";
    }
    if (won) return intelUnlocked.length >= 2 ? "B" : "C";
    return "F";
  })();

  const shareText = () => {
    if (!caze) return "";
    const qMarks = "❓".repeat(questionsUsed) + (won ? "✅" : "❌");
    return `DAILY SUSPECT — ${caze.crime}\n${qMarks} ${cracked ? "CONFESSION" : won ? "CASE CLOSED" : "WALKED FREE"} in ${questionsUsed}/${caze.budget} · RANK ${rank}\n🫀 composure ${caze.startComposure} → ${composure} · biggest hit −${biggestHit}`;
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

  const reset = () => { if (soundOn) sfx.tap(); setScreen("title"); setCaze(null); };

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

      <div className="max-w-md mx-auto px-4 pb-10 pt-5 relative" style={{ zIndex: 10 }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={reset} className="ds-display text-lg tracking-widest" style={{ color: "#e8dfc8", background: "none", border: "none" }}>
            DAILY SUSPECT
          </button>
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
          <div className="ds-fade">
            <p className="text-sm opacity-70 mb-1">One suspect. A handful of questions.</p>
            <h1 className="ds-display text-4xl leading-tight mb-2 ds-title-flicker" style={{ color: "#e8dfc8", textShadow: "0 0 24px #e8dfc822" }}>
              Make them<br />talk.
            </h1>
            <p className="text-[11px] opacity-50 mb-5">Turn on ♫ and SFX. This game is meant to be heard.</p>
            <div className="space-y-3">
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
            <p className="text-[11px] opacity-50 mt-5 leading-relaxed">
              Every suspect hides one truth. Hit a pressure point and their composure drops — drop it to zero and they break. Or run out of questions and stake your accusation.
            </p>
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
            <button onClick={enterRoom} className="w-full mt-4 py-3 ds-display tracking-widest text-base" style={{ background: caze.color, color: "#14120f", border: "none" }}>
              ENTER THE ROOM →
            </button>
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
                <button onClick={() => { if (soundOn) sfx.tap(); setScreen("accuse"); }} disabled={busy} className="w-full py-2 mt-1 text-xs tracking-widest disabled:opacity-40" style={{ border: "1px solid #b3262a88", color: "#e08884", background: "none" }}>
                  ⚖ MAKE YOUR ACCUSATION
                </button>
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
              {caze.theories.map((label, i) => (
                <button key={i} onClick={() => makeAccusation(i)} className="ds-chip w-full px-3 py-3 text-xs leading-snug">
                  {label}
                </button>
              ))}
            </div>
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
              <span className="ds-stamp text-3xl" style={{ color: won ? "#5f9e6e" : "#e05555" }}>
                {cracked ? "Confessed" : won ? "Case Closed" : "Walked Free"}
              </span>
              <div className="mt-4">
                <span className="ds-display text-5xl" style={{ color: rank === "S" ? "#c9913a" : rank === "F" ? "#e05555" : "#e8dfc8", textShadow: "0 0 26px currentColor" }}>
                  {rank}
                </span>
                <p className="text-[10px] tracking-widest opacity-60 mt-1">DETECTIVE RANK</p>
              </div>
            </div>
            <div className="ds-paper text-left" style={{ transform: "rotate(-0.4deg)" }}>
              <div className="ds-paper-edge" />
              <div className="p-4">
                <p className="text-[10px] tracking-widest opacity-60 mb-1">THE TRUTH — DECLASSIFIED</p>
                <p className="text-xs leading-relaxed">{verdict?.reveal || "…"}</p>
                {cracked && (
                  <p className="text-xs leading-relaxed mt-2 italic opacity-80">Broken in {questionsUsed} question{questionsUsed === 1 ? "" : "s"}. Biggest hit: −{biggestHit} composure.</p>
                )}
                {!cracked && verdict?.theory && (
                  <p className="text-xs mt-2" style={{ color: won ? "#3c6e4c" : "#b3262a" }}>
                    Your theory: “{verdict.theory}” — {won ? "correct." : "wrong."}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 text-left text-xs whitespace-pre-wrap" style={{ border: "1px dashed #e8dfc844" }}>
              {shareText()}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={copyShare} className="flex-1 py-3 ds-display tracking-widest" style={{ background: "#e8dfc8", color: "#14120f", border: "none" }}>
                {copied ? "COPIED ✓" : "COPY RESULT"}
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
