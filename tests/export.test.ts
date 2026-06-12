// Markdown export of a finished debate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { debateToMarkdown, exportFilename } from "../lib/export";
import type { Debate } from "../lib/types";

const debate: Debate = {
  id: "d-1",
  createdAt: 0,
  topic: "Should I take the startup offer?",
  sideA: { personaId: "skeptic", name: "The Skeptic", role: "Cautious analyst", icon: "shield", hue: "#60a5fa" },
  sideB: { personaId: "optimist", name: "The Optimist", role: "Bold believer", icon: "rocket", hue: "#fbbf24" },
  rounds: [
    {
      n: 1,
      label: "Opening statements",
      a: { text: "The equity is a lottery ticket.", reactsTo: "" },
      b: { text: "The salary is the real trap.", reactsTo: "lottery ticket" },
    },
  ],
  verdict: {
    leaning: "B",
    decision: "Take it — with guardrails.",
    confidence: 64,
    summary: "The upside case wins on asymmetry.",
    forks: ["Do the founders survive diligence?"],
    risks: ["Halved cash resets your savings."],
    changes: ["A weak founding team flips this to no."],
  },
  status: "complete",
};

test("debateToMarkdown renders the full transcript and verdict", () => {
  const md = debateToMarkdown(debate);
  assert.ok(md.startsWith("# ⚖️ Should I take the startup offer?"));
  assert.ok(md.includes("## Round 1 — Opening statements"));
  assert.ok(md.includes("**The Skeptic:** The equity is a lottery ticket."));
  assert.ok(md.includes("**The Optimist:** The salary is the real trap."));
  assert.ok(md.includes("responding to “lottery ticket”"));
  assert.ok(md.includes("> **Take it — with guardrails.**"));
  assert.ok(md.includes("**Confidence:** 64%"));
  assert.ok(md.includes("Sides with the bold call (The Optimist)"));
  assert.ok(md.includes("### What it hinged on"));
  assert.ok(md.includes("### Main risks"));
  assert.ok(md.includes("### What would change it"));
});

test("debateToMarkdown omits the verdict block when there is none", () => {
  const md = debateToMarkdown({ ...debate, verdict: null });
  assert.ok(!md.includes("## The verdict"));
  assert.ok(md.includes("## Round 1"));
});

test("exportFilename slugifies the topic and always has a fallback", () => {
  assert.equal(exportFilename(debate), "verdict-should-i-take-the-startup-offer.md");
  assert.equal(exportFilename({ ...debate, topic: "?!… ⚖️" }), "verdict-debate.md");
  const long = exportFilename({ ...debate, topic: "word ".repeat(40) });
  assert.ok(long.length <= "verdict-".length + 48 + ".md".length);
  assert.ok(long.endsWith(".md"));
});
