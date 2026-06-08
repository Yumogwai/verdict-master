// Verdict Master — prompt construction + defensive response parsing.
// Pure functions, no secrets — safe to import on the server.
import type {
  Side,
  Round,
  Verdict,
  RoundUtterance,
  RoundRequest,
  VerdictRequest,
} from "./types";

function descriptor(side: Side): string {
  if (side.custom) {
    return (
      side.name + " — " + (side.stance || "a distinct point of view") + "."
    );
  }
  const bits = [side.name + " (" + side.role + ")"];
  if (side.blurb) bits.push(side.blurb);
  if (side.traits && side.traits.length) {
    bits.push("Style: " + side.traits.join(", ") + ".");
  }
  return bits.join(" ");
}

/** Extract a JSON object from a model response, tolerating fences/preamble. */
export function extractJSON(raw: string): any {
  if (!raw) throw new Error("empty");
  let s = String(raw).trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object found");
  return JSON.parse(s.slice(start, end + 1));
}

function roundGuidance(roundNum: number, totalRounds: number): string {
  if (roundNum === 1) {
    return "This is the OPENING round. Each side lays out its single strongest, most concrete argument. Side B may end with a sharp jab at Side A.";
  }
  if (roundNum === totalRounds) {
    return "This is the CLOSING round. Each side delivers its most persuasive final summary and a direct appeal to the decision-maker. No new threads — land the case.";
  }
  return "This is a REBUTTAL round. Each side directly attacks the other’s most recent point by name and raises the stakes. Make it feel like a real exchange, not two monologues.";
}

function historyBlock(rounds: Round[], sideA: Side, sideB: Side): string {
  if (!rounds.length) return "(no prior rounds)";
  return rounds
    .map(
      (r) =>
        "Round " +
        r.n +
        " — " +
        r.label +
        "\n" +
        sideA.name +
        ": " +
        r.a.text +
        "\n" +
        sideB.name +
        ": " +
        r.b.text
    )
    .join("\n\n");
}

export function buildRoundPrompt(opts: RoundRequest): string {
  const { topic, sideA, sideB, roundNum, totalRounds } = opts;
  const prior = opts.history || [];
  return (
    "You are scripting one round of a tense, live, head-to-head debate between two AI advisors helping a real person make a hard decision. Write with bite and momentum — like a televised debate, not a memo.\n\n" +
    'THE DECISION ON THE TABLE:\n"' +
    topic +
    '"\n\n' +
    'SIDE A argues the CAUTIOUS / "don’t do it (yet)" / protect-the-downside case, voiced as:\n' +
    descriptor(sideA) +
    "\n\n" +
    'SIDE B argues the BOLD / "make the move" / seize-the-upside case, voiced as:\n' +
    descriptor(sideB) +
    "\n\n" +
    "CONVERSATION SO FAR:\n" +
    historyBlock(prior, sideA, sideB) +
    "\n\n" +
    "NOW WRITE ROUND " +
    roundNum +
    " OF " +
    totalRounds +
    ". " +
    roundGuidance(roundNum, totalRounds) +
    "\n\n" +
    "Rules:\n" +
    "- Each side: 2–3 sentences, max ~55 words. Sharp, specific, in-character. Reference the actual decision, not generic advice.\n" +
    "- Stay in each persona’s voice and worldview.\n" +
    '- "reactsTo" = a 2–5 word fragment of the opponent’s point this side is countering (empty string in round 1, or if not directly countering).\n' +
    "- No markdown, no preamble. Output ONLY this JSON:\n" +
    '{"a":{"text":"...","reactsTo":"..."},"b":{"text":"...","reactsTo":"..."}}'
  );
}

export function parseRound(raw: string): { a: RoundUtterance; b: RoundUtterance } {
  const j = extractJSON(raw);
  if (!j.a || !j.b || !j.a.text || !j.b.text) throw new Error("malformed round");
  return {
    a: { text: String(j.a.text).trim(), reactsTo: (j.a.reactsTo || "").toString().trim() },
    b: { text: String(j.b.text).trim(), reactsTo: (j.b.reactsTo || "").toString().trim() },
  };
}

export function buildVerdictPrompt(opts: VerdictRequest): string {
  const { topic, sideA, sideB } = opts;
  const rounds = opts.history || [];
  return (
    "You are THE ARBITER — an impartial judge who just heard a full debate between two advisors on a person’s hard decision. Rule decisively but honestly. You are allowed to be uncertain; reflect that in the confidence number.\n\n" +
    'THE DECISION:\n"' +
    topic +
    '"\n\n' +
    "SIDE A (" +
    sideA.name +
    ") argued the cautious case. SIDE B (" +
    sideB.name +
    ") argued the bold case.\n\n" +
    "FULL DEBATE TRANSCRIPT:\n" +
    historyBlock(rounds, sideA, sideB) +
    "\n\n" +
    "Deliver your verdict. Be concrete and specific to THIS decision — never generic.\n" +
    '- "leaning": "A" if you side with caution, "B" if you side with action, "split" if genuinely balanced.\n' +
    '- "decision": one punchy sentence — the actual ruling/recommendation.\n' +
    '- "confidence": integer 0–100, how sure you are. Be honest; hard calls sit 50–70.\n' +
    '- "summary": 2–3 sentences explaining the ruling.\n' +
    '- "forks": 3 key decision points everything hinged on, each phrased as a crisp question.\n' +
    '- "risks": 3 main risks of following your recommendation.\n' +
    '- "changes": 3 specific things that would change your verdict (each: a condition → the new conclusion).\n\n' +
    "No markdown, no preamble. Output ONLY this JSON:\n" +
    '{"leaning":"A|B|split","decision":"...","confidence":63,"summary":"...","forks":["...","...","..."],"risks":["...","...","..."],"changes":["...","...","..."]}'
  );
}

export function parseVerdict(raw: string): Verdict {
  const j = extractJSON(raw);
  if (!j.decision) throw new Error("malformed verdict");
  const clamp = (n: any) => {
    let v = parseInt(n, 10);
    if (isNaN(v)) v = 60;
    return Math.max(0, Math.min(100, v));
  };
  const arr = (x: any): string[] =>
    Array.isArray(x) ? x.map((s) => String(s).trim()).filter(Boolean) : [];
  let lean = (j.leaning || "split").toString().trim().toUpperCase();
  if (lean !== "A" && lean !== "B") lean = "split";
  return {
    leaning: lean === "A" ? "A" : lean === "B" ? "B" : "split",
    decision: String(j.decision).trim(),
    confidence: clamp(j.confidence),
    summary: String(j.summary || "").trim(),
    forks: arr(j.forks),
    risks: arr(j.risks),
    changes: arr(j.changes),
  };
}
