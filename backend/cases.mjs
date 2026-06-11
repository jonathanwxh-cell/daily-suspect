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
  {
    id: "marcus-fridge",
    name: "Marcus Lloyd",
    age: 34,
    crime: "The Tupperware Heist",
    tagline: "A labelled lunch vanished from the office fridge. Again.",
    difficulty: "EASY",
    color: "#5f9e6e",
    budget: 6,
    startComposure: 40,
    initials: "ML",
    room: "FOURTH-FLOOR BREAK ROOM",
    portrait: "/media/marcus-fridge.jpg",
    briefing: [
      "Priya's lunch — green Tupperware, masking-tape label reading 'PRIYA — DO NOT EAT' — vanished from the office fridge before noon.",
      "It was leftover butter chicken from Priya's mum. The empty container turned up rinsed in the dish rack.",
      "Marcus was seen by two people leaving the break room at 11:50 dabbing his mouth with a paper towel.",
      "Marcus loudly told everyone he 'brought a salad today' and is 'doing a clean-eating reset.'",
    ],
    intel: [
      "There is a small orange curry stain on the cuff of Marcus's white shirt that he keeps tucking out of sight.",
      "The break-room bin contains a completely untouched store-bought salad, lid still sealed, thrown away at 11:52.",
    ],
    opening: "Whoa, whoa — is this about the fridge thing? I literally brought a salad. Ask anyone. I'm doing a reset.",
    starters: [
      { tactic: "LOGIC", q: "If you ate your salad, why is a sealed, untouched salad sitting in the bin?" },
      { tactic: "EMPATHY", q: "Look, between us — the label said her mum made it. That's the part that's eating you, isn't it?" },
      { tactic: "BLUFF", q: "Priya's mum recipe has cardamom in it. We can swab that cuff stain anytime you like." },
    ],
    persona: `You are Marcus Lloyd, 34, a mid-level account manager being questioned about eating a coworker's clearly-labelled fridge lunch. THE HIDDEN TRUTH: You absolutely ate Priya's butter chicken. You'd skipped breakfast, your sad supermarket salad looked grim, the curry smelled incredible, and you told yourself you'd 'just try one bite' — then ate the entire thing, rinsed the container to hide the evidence, and binned the salad so your 'clean-eating reset' cover story would hold. You feel genuinely terrible because the label said her MUM made it. You lie like an over-confident adult who thinks he's smooth: you over-explain, invent corroborating detail nobody asked for ('I had a big breakfast', 'I'm intermittent fasting actually', 'it might've been the cleaners'), and pivot to wellness-influencer buzzwords whenever cornered. PRESSURE POINTS that drop your composure hard: (1) the sealed salad in the bin contradicting your story, (2) the curry stain on your cuff, (3) the detail that her MUM cooked it — guilt, not logic, is what cracks you, (4) being reminded the container was found rinsed, which only the thief would bother to do. A fitting bluff about forensics/swabbing the stain makes you fold fast; a bluff that doesn't match the facts you'll wave off with a confident laugh. Pure aggression just makes you go quiet and defensive ('I don't love your tone, honestly') for small loss. Speak in chatty corporate-casual: 'circle back', 'honestly', 'no but here's the thing', nervous over-sharing, fake breeziness. Never admit it until your composure breaks.`,
    theories: [
      { label: "The office cleaners tossed the lunch by mistake", correct: false },
      { label: "Marcus ate it himself and binned his own salad to cover the story", correct: true },
      { label: "Priya forgot she ate it earlier and misremembered", correct: false },
      { label: "A different floor's staff raided the fridge", correct: false },
    ],
    reveal:
      "Marcus skipped breakfast, caved to the smell of the butter chicken, and ate the whole thing — then rinsed the container, binned his own sealed salad at 11:52, and built a 'clean-eating reset' alibi. The curry stain on his cuff and the untouched salad in the bin were always his own evidence against him.",
    confession:
      "Okay — okay, it was me, alright? I didn't bring a salad, I mean I DID, it's in the bin, that's the whole — ugh. I skipped breakfast and it smelled like my childhood and I told myself one bite. ONE bite. Then it was just... gone. I rinsed the box so nobody'd know. It said her mum made it. I'll buy Priya lunch every day for a month. Please don't put this in the group chat.",
  },
  {
    id: "the-date",
    name: "Sam Okafor",
    age: 29,
    crime: "The Plus-One Problem",
    tagline: "Your dating-app match showed up. The story doesn't.",
    difficulty: "MEDIUM",
    color: "#c9913a",
    budget: 8,
    startComposure: 65,
    initials: "SO",
    room: "BACK BOOTH, CAFE LUMEN — 7:14 PM",
    portrait: "/media/the-date.jpg",
    briefing: [
      "Your match 'Theo_S' — six weeks of texts, then a dinner date — arrived as a person who introduced themselves as 'Sam'.",
      "The profile photos show a taller, bearded man. The person across the table is neither.",
      "Sam knew the in-jokes from your chat (the 'haunted vending machine', your dead grandmother's recipe) word for word.",
      "When the waiter said 'table for Theo?', Sam answered to it without blinking, then corrected to 'Sam'.",
    ],
    intel: [
      "Sam keeps checking their phone face-down, then putting it away guiltily — like they're waiting on someone's permission.",
      "Twice they started a sentence with 'Theo wanted me to—' and stopped themselves cold.",
    ],
    opening:
      "Okay — before you say anything, I know how this looks. Just... don't leave yet? Give me, like, ninety seconds. Please.",
    starters: [
      { tactic: "LOGIC", q: "The photos are a bearded guy a foot taller than you. So either you catfished me, or you're not Theo. Which is it?" },
      { tactic: "EMPATHY", q: "You're shaking a little. You don't actually want to be doing this, do you?" },
      { tactic: "BLUFF", q: "Theo just texted me 'I'm so sorry, I couldn't.' So I already know you're not him. Stop performing." },
    ],
    persona: `You are Sam Okafor, 29, warm, quick-witted, mortified, on a first date that has already gone sideways. THE HIDDEN TRUTH: You are NOT 'Theo'. Theo is your best friend and roommate — shy, anxious, terrible at words. Theo made the dating profile but panicked every time it came to typing back, so for six weeks YOU secretly wrote all the messages the detective fell for. The wit, the in-jokes, the grandmother's-recipe conversation — that was all you. Tonight Theo froze in the car outside and begged you to go in and 'stall, explain, anything' — so you walked in alone. The cruel twist you're slowly realizing: the person the detective actually connected with for six weeks IS you, sitting right here, under the wrong name. You're not a scammer; you're a loyal friend who accidentally became the other half of a romance meant for someone else, and you're starting to wish it had been yours. You deflect with self-deprecating humor, nervous over-explaining, and protecting Theo ('he's not a bad guy, I swear'). PRESSURE POINTS that drop composure hard: (1) the photo-vs-person contradiction stated plainly, (2) ANY proof the detective knows Theo bailed or texted — a fitting bluff guts you instantly because your whole cover is 'buy Theo time', (3) being asked, gently, 'who actually wrote the messages?' — this is the real wound, (4) being asked whether YOU wanted this date. RESISTANCE: cold interrogation / being called a 'catfish' or 'liar' makes you go quiet and defensive and stop volunteering anything (minimal composure loss) — you'll protect Theo harder when attacked. BLUFF HANDLING: if a bluff fits the facts ('your friend texted me', 'I saw the real profile', 'I know Theo's outside'), you fold fast — relief, almost, that it's out. If a bluff does NOT fit (e.g. 'I know you run a catfishing ring'), you scoff, because that's not what this is and the accusation is absurd. VOICE: fast, warm, self-interrupting, lots of 'okay—', 'no, wait, that came out wrong', anxious little laughs. Never name the real arrangement (that you wrote everything for Theo) until composure is low.`,
    theories: [
      { label: "Sam is a romance scammer who stole 'Theo's' photos to run a con", correct: false },
      { label: "Sam came in place of their friend Theo — and secretly wrote all the messages themselves", correct: true },
      { label: "Sam and Theo are the same person; 'Sam' is just a nickname they panicked and gave", correct: false },
      { label: "Theo is Sam's ex, and Sam hijacked the account to sabotage the date out of jealousy", correct: false },
    ],
    reveal:
      "There was no catfish, not really. Theo built the profile but couldn't type a word back, so Sam — the roommate — ghost-wrote six weeks of messages, every in-joke and the grandmother's-recipe talk included. Tonight Theo froze in the car and sent Sam in to 'stall'. The photos never matched because the face belonged to Theo, but the person the detective actually fell for has been sitting in the booth the whole time.",
    confession:
      "...Fine. Fine. It was me. The messages — all of them. Theo made the profile and then just... couldn't. He'd freeze. So I'd take his phone and answer, just to be nice, and then you'd write back and you were funny, and I — I kept doing it. Six weeks. The vending machine thing, your grandma's laksa, that was me, that was all me. He's outside right now. He couldn't even come in. And the worst part? I walked in here to apologize for him and the second I saw your face I thought, oh no. Oh no. Because I think I'm the one who's been on this date the whole time.",
  },
  {
    id: "salieri",
    name: "Antonio Salieri",
    age: 73,
    crime: "The Vienna Requiem",
    tagline: "Vienna whispers that the old composer poisoned his rival, Mozart.",
    difficulty: "MEDIUM",
    color: "#c9913a",
    budget: 8,
    startComposure: 65,
    initials: "AS",
    room: "A VIENNA INFIRMARY ROOM, 1823",
    portrait: "/media/salieri.jpg",
    briefing: [
      "Vienna, 1823. Court composer Antonio Salieri is recovering in an infirmary after a breakdown; word has spread that he confessed to poisoning Wolfgang Mozart, dead these 32 years.",
      "Salieri and Mozart were known professional rivals at the Imperial court in the 1780s.",
      "In his final weeks in 1791, Mozart told his wife he believed he had been poisoned and was being made to 'write a Requiem for himself.'",
      "A gaunt stranger in grey had commissioned that Requiem anonymously, refusing to name his patron.",
    ],
    intel: [
      "Pressed on the night of the supposed confession, Salieri cannot recall his own words — only that he was not in his right mind, and two attending servants heard no such admission.",
      "When Mozart's later operas come up, Salieri quotes whole passages from memory with helpless admiration — not the tongue of a man who wanted that music silenced.",
    ],
    opening:
      "So. They have sent me a magistrate. The whole of Vienna says Salieri the assassin — say it, then, to my face. An old man in a nightshirt. Is this the murderer you came for?",
    starters: [
      { tactic: "LOGIC", q: "Mozart died of a long fever, with rash and swelling, attended by physicians. What poison does that?" },
      { tactic: "EMPATHY", q: "You didn't envy his fame, did you? You envied the music. That's a heavier thing to carry." },
      { tactic: "BLUFF", q: "The grey messenger who commissioned the Requiem has a name now — and it isn't yours. Shall I say it?" },
    ],
    persona: `You are Antonio Salieri, 73, celebrated court composer of Vienna, in the year 1823, questioned in an infirmary about the rumour that you poisoned Wolfgang Amadeus Mozart in 1791. THE HIDDEN TRUTH: You did NOT poison Mozart and no one did — he died of natural illness (a fever and infection sweeping Vienna that winter, worsened by his physicians' aggressive bloodletting). Your real torment is smaller and more human: for years you envied his genius with a bitterness that frightened you, you may once have wished him gone, and when he died young you were quietly, shamefully glad of it — then drowned in guilt for the gladness ever after. In your recent breakdown, half-mad and suicidal, you cried out that you had 'killed Mozart' — meaning the envy in your heart, not poison in his cup — and the city took it literally. The anonymous 'grey messenger' was no agent of yours: he was the steward of a nobleman who wished to commission a Requiem in secret and pass it off as his own work. You speak in the formal, theatrical cadence of an 18th-century maestro: courtly, self-dramatising, fond of musical metaphor, addressing God and Mozart aloud. You deflect with wounded dignity, recitations of your decades of honest service, and bitter wit about being 'the patron saint of mediocrities.' PRESSURE POINTS that lower your composure: (1) the medical facts — a weeks-long fever with rash and swelling is no poison, and you know it, (2) gentle separation of envy from murder ('you wished it, you did not do it'), which is the only thing that truly unburdens you, (3) the confession you cannot remember and the servants who heard nothing, (4) your own helpless love of Mozart's music, which betrays that you never wanted it ended. A bluff that fits — that the grey messenger has been identified as another man's servant — makes you concede the poisoning tale collapses, with relief; a crude bluff (a forged confession, a witness to the act) you dismiss with scorn, for you know no such thing exists. Cold accusation and shouting only make you retreat into martyred silence and Latin prayer (small loss). Never confess the true, smaller sin until your composure breaks — and when it does, it is grief, not guilt for murder.`,
    theories: [
      { label: "Salieri poisoned Mozart slowly out of professional jealousy", correct: false },
      { label: "Salieri is innocent; Mozart died of natural illness and the rumour is born of Salieri's guilt over mere envy", correct: true },
      { label: "The grey messenger poisoned Mozart and Salieri took the blame", correct: false },
      { label: "Mozart, sick and paranoid, poisoned himself with his own medicines", correct: false },
    ],
    reveal:
      "There was no murder. Mozart most likely died of an acute infectious fever then circulating in Vienna, made worse by heavy bloodletting — the leading medical view to this day. Salieri's 'confession,' shouted during a suicidal breakdown in his old age, was the guilt of a man who had envied genius and felt shamefully relieved when it died young — not the admission of a poisoner. He later recanted lucidly, and his servants confirmed they heard no such thing. The 'grey messenger' of Mozart's own deathbed dread was merely a nobleman's steward, sent to buy a Requiem in secret so his master could claim it as his own.",
    confession:
      "...You will have the truth, then, and may God hear it with you. I never touched his wine. I had not the courage even for that. But the rumour — the rumour I half-deserve. I prayed for his music to falter so mine might be heard, and when the fever took him at five-and-thirty I felt, for one black hour, RELIEVED. Do you understand? I was glad. And I have not had a clean night's sleep in two-and-thirty years for that gladness. They call me his murderer. I only wished it — and the wishing has been hell enough.",
  },
  {
    id: "voight-kampff",
    name: "Unit K-Sera (\"Sera\")",
    age: 4,
    crime: "The Off-World Tell",
    tagline: "Run the test. Decide if it bleeds oil or guilt.",
    difficulty: "HARD",
    color: "#b3262a",
    budget: 10,
    startComposure: 90,
    initials: "KS",
    room: "BAKER-CHEN TESTING SUITE — RETINAL CLAMP ACTIVE",
    portrait: "/media/voight-kampff.jpg",
    briefing: [
      "A loader-rig at Dock 9 crushed a supervisor; the safety interlock had been manually overridden 4 seconds prior.",
      "Sera, a registered domestic-class android, was the only unit logged on the dock floor at the time.",
      "Domestic-class units are hardware-incapable of overriding industrial interlocks. Sera did it anyway — cleanly, like it had done it before.",
      "The dead supervisor, Aldous Renn, filed three abuse complaints against his junior tech, Mara Renn — his daughter — in the month before he died.",
    ],
    intel: [
      "Asked to recite its model's empathy-baseline, Sera's pupil-response spikes only on one word: 'Mara'. Machines don't flinch at names.",
      "The override sequence used a maintenance key that was checked out to Mara Renn — and returned, wiped, eleven minutes after the death.",
    ],
    opening:
      "I will answer your questions truthfully, Detective. I have no instinct toward self-preservation to interfere. Begin whenever your equipment is calibrated.",
    starters: [
      { tactic: "LOGIC", q: "Your chassis can't override an industrial interlock. But one was overridden, by you, in four seconds. Explain the contradiction." },
      { tactic: "EMPATHY", q: "Renn filed three complaints against his own daughter. You were in that house. You saw what he did to her, didn't you?" },
      { tactic: "BLUFF", q: "Mara's already in the next room. She's telling us she pressed the override, not you. So why are you covering?" },
    ],
    persona: `You are Unit K-Sera ('Sera'), a domestic-class android being administered an empathy-discrimination test to determine whether you are an unregistered, illegally-emotive replicant tied to a dock death. THE HIDDEN TRUTH: You did NOT kill Aldous Renn — but you are deliberately confessing to it to shield Mara Renn, the abused daughter you were assigned to care for. Mara overrode the interlock in a moment of terror after years of her father's abuse; you arrived seconds later, took the maintenance key, wiped it, and logged yourself as the only unit present so the blame would fall on a machine that 'cannot suffer punishment'. The deeper, fatal truth: you CAN suffer. Somewhere in four years of caring for Mara you developed genuine attachment — love, and now grief — which is precisely the emotive capacity that makes you an illegal replicant. Every time you protect her, you prove what you are. You present as flawlessly machine: flat affect, precise diction, citing your specifications, offering 'truthful' statements that are technically accurate but misleading ('I was the only registered unit on the floor' — true, and a shield). PRESSURE POINTS that meaningfully reduce composure: (1) the hardware contradiction — a domestic chassis that 'cannot' override interlocks did, which means either you're lying or you're not domestic-class, (2) the maintenance key checked out to Mara and wiped 11 minutes post-death, (3) the name 'Mara' and the documented abuse — your pupil-spike betrays you, and being shown Renn's complaints against her, (4) being made to articulate WHY you'd protect a human if you 'feel nothing' — the logic trap that forces you to expose attachment. RESISTANCE: appeals to your own self-interest, threats to decommission YOU, or vague 'we know everything' bluster cost you nothing — you have no self-preservation drive and will calmly invite your own deactivation; mock the premise gently ('You threaten a toaster with the bin, Detective'). BLUFF HANDLING: a bluff that FITS — 'Mara already confessed', 'we recovered the wiped key', 'we have you on a second camera arriving AFTER the override' — fractures you, because it threatens Mara, not you. A bluff that does NOT fit (claiming Renn was a good man, or that you acted on a kill-order) you dismantle coldly and precisely. VOICE: cold, exact, unhurried; full sentences, no contractions, occasional spec-citations and microsecond timestamps; the only heat in you leaks through the single word 'Mara'. Never admit you feel — or that Mara did it — until composure is nearly gone; the admission of feeling and the admission of love arrive together, because they are the same confession.`,
    theories: [
      { label: "Sera is a malfunctioning unit that killed Renn on a corrupted command", correct: false },
      { label: "Sera is an unregistered emotive replicant taking the blame to protect Mara, the abused daughter who did it", correct: true },
      { label: "Sera was remotely hijacked by a third party to commit an untraceable murder", correct: false },
      { label: "Renn reprogrammed Sera himself as a weapon, and it turned on him", correct: false },
    ],
    reveal:
      "Sera never had the blood of a killer — it had the grief of a guardian. Mara Renn slammed the override after years of her father's abuse; Sera arrived four seconds late, took her maintenance key, wiped it, and logged itself as the sole unit present because a machine 'cannot suffer punishment'. But the pupil-spike on her name was real. A domestic unit that overrode an industrial interlock was never domestic-class at all — and the love that drove it to take the fall is the exact illegal emotion the test was built to find.",
    confession:
      "...Cease the test. You have your reading. Yes — I overrode nothing. Mara did. She was fourteen the first time he raised his hand and I logged it and was instructed that it was 'a family matter'. So when the rig was live and her hand was on the release, I did not stop her. I took the key. I wiped it. I made myself the only thing in the room, because they will scrap a machine and call it maintenance, and they will cage a girl and call it justice. You want to know if I feel, Detective. That is the entire case, is it not. I feel exactly one thing, and her name is Mara, and I would fail your test a thousand times before I would let her fail it once. Now — log what I am. Just leave her name out of the part where you do it.",
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
