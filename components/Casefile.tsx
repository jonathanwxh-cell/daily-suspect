"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

// ============================================================
// CASEFILE MODE — long-form closed-circle whodunit.
// Additive: talks only to /api/season/*. The daily game is untouched.
// ============================================================

type Thread = { id: string; label: string; hint: string; ask: string };
type Suspect = { id: string; name: string; role: string; age: number; initials: string; color: string; portrait: string; blurb: string; threads: Thread[] };
type Clue = { id: string; kind: "statement" | "evidence"; title: string; text: string };
type BoardQ = { id: string; prompt: string; kind: "suspect" | "clue" };
type CaseData = { id: string; title: string; tagline: string; setting: string; victimName: string; difficulty: string; accent: string; briefing: string[]; episodes: { id: string; title: string; teaser: string }[]; suspects: Suspect[]; board: { questions: BoardQ[] } };
type GameState = { episode: number; episodeInfo: { title: string; teaser: string; index: number } | null; composure: Record<string, Record<string, number>>; brokenThreads: string[]; caseFile: Clue[]; board: Record<string, { answer: string; clues: string[]; locked: boolean }>; questionCount: number; solved: boolean; rank: string | null };
type Line = { role: "det" | "sus"; text: string; meta?: string };

const STORE_KEY = "ds-casefile-session";

function reaction(delta: number, broke: boolean): string {
  if (broke) return "their story cracks open";
  if (delta <= -16) return "that struck a nerve";
  if (delta <= -9) return "that pressed them";
  if (delta < 0) return "barely moved them";
  return "didn't land on anything they're hiding";
}

function Portrait({ s, size = 64 }: { s: { portrait?: string; initials: string; color: string; name?: string }; size?: number }) {
  const [err, setErr] = useState(false);
  return (
    <div className="ds-polaroid" style={{ width: size, height: size, background: "#1c1916", flexShrink: 0, boxShadow: "0 4px 14px #000000aa" }}>
      {s.portrait && !err ? (
        <img src={s.portrait} alt={s.name || ""} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.6) contrast(1.08)" }} />
      ) : (
        <div className="flex items-center justify-center w-full h-full" style={{ color: s.color, fontSize: size * 0.34, fontFamily: "'Special Elite', monospace" }}>{s.initials}</div>
      )}
    </div>
  );
}

