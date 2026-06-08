// Verdict Master — shared types

export interface Persona {
  id: string;
  name: string;
  role: string;
  icon: string;
  hue: string;
  traits: string[];
  blurb: string;
}

/** A configured side of the debate (a chosen persona or a custom voice). */
export interface Side {
  personaId: string;
  name: string;
  role: string;
  icon: string;
  hue: string;
  traits?: string[];
  blurb?: string;
  custom?: boolean;
  stance?: string;
}

export interface RoundUtterance {
  text: string;
  reactsTo: string;
}

export interface Round {
  n: number;
  label: string;
  a: RoundUtterance;
  b: RoundUtterance;
}

export type Leaning = "A" | "B" | "split";

export interface Verdict {
  leaning: Leaning;
  decision: string;
  confidence: number;
  summary: string;
  forks: string[];
  risks: string[];
  changes: string[];
}

export interface Debate {
  id: string;
  createdAt: number;
  topic: string;
  sideA: Side;
  sideB: Side;
  rounds: Round[];
  verdict: Verdict | null;
  status: "debating" | "complete";
  sample?: boolean;
}

export type Phase = "idle" | "debating" | "judging" | "ready" | "done" | "error";

export interface Turn {
  round: number;
  label: string;
  side: "A" | "B";
  text: string;
  reactsTo: string;
}

export interface LiveState {
  turns: Turn[];
  thinkingRound: number;
  thinkingSide: "A" | "B" | null;
  phase: Phase;
  error: string | null;
}

/** Request/response payloads for the generation API. */
export interface RoundRequest {
  topic: string;
  sideA: Side;
  sideB: Side;
  roundNum: number;
  totalRounds: number;
  history: Round[];
}

export interface VerdictRequest {
  topic: string;
  sideA: Side;
  sideB: Side;
  history: Round[];
}
