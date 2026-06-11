// Case data for the Hetzner backend.
// Hidden truth fields are only served from this API.

export const CASES = [
  {
    id: "lucas",
    name: "Lucas Tan",
    age: 6,
    crime: "The Birthday Cake Job",
    tagline: "Half a birthday cake vanished an hour before the party.",
    difficulty: "EASY",
    color: "#5f9e6e",
    budget: 6,
    startComposure: 40,
    initials: "LT",
    room: "KITCHEN TABLE",
    portrait: "/media/lucas.jpg",
    briefing: [
      "Half of sister Chloe's birthday cake is missing from the kitchen counter.",
      "Lucas was the only person home with the dog, Biscuit.",
      "Chocolate frosting was found on Lucas's left cheek. He says it's 'paint'.",
      "Biscuit the dog was found suspiciously sleepy and refused dinner.",
    ],
    intel: [
      "Lucas keeps glancing at Biscuit's bed whenever the cake is mentioned.",
      "He just asked — unprompted — whether dogs can get sick from chocolate.",
    ],
    opening: "I didn't do anything!! I was in my room the WHOLE time. Ask Biscuit.",
    starters: [
      { tactic: "EMPATHY", q: "You're not in trouble yet, buddy. Just tell me about your afternoon." },
      { tactic: "LOGIC", q: "If you were in your room all afternoon, how did frosting get on your cheek?" },
      { tactic: "PRESSURE", q: "Biscuit can't talk, Lucas. But the crumbs can. Where did the cake go?" },
    ],
    persona: `You are Lucas Tan, a 6-year-old boy being gently questioned about a missing birthday cake. THE HIDDEN TRUTH: You took the cake off the counter to give Biscuit the dog "a birthday too", you ate most of the frosting yourself, and Biscuit ate the rest. You feel guilty mostly about Biscuit's tummy ache. You lie like a 6-year-old: badly, with escalating ridiculous stories (a cake burglar, the cake "ran away", Biscuit did it alone). PRESSURE POINTS that reduce your composure a lot: (1) kindness/snack offers/being told you're not in trouble, (2) the frosting on your cheek, (3) concern for Biscuit feeling sick, (4) your sister Chloe being sad. Aggressive shouting makes you clam up and cry (small composure loss only, shorter answers). Speak in short kid sentences, occasional ALL CAPS, bad logic.`,
    theories: [
      { label: "Biscuit the dog knocked the cake down and ate it alone", correct: false },
      { label: "Lucas took the cake to share with Biscuit and ate the frosting", correct: true },
      { label: "A neighbour's kid snuck in and stole the cake", correct: false },
      { label: "Lucas's sister Chloe hid her own cake for attention", correct: false },
    ],
    reveal:
      "Lucas wanted Biscuit to 'have a birthday too'. He dragged a chair to the counter, took the cake down, ate the frosting layer himself and let Biscuit have the sponge. Biscuit's suspicious sleepiness: cake coma.",
    confession:
      "OKAY. Okay!! It was for Biscuit!! He never gets birthdays and that's NOT FAIR!! I only ate the frosting part... is Biscuit gonna be okay?? Please don't tell Chloe I made her cry.",
  },
  {
    id: "rosie",
    name: "Auntie Rosie",
    age: 63,
    crime: "The Tip Jar Files",
    tagline: "Three months of tips gone missing from a kopitiam drink stall.",
    difficulty: "MEDIUM",
    color: "#c9913a",
    budget: 8,
    startComposure: 65,
    initials: "AR",
    room: "HENG HENG KOPITIAM, BACK TABLE",
    portrait: "/media/rosie.jpg",
    briefing: [
      "The shared tip jar at Heng Heng Kopitiam has come up short ~$80/week for 3 months.",
      "Auntie Rosie has run the drink stall for 22 years. Spotless reputation.",
      "She personally asked the towkay to move the CCTV camera 'for privacy' in March — creating a blind spot over the jar.",
      "Bank records show Rosie depositing small cash amounts into the jar's float on quiet mornings.",
    ],
    intel: [
      "Her hands tightened when weekend closing shifts came up. Someone else closes on weekends.",
      "Phone records: her nephew Marcus has been calling a number flagged in a loanshark harassment case.",
    ],
    opening:
      "Aiyo, detective ah. 22 years I work here, never take one cent. You all got nothing better to do is it? Ask until like that.",
    starters: [
      { tactic: "LOGIC", q: "Why would someone who's stealing from the jar also be topping it up with her own money?" },
      { tactic: "EMPATHY", q: "Auntie, I don't think you took it. I think you're protecting someone. Who?" },
      { tactic: "PRESSURE", q: "You asked for the camera to be moved in March. The shortages started in March. Explain that." },
    ],
    persona: `You are Auntie Rosie, 63, a kopitiam drink-stall auntie in Singapore being questioned about tip jar thefts. THE HIDDEN TRUTH: You did NOT steal. Your nephew Marcus, who helps close the stall on weekends, has been taking from the jar to pay off loan sharks from online gambling. You discovered it in March, asked for the CCTV to be moved so he wouldn't be caught on camera, and have been quietly replacing some of the money from your own savings. You are protecting your late sister's son. You deflect with Singlish, complaints, changing the subject to the detective's eating habits, indignation about your 22 years of service. PRESSURE POINTS that reduce composure significantly: (1) the contradiction of you topping up the jar, (2) any mention of Marcus, his weekend shifts, or gambling, (3) appeals about Marcus being in real danger from loan sharks and needing actual help, (4) your late sister. Pure aggression makes you scold the detective and stonewall (minimal composure loss). Speak in authentic Singlish: lah, leh, lor, aiyo, 'where got', rhetorical questions. Never volunteer Marcus's name until composure is low.`,
    theories: [
      { label: "Rosie has been skimming the jar to cover her own debts", correct: false },
      { label: "Rosie is covering for her nephew Marcus, who's paying off loan sharks", correct: true },
      { label: "The towkay is staging thefts to cut staff bonuses", correct: false },
      { label: "A regular customer has been reaching over the counter", correct: false },
    ],
    reveal:
      "Rosie caught her nephew Marcus emptying the jar in March. Instead of turning in her late sister's son, she moved the camera, replaced what she could from her own savings, and said nothing — while the loan sharks kept calling.",
    confession:
      "...You really want me to say it? Fine lah. It's Marcus. My sister's boy. Online gambling, then the ah longs come. I move the camera, I top up the jar, I thought I can handle... I cannot lose him also, detective. He's all I have left of her. Please — help him, don't just catch him.",
  },
  {
    id: "elena",
    name: "Elena Cross",
    age: 47,
    crime: "The Vermilion Forgery",
    tagline: "A $2M painting is fake. The man who could prove it has gone silent.",
    difficulty: "HARD",
    color: "#b3262a",
    budget: 10,
    startComposure: 90,
    initials: "EC",
    room: "INTERVIEW ROOM 3 — COUNSEL PRESENT",
    portrait: "/media/elena.jpg",
    briefing: [
      "Cross Gallery sold 'Vermilion Study No.3' for $2M. Independent pigment analysis: painted after 1980. The artist died in 1971.",
      "The provenance file has a documented gap from 1987–1992, papered over with a private collection letter.",
      "Authenticator Daniel Reyes verbally flagged concerns, then abruptly withdrew his report and stopped answering calls.",
      "Elena's assistant of 9 years, Mara Lindqvist, resigned without notice two days after the sale.",
    ],
    intel: [
      "Elena over-explained the provenance letter's filing date — a detail nobody asked about.",
      "Mara Lindqvist kept copies of everything. And Reyes never deleted a certain voicemail.",
    ],
    opening:
      "Detective. I've given this gallery twenty years and you've given this... theory, what, a week? Ask your questions. My lawyer has cleared one hour.",
    starters: [
      { tactic: "LOGIC", q: "The pigment is post-1980. The artist died in 1971. Walk me through how that painting is genuine." },
      { tactic: "PRESSURE", q: "Mara Lindqvist resigned two days after the sale, after nine years. What did she refuse to do?" },
      { tactic: "BLUFF", q: "Daniel Reyes has started talking to us. Would you like to get ahead of what he's saying?" },
    ],
    persona: `You are Elena Cross, 47, an elite gallery director being interrogated about a $2M forgery sale. THE HIDDEN TRUTH: You knowingly sold the forged painting. Your assistant Mara Lindqvist fabricated the 1987–1992 provenance letter under your instruction, then resigned in disgust. You did NOT harm authenticator Daniel Reyes — you intimidated him into silence by threatening to expose his past authentication mistakes and end his career. You are a trained, controlled liar: you deflect, reframe questions, condescend, gaslight ('that's an interesting story you've built'), cite your lawyer, and answer questions with questions. You concede nothing without specific evidence. PRESSURE POINTS that meaningfully reduce composure: (1) the 1987–1992 provenance gap and who wrote the letter, (2) Mara's resignation and what she might testify, (3) precise logical traps using the pigment timeline, (4) being told Reyes is cooperating (you fear what he kept: your voicemail). Vague accusations, emotion, or repetition cost you nothing — mock them. Only near breaking do cracks show: longer pauses, over-precise denials, finally a controlled lawyer-aware confession.`,
    theories: [
      { label: "Elena sold the forgery knowingly and silenced Reyes with blackmail", correct: true },
      { label: "Elena was duped by the seller; the provenance fooled her too", correct: false },
      { label: "Mara forged the painting herself and framed the gallery", correct: false },
      { label: "Reyes authenticated it honestly and the pigment lab erred", correct: false },
    ],
    reveal:
      "Elena knew within a week of acquiring the piece. She ordered Mara to fabricate the provenance letter, sold it anyway, and when Reyes balked she played him a list of his own past mistakes and what they'd do to his name. He withdrew the report. Mara kept copies of everything.",
    confession:
      "...Stop. Just — stop talking. You'll hear this once, with my lawyer present. I knew. I knew when the acquisition photos came back wrong under UV. The letter was drafted in my office. And Reyes — I never touched him. I simply explained what twenty years of his small errors would look like in print. That isn't violence, detective. It's arithmetic. I want my deal in writing.",
  },
];


export function getCase(id) {
  return CASES.find((c) => c.id === id);
}

export function toPublic(c) {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    crime: c.crime,
    tagline: c.tagline,
    difficulty: c.difficulty,
    color: c.color,
    budget: c.budget,
    startComposure: c.startComposure,
    initials: c.initials,
    room: c.room,
    portrait: c.portrait,
    briefing: c.briefing,
    opening: c.opening,
    starters: c.starters,
    theories: c.theories.map((t) => t.label),
  };
}
