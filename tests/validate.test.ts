// Server-side request validation: the wall between client payloads and prompts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoundRequest, parseVerdictRequest } from "../lib/validate";

const sideA = { personaId: "skeptic", name: "The Skeptic", role: "Cautious analyst", icon: "shield", hue: "#60a5fa" };
const sideB = { personaId: "optimist", name: "The Optimist", role: "Bold believer", icon: "rocket", hue: "#fbbf24" };

function validRound(extra: Record<string, unknown> = {}) {
  return {
    topic: "Should I quit my job to freelance?",
    sideA,
    sideB,
    roundNum: 1,
    totalRounds: 3,
    history: [],
    ...extra,
  };
}

test("parseRoundRequest accepts a well-formed request", () => {
  const out = parseRoundRequest(validRound());
  assert.ok(out);
  assert.equal(out.topic, "Should I quit my job to freelance?");
  assert.equal(out.sideA.name, "The Skeptic");
  assert.equal(out.roundNum, 1);
  assert.equal(out.totalRounds, 3);
  assert.deepEqual(out.history, []);
});

test("parseRoundRequest rejects junk shapes", () => {
  assert.equal(parseRoundRequest(null), null);
  assert.equal(parseRoundRequest("hi"), null);
  assert.equal(parseRoundRequest({}), null);
  assert.equal(parseRoundRequest(validRound({ topic: "ab" })), null); // too short
  assert.equal(parseRoundRequest(validRound({ sideA: undefined })), null);
  assert.equal(parseRoundRequest(validRound({ sideA: { name: "" } })), null);
});

test("parseRoundRequest bounds the round numbers", () => {
  assert.equal(parseRoundRequest(validRound({ roundNum: 4, totalRounds: 3 })), null);
  assert.equal(parseRoundRequest(validRound({ roundNum: 0 })), null);
  assert.equal(parseRoundRequest(validRound({ totalRounds: 99 })), null);
  assert.equal(parseRoundRequest(validRound({ roundNum: "1" })), null); // numbers only
});

test("parseRoundRequest caps oversized strings instead of crashing", () => {
  const out = parseRoundRequest(validRound({ topic: "x".repeat(5000) }));
  assert.ok(out);
  assert.equal(out.topic.length, 1200);
});

test("parseRoundRequest sanitizes history: drops malformed rounds, caps at 6", () => {
  const goodRound = (n: number) => ({
    n,
    label: "Round " + n,
    a: { text: "point a", reactsTo: "" },
    b: { text: "point b", reactsTo: "counter" },
  });
  const history = [
    goodRound(1),
    { n: 2, a: { text: "" }, b: { text: "only b" } }, // empty a.text → dropped
    "garbage",
    null,
    ...[3, 4, 5, 6, 7, 8].map(goodRound), // pushes past the 6-round cap
  ];
  const out = parseRoundRequest(validRound({ history }));
  assert.ok(out);
  assert.ok(out.history.length <= 6);
  assert.ok(out.history.every((r) => r.a.text && r.b.text));
});

test("parseRoundRequest preserves custom voices and caps traits", () => {
  const custom = {
    personaId: "custom",
    custom: true,
    name: "My inner critic",
    stance: "ruthlessly weighs money and time",
    traits: Array.from({ length: 20 }, (_, i) => "trait-" + i),
  };
  const out = parseRoundRequest(validRound({ sideA: custom }));
  assert.ok(out);
  assert.equal(out.sideA.custom, true);
  assert.equal(out.sideA.stance, "ruthlessly weighs money and time");
  assert.ok((out.sideA.traits || []).length <= 8);
});

test("parseVerdictRequest requires at least one argued round", () => {
  assert.equal(
    parseVerdictRequest({ topic: "Should I move cities?", sideA, sideB, history: [] }),
    null
  );
  const out = parseVerdictRequest({
    topic: "Should I move cities?",
    sideA,
    sideB,
    history: [
      { n: 1, label: "Opening statements", a: { text: "stay" }, b: { text: "go" } },
    ],
  });
  assert.ok(out);
  assert.equal(out.history.length, 1);
  assert.equal(out.history[0].a.reactsTo, "");
});
