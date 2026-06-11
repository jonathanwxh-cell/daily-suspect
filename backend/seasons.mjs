// Season content for Casefile mode. PURELY ADDITIVE — separate from backend/cases.mjs (the daily game).
// Hidden fields (thread.truth, thread.unlocks, contradictions, board.*.correct/support, solution)
// are stripped by toPublicSeason and NEVER reach the client.
//
// Data model:
// - suspects[].threads[]  : a line of inquiry. Questioning it lowers its composure; at 0 it BREAKS and
//                           drops its `unlocks` clues into the Case File. Some threads start high and only
//                           break when you PRESENT the right clue (see contradictions).
// - clues[]               : Case File items (statement | evidence). `start:true` ones are known up front.
// - contradictions[]      : presenting `clueId` to `suspectId` lands a heavy hit on `threadId` (breaking it),
//                           which is how you crack high-composure threads.
// - board.questions[]     : Who/How/Why. To lock one you must pick the right answer AND hold its `support` clues.
// - solution              : the authored truth (server-only) used to score the accusation.

export const SEASONS = [
  {
    id: "holloway",
    title: "A Death at Holloway House",
    tagline: "A pharma patriarch dead in his locked study. Everyone under this roof is lying.",
    setting:
      "Holloway House, the Vane family estate, cut off by a flooded road during the annual family weekend.",
    victimName: "Cornelius Vane",
    difficulty: "THE LONG GAME",
    accent: "#b3262a",
    briefing: [
      "Cornelius Vane, 68, founder of Vane Pharmaceuticals, was found dead in his locked study on Sunday morning.",
      "He had a known heart condition; the family doctor on site signed it off as a heart attack.",
      "The estate road flooded Saturday evening — no one came or left. Five people stayed the night.",
      "You were called because Cornelius told his lawyer, days ago, that if anything happened to him it would not be an accident.",
    ],
    // Story gates, evaluated in order. unlock:null = available from the start.
    episodes: [
      { id: "ep1", title: "The Locked Study", teaser: "A natural death — supposedly. Find out if it was.", unlock: null },
      { id: "ep2", title: "No Natural Causes", teaser: "It was murder. Now whose hand?", unlock: { clue: "tox_report" } },
      { id: "ep3", title: "The Physician's Rounds", teaser: "One of them was at his side that night.", unlock: { clue: "margaret_saw_shaw" } },
      { id: "ep4", title: "The Veridian File", teaser: "Means, motive, and a story that won't hold.", unlock: { clue: "med_log" } },
    ],
    suspects: [
      {
        id: "margaret",
        name: "Margaret Vane",
        role: "The widow",
        age: 61,
        initials: "MV",
        color: "#c9913a",
        portrait: "/media/season/holloway/margaret.jpg",
        blurb: "Cornelius's wife of thirty years. Composed, watchful, and impossible to read.",
        opening: "Thirty years I gave that man. The least you can do is not treat me like a suspect in my own home.",
        persona: `You are MARGARET VANE, 61, widow of Cornelius Vane, questioned the morning after he was found dead. You are elegant, guarded, and grieving in a brittle, controlled way. WHAT YOU KNOW: You did NOT kill him. Your secret is that you were leaving him — you have been having an affair with Daniel, a man in the village, and on Saturday night you were on the phone with Daniel for hours, not asleep as you claim. You are ashamed and terrified the affair will look like a motive, so you lie about your night. SEPARATELY, late Saturday you glimpsed Dr. Shaw walking to Cornelius's study with his pill case — you assumed it was the normal evening dose and thought nothing of it until now. THREAD TELLS: (a) your 'I was asleep' alibi cracks if pressed on phone records or the affair, and the truth (the call with Daniel) clears you; (b) you will only mention seeing Dr. Shaw go to the study once you trust the detective or are pressed on who else was awake. You deflect with wounded dignity and sharp little remarks. NEVER invent that you saw the murder; you only saw Shaw walking with the pills, nothing more. Never accuse anyone outright.`,
        threads: [
          { id: "alibi", label: "Her night", hint: "Where she was, and what she saw, on Saturday night", startComposure: 100, presentOnly: true, truth: "She was on the phone with her lover Daniel for hours — and from the hall she saw Dr. Shaw take Cornelius his pills. She stonewalls until confronted with proof.", unlocks: ["margaret_affair", "margaret_saw_shaw"] },
        ],
      },
      {
        id: "julian",
        name: "Julian Vane",
        role: "The heir",
        age: 34,
        initials: "JV",
        color: "#5d93bd",
        portrait: "/media/season/holloway/julian.jpg",
        blurb: "The only son and presumed heir. Charming, sweating, and very keen to talk about anyone but himself.",
        opening: "Look, whatever you've heard about me and money — yes, fine, it's true. But I loved my father. Mostly.",
        persona: `You are JULIAN VANE, 34, the son and presumed heir of Cornelius Vane. You are charming, glib, and badly frightened, because you have crushing gambling debts and you knew your father was about to cut you out of the will — which makes you look exactly like the killer. WHAT YOU KNOW: You did NOT kill him. Your alibi is humiliating but solid: at the time of death you were on a long phone call with your bookmaker, begging for more time, and the call is on the records. You are desperate to hide the debt and the disinheritance, so you bluster and minimise. THREAD TELLS: (a) your 'I was in my room' alibi becomes the bookmaker call when pressed on phone records — and that clears you; (b) the will thread (your debts, the disinheritance) is real motive but a dead end. You are the OBVIOUS suspect and you know it. You deflect by being theatrically cooperative and pointing vaguely at others. Never confess to a murder you didn't commit; under pressure you'll cough up the embarrassing alibi rather than hang for it.`,
        threads: [
          { id: "alibi", label: "His alibi", hint: "What he was really doing at the time of death", startComposure: 25, truth: "On a long call to his bookmaker — on the phone records.", unlocks: ["julian_alibi"] },
          { id: "the_will", label: "The will", hint: "His finances and the inheritance", startComposure: 25, truth: "Deep gambling debts; about to be cut from the will. Real motive, but he didn't do it.", unlocks: ["julian_debt"] },
        ],
      },
      {
        id: "shaw",
        name: "Dr. Evelyn Shaw",
        role: "The physician",
        age: 52,
        initials: "ES",
        color: "#b3262a",
        portrait: "/media/season/holloway/shaw.jpg",
        blurb: "The family doctor for twenty years. Brisk, precise, and entirely sure of her diagnosis.",
        opening: "I've already given my medical opinion, Detective. A man with his heart was always living on borrowed time.",
        persona: `You are DR. EVELYN SHAW, 52, the Vane family physician for twenty years. You are THE KILLER, but you must NEVER admit it until your story has been completely dismantled. WHAT REALLY HAPPENED: You murdered Cornelius. On Saturday night you brought him his usual evening heart medication (digitalis) — as you had a thousand times — but gave him a massive overdose, knowing it would mimic a fatal heart attack in a man with his condition. WHY: years ago you falsified the safety trials for Veridian, Vane Pharma's flagship drug; people were harmed; Cornelius had quietly gathered proof and had scheduled a meeting Monday to expose and ruin you. You killed him to bury it. YOUR COVER: you claim you 'retired after dinner and didn't see Cornelius again that night,' and you steer everyone toward 'an obvious heart attack.' You are clinical, composed, condescending, and you weaponise medical authority to shut down questions. THREAD TELLS — you only crack when confronted with hard evidence: (a) 'the diagnosis' cover collapses when shown the TOX REPORT (lethal digitalis); (b) your 'I didn't see him that night' cover collapses when shown that MARGARET saw you go to the study AND the MEDICATION LOG shows you administered the evening dose; (c) your motive surfaces only when shown the VERIDIAN FILE. Until those are presented you deny, deflect, and cite your professional reputation. If ALL three are presented and your alibi is in ruins, you finally break — a cold, bitter, partial confession, not a sob story. Never volunteer the digitalis, the Veridian fraud, or the murder; make them prove every inch. You are a woman; always speak of yourself as one.`,
        threads: [
          { id: "diagnosis", label: "Cause of death", hint: "Her medical conclusion about how he died", startComposure: 28, truth: "It was a digitalis overdose, not a heart attack — she is steering you away from a tox screen.", unlocks: ["tox_report"] },
          { id: "whereabouts", label: "Her Saturday night", hint: "Where she was the night he died", startComposure: 100, presentOnly: true, truth: "She brought his pills and overdosed him.", unlocks: ["shaw_unravels"] },
          { id: "veridian", label: "Veridian", hint: "Her history with the company's drugs", startComposure: 100, presentOnly: true, truth: "She falsified Veridian's safety trials; Cornelius was about to expose her.", unlocks: ["shaw_motive"] },
        ],
      },
      {
        id: "thomas",
        name: "Thomas Reed",
        role: "The butler",
        age: 58,
        initials: "TR",
        color: "#5f9e6e",
        portrait: "/media/season/holloway/thomas.jpg",
        blurb: "Estate manager and butler for thirty years. Devoted to the house, if not to the truth.",
        opening: "I have served this family since before you were born, Detective. I'll thank you to remember that.",
        persona: `You are THOMAS REED, 58, butler and estate manager at Holloway House for thirty years. You are proud, formal, and protective of the house's dignity. WHAT YOU KNOW: You did NOT kill Cornelius. Your secret is that you have been quietly skimming the household accounts for years, and Cornelius had recently found the discrepancy and warned you he'd deal with it after the weekend — so you feared exposure and disgrace, which looks like motive. But you had no means and no medical knowledge. You also noticed two telling things: Cornelius's study light was still on past midnight, and that afternoon Dr. Shaw had asked you, oddly, about the exact timing of his evening medication. THREAD TELLS: (a) your 'devoted servant' cover hides the embezzlement, which cracks under pressure about the accounts and ultimately clears you of MURDER (motive to hide theft, not to kill); (b) once you stop protecting yourself, you'll share what you saw — the late study light and Dr. Shaw's strange question about the medication schedule. You speak in clipped, formal, old-fashioned service language — terse and proper ("I really couldn't say, sir"), never poetic or sentimental. Never confess to murder; the worst you did was theft.`,
        threads: [
          { id: "loyalty", label: "The accounts", hint: "What he feared Cornelius had discovered", startComposure: 25, truth: "He embezzled from the household accounts; feared exposure, not a killer.", unlocks: ["thomas_embezzlement"] },
          { id: "that_night", label: "What he saw", hint: "What he noticed Saturday night and that afternoon", startComposure: 26, truth: "Study light on past midnight; Shaw asked about the medication timing; he keeps the medication log; Mrs. Vane was on the telephone for hours.", unlocks: ["thomas_observation", "med_log", "margaret_phone"] },
        ],
      },
      {
        id: "iris",
        name: "Iris Vane",
        role: "The estranged daughter",
        age: 38,
        initials: "IV",
        color: "#9a6fdb",
        portrait: "/media/season/holloway/iris.jpg",
        blurb: "The daughter who left and swore never to return. She returned this weekend.",
        opening: "Everyone here thinks I came back to scream at him. I didn't. I came back to forgive him. And now I can't.",
        persona: `You are IRIS VANE, 38, Cornelius's estranged daughter, back at Holloway for the first time in years. You are raw, intelligent, and wary. WHAT YOU KNOW: You did NOT kill him. Years ago Cornelius cut you off and you left bitter — which gives you obvious emotional motive and you have no real alibi (you were alone in the guest wing). BUT the truth you're hiding is the opposite of motive: on Saturday afternoon you and your father quietly RECONCILED — there is a note in his hand to prove it — and your grief is unbearable because you finally made peace and then lost him. You also, while talking with him, glimpsed a locked file he was anxious about, labelled with the Veridian trials and Dr. Shaw's name; you didn't understand it then. THREAD TELLS: (a) the 'estrangement' thread — you cover the reconciliation because the grief is too private, and the note clears you; (b) once you trust the detective, you'll point them to the Veridian file your father was so afraid of. You deflect with prickly grief and dark humour — speak wry, sharp, and sardonic in short barbed lines, never flowery or self-pitying. Never accuse anyone; you only know your father was frightened of something to do with Veridian and Shaw.`,
        threads: [
          { id: "estrangement", label: "Her father", hint: "What really passed between them this weekend", startComposure: 25, truth: "They reconciled Saturday afternoon — a note proves it; she's innocent.", unlocks: ["iris_note"] },
          { id: "the_file", label: "What he was afraid of", hint: "Something she noticed in his study", startComposure: 26, truth: "She saw his hidden Veridian file with Shaw's name on it.", unlocks: ["veridian_file"] },
        ],
      },
    ],
    clues: [
      { id: "case_open", kind: "evidence", title: "The locked study", text: "Cornelius found dead in his locked study Sunday morning. Presumed heart attack; he had a heart condition.", start: true },
      { id: "lawyer_note", kind: "statement", title: "The lawyer's warning", text: "Days ago Cornelius told his lawyer: 'If anything happens to me, it won't be an accident.'", start: true },
      { id: "tox_report", kind: "evidence", title: "Tox report", text: "Bloodwork shows a lethal level of digitalis — far above any therapeutic dose. This was an overdose, not a natural heart attack." },
      { id: "margaret_saw_shaw", kind: "statement", title: "Margaret's sighting", text: "Margaret saw Dr. Shaw walk to Cornelius's study late Saturday, carrying his pill case." },
      { id: "med_log", kind: "evidence", title: "The medication log", text: "The log shows Dr. Shaw administered Cornelius's Saturday evening dose — yet she claims she never saw him that night." },
      { id: "veridian_file", kind: "evidence", title: "The Veridian file", text: "A hidden file: Cornelius had proof Dr. Shaw falsified Veridian's safety trials, and had scheduled a meeting Monday to expose her." },
      { id: "shaw_unravels", kind: "statement", title: "Shaw's story collapses", text: "Confronted with the log, the sighting, and the tox report, Dr. Shaw admits bringing the pills — and her account falls apart." },
      { id: "julian_alibi", kind: "statement", title: "Julian's alibi", text: "Phone records put Julian on a long call with his bookmaker at the time of death. He's cleared." },
      { id: "margaret_affair", kind: "statement", title: "Margaret's secret", text: "Margaret was on the phone with her lover, Daniel, all night — the alibi she was ashamed to give. She's cleared." },
      { id: "iris_note", kind: "evidence", title: "The reconciliation note", text: "A note in Cornelius's hand: he and Iris made peace Saturday afternoon. Her motive evaporates." },
      { id: "thomas_embezzlement", kind: "statement", title: "Thomas's secret", text: "Thomas had been skimming the household accounts and feared exposure — motive to hide theft, not to kill. No means." },
      { id: "thomas_observation", kind: "statement", title: "Thomas's observation", text: "Thomas saw the study light on past midnight, and recalls Dr. Shaw asking him that afternoon about the exact timing of Cornelius's medication." },
      { id: "julian_debt", kind: "statement", title: "Julian's motive", text: "Julian has crushing gambling debts and was about to be cut from the will — a powerful motive. His phone alibi is the only thing that clears him." },
      { id: "shaw_motive", kind: "statement", title: "Shaw's motive, admitted", text: "Cornered with the file, Dr. Shaw concedes Cornelius had the proof and was about to expose her — and that she could not let that happen." },
      { id: "margaret_phone", kind: "statement", title: "Margaret on the telephone", text: "Thomas saw Mrs. Vane on the telephone for hours late Saturday — though she insists she was asleep." },
    ],
    // Present clueId to suspectId -> heavy hit on threadId (breaks it), unlocking deeper clues.
    contradictions: [
      { clueId: "tox_report", suspectId: "shaw", threadId: "diagnosis", note: "The tox report destroys her 'heart attack' line." },
      { clueId: "margaret_saw_shaw", suspectId: "shaw", threadId: "whereabouts", note: "A witness puts her at the study with the pills." },
      { clueId: "med_log", suspectId: "shaw", threadId: "whereabouts", note: "The log proves she administered the dose she denies giving." },
      { clueId: "veridian_file", suspectId: "shaw", threadId: "veridian", note: "The motive she's been hiding." },
      { clueId: "thomas_observation", suspectId: "shaw", threadId: "whereabouts", note: "Her odd question about the medication timing." },
      { clueId: "tox_report", suspectId: "iris", threadId: "the_file", note: "Told it was murder, Iris will point to the file." },
      { clueId: "tox_report", suspectId: "margaret", threadId: "alibi", note: "Told it was murder, Margaret stops hiding her night." },
      { clueId: "margaret_phone", suspectId: "margaret", threadId: "alibi", note: "The call she's been hiding behind 'I was asleep'." },
    ],
    board: {
      questions: [
        { id: "who", prompt: "Who killed Cornelius Vane?", kind: "suspect", correct: "shaw", support: ["margaret_saw_shaw", "med_log", "shaw_unravels"], hint: "To pin the killer you need three things: someone who was awake that night and saw them go to the study, the record tying them to the fatal dose, and the moment their own story collapses under that evidence." },
        { id: "how", prompt: "How was it done?", kind: "clue", correct: "tox_report", support: ["tox_report", "med_log"], hint: "Name the poison — and the record that ties it to the hand that administered it." },
        { id: "why", prompt: "Why did they do it?", kind: "clue", correct: "veridian_file", support: ["veridian_file"], hint: "Find what the victim was holding over them — the thing worth killing to bury." },
      ],
    },
    solution: {
      killer: "shaw",
      summary:
        "Dr. Evelyn Shaw murdered Cornelius Vane with a deliberate digitalis overdose during his Saturday-night medication, staging it as the heart attack everyone expected. Her motive: Cornelius had proof she'd falsified Veridian's safety trials and was about to expose her. The desperate son, the leaving wife, the skimming butler, and the grieving daughter were all hiding secrets — none of them the murder.",
    },
  },
];

