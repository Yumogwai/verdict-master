// Verdict Master — server-side request validation.
// Every client-supplied string is type-checked and length-capped before it can
// reach a prompt, so a hostile client can't inflate token spend or smuggle in
// oversized payloads. Pure functions — safe to unit-test without a server.
import type { Round, RoundRequest, RoundUtterance, Side, VerdictRequest } from "./types";

const MAX = {
  topic: 1200,
  name: 80,
  role: 80,
  blurb: 300,
  stance: 300,
  trait: 48,
  traits: 8,
  icon: 40,
  hue: 40,
  label: 60,
  text: 1600,
  reactsTo: 120,
  rounds: 6,
  totalRounds: 5,
};

const MIN_TOPIC = 4;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function int(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function side(v: unknown): Side | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  const name = str(s.name, MAX.name);
  if (!name) return null;
  const out: Side = {
    personaId: str(s.personaId, MAX.name) || "custom",
    name,
    role: str(s.role, MAX.role),
    icon: str(s.icon, MAX.icon),
    hue: str(s.hue, MAX.hue),
  };
  if (s.custom === true) out.custom = true;
  const stance = str(s.stance, MAX.stance);
  if (stance) out.stance = stance;
  const blurb = str(s.blurb, MAX.blurb);
  if (blurb) out.blurb = blurb;
  if (Array.isArray(s.traits)) {
    const traits = s.traits
      .map((t) => str(t, MAX.trait))
      .filter(Boolean)
      .slice(0, MAX.traits);
    if (traits.length) out.traits = traits;
  }
  return out;
}

function utterance(v: unknown): RoundUtterance | null {
  if (!v || typeof v !== "object") return null;
  const u = v as Record<string, unknown>;
  const text = str(u.text, MAX.text);
  if (!text) return null;
  return { text, reactsTo: str(u.reactsTo, MAX.reactsTo) };
}

function history(v: unknown): Round[] {
  if (!Array.isArray(v)) return [];
  const rounds: Round[] = [];
  for (const r of v.slice(0, MAX.rounds)) {
    if (!r || typeof r !== "object") continue;
    const x = r as Record<string, unknown>;
    const a = utterance(x.a);
    const b = utterance(x.b);
    if (!a || !b) continue;
    const n = int(x.n, 1, MAX.rounds) ?? rounds.length + 1;
    rounds.push({ n, label: str(x.label, MAX.label) || "Round " + n, a, b });
  }
  return rounds;
}

/** Validate a /api/round body. Returns a sanitized request, or null if unusable. */
export function parseRoundRequest(v: unknown): RoundRequest | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const topic = str(x.topic, MAX.topic);
  const sideA = side(x.sideA);
  const sideB = side(x.sideB);
  const totalRounds = int(x.totalRounds, 1, MAX.totalRounds);
  const roundNum = totalRounds ? int(x.roundNum, 1, totalRounds) : null;
  if (topic.length < MIN_TOPIC || !sideA || !sideB || !roundNum || !totalRounds) {
    return null;
  }
  return { topic, sideA, sideB, roundNum, totalRounds, history: history(x.history) };
}

/** Validate a /api/verdict body. Requires at least one argued round to judge. */
export function parseVerdictRequest(v: unknown): VerdictRequest | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const topic = str(x.topic, MAX.topic);
  const sideA = side(x.sideA);
  const sideB = side(x.sideB);
  const rounds = history(x.history);
  if (topic.length < MIN_TOPIC || !sideA || !sideB || rounds.length === 0) {
    return null;
  }
  return { topic, sideA, sideB, history: rounds };
}
