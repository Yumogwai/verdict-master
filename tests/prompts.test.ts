// Prompt construction + defensive parsing of model output.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractJSON,
  buildRoundPrompt,
  parseRound,
  buildVerdictPrompt,
  parseVerdict,
} from "../lib/debate-prompts";
import type { RoundRequest, VerdictRequest } from "../lib/types";

const sideA = { personaId: "skeptic", name: "The Skeptic", role: "Cautious analyst", icon: "shield", hue: "#60a5fa", traits: ["Risk-averse"], blurb: "Pressure-tests every claim." };
const sideB = { personaId: "optimist", name: "The Optimist", role: "Bold believer", icon: "rocket", hue: "#fbbf24" };

const baseRound: RoundRequest = {
  topic: "Should I take the startup offer?",
  sideA,
  sideB,
  roundNum: 1,
  totalRounds: 3,
  history: [],
};

test("extractJSON tolerates fences and preamble", () => {
  assert.deepEqual(extractJSON('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Here is the JSON: {"a":1} — enjoy'), { a: 1 });
  assert.throws(() => extractJSON("no braces here"));
  assert.throws(() => extractJSON(""));
});

test("buildRoundPrompt stages the debate by position", () => {
  const opening = buildRoundPrompt(baseRound);
  assert.ok(opening.includes("Should I take the startup offer?"));
  assert.ok(opening.includes("The Skeptic"));
  assert.ok(opening.includes("The Optimist"));
  assert.ok(opening.includes("OPENING"));
  assert.ok(opening.includes("(no prior rounds)"));

  const rebuttal = buildRoundPrompt({ ...baseRound, roundNum: 2 });
  assert.ok(rebuttal.includes("REBUTTAL"));

  const closing = buildRoundPrompt({ ...baseRound, roundNum: 3 });
  assert.ok(closing.includes("CLOSING"));
});

test("buildRoundPrompt feeds prior rounds back in, attributed by name", () => {
  const prompt = buildRoundPrompt({
    ...baseRound,
    roundNum: 2,
    history: [
      {
        n: 1,
        label: "Opening statements",
        a: { text: "The equity is a lottery ticket.", reactsTo: "" },
        b: { text: "The salary is the real trap.", reactsTo: "" },
      },
    ],
  });
  assert.ok(prompt.includes("The Skeptic: The equity is a lottery ticket."));
  assert.ok(prompt.includes("The Optimist: The salary is the real trap."));
});

test("parseRound returns trimmed utterances and tolerates missing reactsTo", () => {
  const round = parseRound(
    '{"a":{"text":"  Hold.  "},"b":{"text":"Jump.","reactsTo":"Hold"}}'
  );
  assert.equal(round.a.text, "Hold.");
  assert.equal(round.a.reactsTo, "");
  assert.equal(round.b.reactsTo, "Hold");
});

test("parseRound throws on malformed output", () => {
  assert.throws(() => parseRound('{"a":{"text":"only one side"}}'));
  assert.throws(() => parseRound('{"a":{"text":""},"b":{"text":"x"}}'));
  assert.throws(() => parseRound("complete garbage"));
});

const verdictReq: VerdictRequest = {
  topic: "Should I take the startup offer?",
  sideA,
  sideB,
  history: [
    {
      n: 1,
      label: "Opening statements",
      a: { text: "Too risky.", reactsTo: "" },
      b: { text: "Too good to skip.", reactsTo: "" },
    },
  ],
};

test("buildVerdictPrompt carries the full transcript to the judge", () => {
  const prompt = buildVerdictPrompt(verdictReq);
  assert.ok(prompt.includes("THE ARBITER"));
  assert.ok(prompt.includes("Should I take the startup offer?"));
  assert.ok(prompt.includes("Too risky."));
  assert.ok(prompt.includes("Too good to skip."));
});

test("parseVerdict normalizes leaning and clamps confidence", () => {
  const v = parseVerdict(
    '{"leaning":"b","decision":"Take it.","confidence":150,"summary":"s","forks":["f1"],"risks":[],"changes":["c1", 42]}'
  );
  assert.equal(v.leaning, "B");
  assert.equal(v.confidence, 100);
  assert.deepEqual(v.changes, ["c1", "42"]); // coerced to strings
});

test("parseVerdict falls back sanely on junk fields", () => {
  const v = parseVerdict(
    '{"leaning":"sideways","decision":"Ruling.","confidence":"not a number","forks":"nope"}'
  );
  assert.equal(v.leaning, "split");
  assert.equal(v.confidence, 60); // documented fallback
  assert.deepEqual(v.forks, []);
  assert.equal(v.summary, "");
});

test("parseVerdict requires a decision", () => {
  assert.throws(() => parseVerdict('{"leaning":"A","confidence":70}'));
});