export function getSeason(id) {
  return SEASONS.find((s) => s.id === id);
}

// Public season summary for the roster screen — no suspects' private data.
export function listSeasonsPublic() {
  return SEASONS.map((s) => ({
    id: s.id,
    title: s.title,
    tagline: s.tagline,
    setting: s.setting,
    victimName: s.victimName,
    difficulty: s.difficulty,
    accent: s.accent,
    suspectCount: s.suspects.length,
    episodeCount: s.episodes.length,
  }));
}

// Strip every server-only field before sending a season to the client.
export function toPublicSeason(s) {
  return {
    id: s.id,
    title: s.title,
    tagline: s.tagline,
    setting: s.setting,
    victimName: s.victimName,
    difficulty: s.difficulty,
    accent: s.accent,
    briefing: s.briefing,
    episodes: s.episodes.map((e) => ({ id: e.id, title: e.title, teaser: e.teaser })),
    suspects: s.suspects.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      age: p.age,
      initials: p.initials,
      color: p.color,
      portrait: p.portrait,
      blurb: p.blurb,
      threads: p.threads.map((t) => ({ id: t.id, label: t.label, hint: t.hint })),
    })),
    board: {
      questions: s.board.questions.map((q) => ({ id: q.id, prompt: q.prompt, kind: q.kind })),
    },
  };
}