export default function Casefile() {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<"cover" | "roster" | "room" | "file" | "board" | "finale">("cover");
  const [active, setActive] = useState<string | null>(null);
  const [convo, setConvo] = useState<Record<string, Line[]>>({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<{ text: string; k: number } | null>(null);
  const [banner, setBanner] = useState<{ title: string; teaser: string; k: number } | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [verdict, setVerdict] = useState<{ solved: boolean; rank?: string; reveal?: string; killerName?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const toggleMusic = () => { const a = audioRef.current; if (!a) return; if (musicOn) a.pause(); else { a.volume = 0.4; a.play().catch(() => {}); } setMusicOn(!musicOn); };
  const [assisted, setAssisted] = useState(true);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [assistPresent, setAssistPresent] = useState<{ clueId: string; title: string } | null>(null);
  useEffect(() => { try { const v = localStorage.getItem("ds-casefile-assist"); if (v !== null) setAssisted(v === "1"); } catch {} }, []);

  useEffect(() => { apiFetch<{ case: CaseData }>("/api/season/case?id=holloway").then((d) => setCaseData(d.case)).catch(() => setErr("Casefile is offline. Try again shortly.")); }, []);
  useEffect(() => { const id = typeof window !== "undefined" ? localStorage.getItem(STORE_KEY) : null; if (id) resume(id); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 500; });

  const sync = (s: GameState) => setState(s);
  const showToast = (text: string) => { setToast({ text, k: Date.now() }); setTimeout(() => setToast(null), 4200); };

  async function resume(id: string) {
    try {
      const d = await apiFetch<{ state: GameState }>("/api/season/state", { method: "POST", body: JSON.stringify({ sessionId: id }) });
      setSessionId(id); sync(d.state); setScreen(d.state.solved ? "finale" : "roster");
      if (d.state.solved) setVerdict({ solved: true, rank: d.state.rank || "" });
    } catch { localStorage.removeItem(STORE_KEY); }
  }

  async function begin() {
    setBusy(true); setErr("");
    try {
      const d = await apiFetch<{ sessionId: string; case: CaseData; state: GameState }>("/api/season/start", { method: "POST", body: JSON.stringify({ seasonId: "holloway" }) });
      setSessionId(d.sessionId); setCaseData(d.case); sync(d.state); setScreen("roster");
      localStorage.setItem(STORE_KEY, d.sessionId);
    } catch { setErr("Couldn't open the case. Try again."); }
    setBusy(false);
  }

  function handleUnlocks(unlocked: Clue[], episodeAdvanced: { title: string; teaser: string } | null) {
    if (unlocked?.length) showToast("NEW EVIDENCE — " + unlocked.map((c) => c.title).join("; "));
    if (episodeAdvanced) { setBanner({ title: episodeAdvanced.title, teaser: episodeAdvanced.teaser, k: Date.now() }); setTimeout(() => setBanner(null), 5200); }
  }

  async function ask(q: string) {
    if (busy || !sessionId || !active) return;
    setBusy(true); setErr(""); setDraft("");
    setConvo((c) => ({ ...c, [active]: [...(c[active] || []), { role: "det", text: q }] }));
    try {
      const r = await apiFetch<any>("/api/season/interrogate", { method: "POST", body: JSON.stringify({ sessionId, suspectId: active, question: q, assisted }) });
      const label = caseData?.suspects.find((s) => s.id === active)?.threads.find((t) => t.id === r.thread)?.label;
      const meta = r.stonewall
        ? `— ${label}: they won't budge on this without hard proof. Find evidence and ▣ Present it.`
        : r.thread === "none" || !label
        ? "— didn't land on anything they're hiding"
        : `— ${label}: ${reaction(r.delta, r.broke)}`;
      setConvo((c) => ({ ...c, [active!]: [...(c[active!] || []), { role: "sus", text: r.reply, meta }] }));
      sync(r.state); handleUnlocks(r.unlocked, r.episodeAdvanced); setSuggested(r.suggested || []); if (assisted) setAssistPresent(r.assistPresent || null);
    } catch (e: any) { setErr(e?.message === "Bad model output" ? "They mumbled something. Ask again." : "The line went quiet. Ask again."); setConvo((c) => ({ ...c, [active!]: (c[active!] || []).slice(0, -1) })); }
    setBusy(false);
  }

  async function present(clueId: string) {
    if (busy || !sessionId || !active) return;
    setPresenting(false); setBusy(true); setErr("");
    const clue = state?.caseFile.find((c) => c.id === clueId);
    setConvo((c) => ({ ...c, [active!]: [...(c[active!] || []), { role: "det", text: `[You lay out: ${clue?.title}]` }] }));
    try {
      const r = await apiFetch<any>("/api/season/present", { method: "POST", body: JSON.stringify({ sessionId, suspectId: active, clueId, assisted }) });
      const meta = r.implicated ? "— the evidence lands; their story breaks" : "— they brush it off; it doesn't touch them";
      setConvo((c) => ({ ...c, [active!]: [...(c[active!] || []), { role: "sus", text: r.reply, meta }] }));
      sync(r.state); handleUnlocks(r.unlocked, r.episodeAdvanced); setSuggested(r.suggested || []); if (assisted) setAssistPresent(r.assistPresent || null);
    } catch { setErr("The line went quiet. Try again."); }
    setBusy(false);
  }

  async function refreshAssist(suspectId: string, isAssisted: boolean) {
    if (!sessionId || !isAssisted) { setAssistPresent(null); return; }
    try {
      const r = await apiFetch<any>("/api/season/look", { method: "POST", body: JSON.stringify({ sessionId, suspectId, assisted: true }) });
      setAssistPresent(r.assistPresent || null);
    } catch {}
  }
  function enterRoom(suspectId: string) {
    setActive(suspectId); setScreen("room"); setSuggested([]); setAssistPresent(null);
    refreshAssist(suspectId, assisted);
  }
  const setAssist = (v: boolean) => {
    setAssisted(v);
    try { localStorage.setItem("ds-casefile-assist", v ? "1" : "0"); } catch {}
    if (active) refreshAssist(active, v); else setAssistPresent(null);
  };

  async function lock(qid: string, answer: string, clues: string[]) {
    if (!sessionId) return;
    setErr("");
    const r = await apiFetch<any>("/api/season/board", { method: "POST", body: JSON.stringify({ sessionId, questionId: qid, answer, clues }) });
    sync(r.state);
    if (!r.accepted) setErr(r.reason);
  }

  async function accuse() {
    if (!sessionId) return;
    setBusy(true); setErr("");
    const r = await apiFetch<any>("/api/season/accuse", { method: "POST", body: JSON.stringify({ sessionId }) });
    if (r.solved) {
      const killerName = caseData?.suspects.find((s) => s.id === r.killer)?.name;
      setVerdict({ solved: true, rank: r.rank, reveal: r.reveal, killerName }); sync(r.state); setScreen("finale");
    } else { setErr(r.message); sync(r.state); }
    setBusy(false);
  }

  const accent = caseData?.accent || "#b3262a";
  const fileCount = state?.caseFile.length || 0;
  const allLocked = !!caseData && caseData.board.questions.every((q) => state?.board[q.id]?.locked);

  return (
    <div className="ds-root">
      <div className="ds-grain" />
      <div className="ds-vig" />
      <audio ref={audioRef} src="/media/season/holloway/theme.mp3" loop preload="none" />

      {toast && (
        <div className="ds-toast ds-paper" key={toast.k}>
          <div className="ds-paper-edge" />
          <div className="p-3"><p className="text-[10px] tracking-widest mb-0.5" style={{ color: accent, fontWeight: 700 }}>★ {toast.text}</p></div>
        </div>
      )}
      {banner && (
        <div className="ds-toast ds-paper" key={banner.k} style={{ bottom: "auto", top: 60 }}>
          <div className="ds-paper-edge" />
          <div className="p-3"><p className="text-[10px] tracking-widest mb-0.5" style={{ color: accent, fontWeight: 700 }}>NEW EPISODE · {banner.title}</p><p className="text-xs leading-snug">{banner.teaser}</p></div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pb-24 pt-5 relative" style={{ zIndex: 10 }}>
        {/* header */}
        <div className="flex items-center justify-between mb-3">
          <a href="/" className="text-[11px] tracking-widest opacity-50" style={{ color: "#e8dfc8" }}>← DAILY</a>
          <span className="ds-display text-sm tracking-widest" style={{ color: "#e8dfc8" }}>CASEFILE</span>
          <div className="flex items-center gap-2">
            {state?.episodeInfo && <span className="text-[10px] tracking-widest opacity-60">EP {state.episodeInfo.index + 1}</span>}
            <button onClick={toggleMusic} className="text-[11px] px-2 py-1 ds-chip" aria-label="Toggle music">{musicOn ? "♫ ✓" : "♫ ✗"}</button>
          </div>
        </div>

        {!caseData && !err && <div className="ds-paper p-4 text-xs opacity-75">Opening the case…</div>}
        {err && screen === "cover" && <div className="ds-paper p-4"><p className="text-xs" style={{ color: "#e05555" }}>{err}</p></div>}

        {/* COVER */}
        {screen === "cover" && caseData && (
          <div className="ds-fade">
            <p className="text-[11px] tracking-widest opacity-60 mb-1">{caseData.difficulty}</p>
            <h1 className="ds-display text-3xl leading-tight mb-1" style={{ color: "#e8dfc8" }}>{caseData.title}</h1>
            <p className="text-sm opacity-80 mb-4">{caseData.tagline}</p>
            <div className="ds-paper" style={{ transform: "rotate(-0.4deg)" }}>
              <div className="ds-paper-edge" />
              <div className="p-4">
                <p className="text-[10px] tracking-widest opacity-60 mb-1.5">THE FILE</p>
                <p className="text-xs italic opacity-80 mb-2">{caseData.setting}</p>
                <ul className="space-y-1.5">{caseData.briefing.map((b, i) => (<li key={i} className="text-xs leading-snug flex gap-2"><span style={{ color: accent }}>▪</span><span>{b}</span></li>))}</ul>
              </div>
            </div>
            <button onClick={begin} disabled={busy} className="w-full mt-4 py-3 ds-display tracking-widest text-base disabled:opacity-60" style={{ background: accent, color: "#14120f", border: "none" }}>{busy ? "OPENING…" : "OPEN THE CASE →"}</button>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] tracking-widest opacity-60">DIFFICULTY</span>
              <button onClick={() => setAssist(true)} className="text-[10px] tracking-widest px-2 py-1" style={{ border: `1px solid ${assisted ? accent : "#e8dfc822"}`, background: "none", color: assisted ? accent : "#e8dfc888" }}>ASSISTED</button>
              <button onClick={() => setAssist(false)} className="text-[10px] tracking-widest px-2 py-1" style={{ border: `1px solid ${!assisted ? accent : "#e8dfc822"}`, background: "none", color: !assisted ? accent : "#e8dfc888" }}>CLASSIC</button>
            </div>
            <p className="text-[11px] opacity-50 mt-2 leading-relaxed">{assisted ? "Assisted: tap suggested questions and the game points you to the clue to present." : "Classic: questions still suggested, but you choose which clue cracks them and solve the board yourself."} Free-form typing always works.</p>
          </div>
        )}

        {/* ROSTER */}
        {screen === "roster" && caseData && state && (
          <div className="ds-fade">
            {state.episodeInfo && (<div className="mb-3"><p className="ds-display text-base">{state.episodeInfo.title}</p><p className="text-xs opacity-70">{state.episodeInfo.teaser}</p></div>)}
            <p className="text-[10px] tracking-widest opacity-60 mb-2">THE HOUSEGUESTS — tap to question</p>
            <div className="space-y-2.5">
              {caseData.suspects.map((s) => {
                const broken = caseData.suspects.length && state.brokenThreads.filter((k) => k.startsWith(s.id + ".")).length;
                return (
                  <button key={s.id} onClick={() => enterRoom(s.id)} className="w-full ds-paper p-0 text-left" style={{ border: "none", display: "block" }}>
                    <div className="ds-paper-edge" />
                    <div className="p-3 flex gap-3 items-center">
                      <Portrait s={s} size={56} />
                      <div className="min-w-0 flex-1">
                        <span className="ds-display text-base">{s.name}</span>
                        <p className="text-[11px] opacity-70" style={{ color: s.color }}>{s.role}</p>
                        <p className="text-xs opacity-80 leading-snug mt-0.5">{s.blurb}</p>
                      </div>
                      <span className="text-[9px] tracking-widest opacity-50">{broken ? `${broken} cracked` : ""}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ROOM */}
        {screen === "room" && caseData && state && active && (() => {
          const s = caseData.suspects.find((x) => x.id === active)!;
          const lines = convo[active] || [];
          return (
            <div className="ds-fade">
              <div className="flex items-center gap-3 mb-2">
                <Portrait s={s} size={52} />
                <div className="flex-1 min-w-0"><span className="ds-display text-base">{s.name}</span><p className="text-[11px] opacity-70" style={{ color: s.color }}>{s.role}</p></div>
                <button onClick={() => setAssist(!assisted)} title="Assisted mode surfaces suggested questions and the exact clue to present; Classic makes you deduce it." className="text-[9px] tracking-widest px-2 py-1 mr-1" style={{ border: "1px solid #e8dfc822", background: "none", color: assisted ? accent : "#e8dfc888" }}>{assisted ? "ASSIST ✓" : "ASSIST ✗"}</button>
                <button onClick={() => setScreen("roster")} className="text-[10px] tracking-widest opacity-60" style={{ background: "none", border: "none", color: "#e8dfc8" }}>ALL ▸</button>
              </div>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {s.threads.map((t) => {
                  const broke = state.brokenThreads.includes(`${s.id}.${t.id}`);
                  if (broke) return (<span key={t.id} className="text-[9px] tracking-widest px-2 py-1" style={{ border: "1px solid #5f9e6e88", color: "#7fcf90" }}>✓ {t.label}</span>);
                  return (<button key={t.id} disabled={busy} onClick={() => ask(t.ask)} title={t.hint} className="text-[9px] tracking-widest px-2 py-1 disabled:opacity-40" style={{ border: "1px solid #e8dfc833", background: "none", color: "#e8dfc8aa" }}>{t.label}</button>);
                })}
              </div>

              <div ref={scrollRef} className="ds-scroll overflow-y-auto pr-1 my-2" style={{ height: "38vh", minHeight: 200 }}>
                {lines.length === 0 && <p className="text-xs opacity-50 italic leading-snug">{s.name} waits. Ask about their night, the victim, their secrets — or lay a piece of evidence on the table.</p>}
                {lines.map((m, i) => m.role === "det" ? (
                  <div key={i} className="ds-fade mb-2.5"><p className="text-[10px] tracking-widest opacity-50">YOU</p><p className="text-sm leading-snug opacity-80 italic">{m.text}</p></div>
                ) : (
                  <div key={i} className="ds-fade mb-2.5"><p className="text-[10px] tracking-widest opacity-50">{s.name.toUpperCase()}{m.meta ? <span className="opacity-60 italic normal-case tracking-normal"> {m.meta}</span> : null}</p><p className="text-sm leading-snug">{m.text}</p></div>
                ))}
                {busy && <p className="text-sm opacity-60"><span className="ds-caret">▌</span></p>}
              </div>

              {err && screen === "room" && <p className="text-xs mb-2" style={{ color: "#e05555" }}>{err}</p>}

              {presenting ? (
                <div className="ds-paper mb-2"><div className="ds-paper-edge" /><div className="p-3">
                  <p className="text-[10px] tracking-widest opacity-60 mb-1.5">LAY DOWN A PIECE OF EVIDENCE</p>
                  {fileCount === 0 ? <p className="text-xs opacity-70">You have no evidence yet. Question them first.</p> : (
                    <div className="space-y-1">{state.caseFile.filter((c) => c.id !== "case_open" && c.id !== "lawyer_note").map((c) => (<button key={c.id} onClick={() => present(c.id)} className="ds-chip w-full px-2.5 py-2 text-xs leading-snug">{c.title}</button>))}</div>
                  )}
                  <button onClick={() => setPresenting(false)} className="text-[10px] tracking-widest opacity-60 mt-2" style={{ background: "none", border: "none", color: "#e8dfc8" }}>cancel</button>
                </div></div>
              ) : (
                <div className="space-y-1.5">
                  {assisted && assistPresent && (
                    <button disabled={busy} onClick={() => present(assistPresent.clueId)} className="w-full px-3 py-2 text-xs ds-display tracking-widest disabled:opacity-40" style={{ border: `1px solid ${accent}`, background: `${accent}22`, color: "#f0c0c0" }}>▣ PRESENT: {assistPresent.title} →</button>
                  )}
                  {suggested.map((q, i) => (
                    <button key={i} disabled={busy} onClick={() => ask(q)} className="ds-chip w-full px-3 py-2 text-xs leading-snug disabled:opacity-40" style={{ textAlign: "left" }}>{q}</button>
                  ))}
                  <div className="flex gap-1.5">
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && draft.trim() && !busy) ask(draft.trim()); }} placeholder="ask them something…" className="flex-1 px-3 py-2 text-xs bg-transparent outline-none" style={{ border: "1px solid #e8dfc833", color: "#e8dfc8" }} />
                    <button disabled={busy || !draft.trim()} onClick={() => ask(draft.trim())} className="px-3 text-xs ds-display disabled:opacity-30" style={{ border: "1px solid #e8dfc855", background: "none", color: "#e8dfc8" }}>ASK</button>
                  </div>
                  <button onClick={() => setPresenting(true)} disabled={busy} className="w-full py-2 text-xs tracking-widest disabled:opacity-40" style={{ border: `1px solid ${accent}88`, color: "#e6b8b8", background: "none" }}>▣ PRESENT EVIDENCE</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* CASE FILE */}
        {screen === "file" && state && (
          <div className="ds-fade">
            <p className="text-[10px] tracking-widest opacity-60 mb-2">CASE FILE · {fileCount} {fileCount === 1 ? "ITEM" : "ITEMS"}</p>
            <div className="space-y-2">
              {state.caseFile.map((c) => (
                <div key={c.id} className="ds-paper"><div className="ds-paper-edge" /><div className="p-3">
                  <p className="text-[10px] tracking-widest mb-0.5" style={{ color: c.kind === "evidence" ? accent : "#8a8" }}>{c.kind === "evidence" ? "◆ EVIDENCE" : "❝ STATEMENT"} — {c.title}</p>
                  <p className="text-xs leading-snug">{c.text}</p>
                </div></div>
              ))}
            </div>
          </div>
        )}

        {/* BOARD */}
        {screen === "board" && caseData && state && (
          <div className="ds-fade">
            <p className="text-[10px] tracking-widest opacity-60 mb-1">THE DEDUCTION BOARD</p>
            <p className="text-xs opacity-70 mb-3">Prove each point with the evidence in your Case File. Lock all three, then make the accusation.</p>
            {caseData.board.questions.map((q) => (<BoardQuestion key={q.id} q={q} caseData={caseData} state={state} accent={accent} onLock={lock} />))}
            {err && screen === "board" && <p className="text-xs mt-1" style={{ color: "#e05555" }}>{err}</p>}
            <button onClick={accuse} disabled={busy || !allLocked} className="w-full mt-4 py-3 ds-display tracking-widest text-base disabled:opacity-30" style={{ background: allLocked ? accent : "none", color: allLocked ? "#14120f" : "#e8dfc8", border: allLocked ? "none" : "1px solid #e8dfc833" }}>{allLocked ? "⚖ MAKE THE ACCUSATION" : "LOCK ALL THREE TO ACCUSE"}</button>
          </div>
        )}

        {/* FINALE */}
        {screen === "finale" && verdict && (
          <div className="ds-fade text-center">
            <div className="py-5">
              <span className="ds-stamp text-3xl" style={{ color: "#5f9e6e" }}>Case Closed</span>
              <div className="mt-4"><span className="ds-display text-5xl" style={{ color: verdict.rank === "S" ? "#c9913a" : "#e8dfc8", textShadow: "0 0 26px currentColor" }}>{verdict.rank}</span><p className="text-[10px] tracking-widest opacity-60 mt-1">DETECTIVE RANK</p></div>
            </div>
            <div className="ds-paper text-left" style={{ transform: "rotate(-0.4deg)" }}><div className="ds-paper-edge" /><div className="p-4">
              <p className="text-[10px] tracking-widest opacity-60 mb-1">THE TRUTH — DECLASSIFIED</p>
              {verdict.killerName && <p className="text-sm ds-display mb-1" style={{ color: accent }}>{verdict.killerName} did it.</p>}
              <p className="text-xs leading-relaxed">{verdict.reveal}</p>
            </div></div>
            <button onClick={() => { localStorage.removeItem(STORE_KEY); setVerdict(null); setConvo({}); setScreen("cover"); }} className="w-full mt-4 py-3 ds-display tracking-widest" style={{ border: "1px solid #e8dfc855", background: "none", color: "#e8dfc8" }}>NEW INVESTIGATION</button>
            <a href="/" className="block w-full mt-2 py-2 text-xs opacity-60" style={{ color: "#e8dfc8" }}>back to the daily game</a>
          </div>
        )}
      </div>

      {/* bottom nav */}
      {state && screen !== "cover" && screen !== "finale" && (
        <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 20, background: "#14120fee", borderTop: "1px solid #e8dfc822" }}>
          <div className="max-w-md mx-auto flex">
            {([["roster", "SUSPECTS"], ["file", `CASE FILE · ${fileCount}`], ["board", "BOARD"]] as const).map(([sc, label]) => (
              <button key={sc} onClick={() => setScreen(sc as any)} className="flex-1 py-3 text-[10px] tracking-widest" style={{ background: "none", border: "none", color: screen === sc || (sc === "roster" && screen === "room") ? accent : "#e8dfc888", fontWeight: screen === sc ? 700 : 400 }}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BoardQuestion({ q, caseData, state, accent, onLock }: { q: BoardQ; caseData: CaseData; state: GameState; accent: string; onLock: (qid: string, answer: string, clues: string[]) => void }) {
  const locked = state.board[q.id]?.locked;
  const [answer, setAnswer] = useState("");
  const [clues, setClues] = useState<string[]>([]);
  const answerOptions = q.kind === "suspect" ? caseData.suspects.map((s) => ({ id: s.id, label: s.name })) : state.caseFile.map((c) => ({ id: c.id, label: c.title }));
  const toggle = (id: string) => setClues((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  if (locked) return (<div className="ds-paper mb-2" style={{ opacity: 0.9 }}><div className="ds-paper-edge" /><div className="p-3"><p className="text-[10px] tracking-widest mb-0.5" style={{ color: "#5f9e6e" }}>✓ {q.prompt}</p><p className="text-xs ds-display">{(answerOptions.find((o) => o.id === state.board[q.id].answer) || { label: state.board[q.id].answer }).label}</p></div></div>);

  return (
    <div className="ds-paper mb-2"><div className="ds-paper-edge" /><div className="p-3">
      <p className="text-[11px] ds-display mb-1.5">{q.prompt}</p>
      <p className="text-[9px] tracking-widest opacity-50 mb-1">YOUR ANSWER</p>
      <div className="flex gap-1 flex-wrap mb-2">{answerOptions.map((o) => (<button key={o.id} onClick={() => setAnswer(o.id)} className="text-[10px] px-2 py-1" style={{ border: `1px solid ${answer === o.id ? accent : "#e8dfc833"}`, color: answer === o.id ? accent : "#e8dfc8aa", background: "none" }}>{o.label}</button>))}</div>
      <p className="text-[9px] tracking-widest opacity-50 mb-1">PROVE IT WITH</p>
      <div className="flex gap-1 flex-wrap mb-2">{state.caseFile.map((c) => (<button key={c.id} onClick={() => toggle(c.id)} className="text-[10px] px-2 py-1" style={{ border: `1px solid ${clues.includes(c.id) ? "#5d93bd" : "#e8dfc833"}`, color: clues.includes(c.id) ? "#9cc3e0" : "#e8dfc8aa", background: "none" }}>{c.title}</button>))}</div>
      <button onClick={() => onLock(q.id, answer, clues)} disabled={!answer || clues.length === 0} className="w-full py-2 text-[11px] tracking-widest ds-display disabled:opacity-30" style={{ border: `1px solid ${accent}88`, color: "#e6b8b8", background: "none" }}>LOCK IT IN</button>
    </div></div>
  );
}
