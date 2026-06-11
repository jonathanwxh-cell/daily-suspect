export type Tactic = "PRESSURE" | "EMPATHY" | "LOGIC" | "BLUFF";

export interface Suggested {
  tactic: Tactic;
  q: string;
}

export interface PublicCase {
  id: string;
  name: string;
  age: number;
  crime: string;
  tagline: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  color: string;
  budget: number;
  startComposure: number;
  initials: string;
  room: string;
  portrait: string;
  briefing: string[];
  opening: string;
  starters: Suggested[];
  theories: string[];
}
