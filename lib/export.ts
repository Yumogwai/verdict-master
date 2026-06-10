// Verdict Master — export a finished debate as Markdown.
// Pure functions, client-safe: used by the verdict screen's copy/download.
import type { Debate } from "./types";

function leanLabel(debate: Debate): string {
  const v = debate.verdict;
  if (!v) return "";
  if (v.leaning === "A") return "Sides with caution (" + debate.sideA.name + ")";
  if (v.leaning === "B") return "Sides with the bold call (" + debate.sideB.name + ")";
  return "Genuinely too close to call";
}

function list(title: string, items: string[], ordered: boolean): string[] {
  if (!items.length) return [];
  const lines = ["### " + title, ""];
  items.forEach((item, i) => lines.push((ordered ? i + 1 + "." : "-") + " " + item));
  lines.push("");
  return lines;
}

export function debateToMarkdown(debate: Debate): string {
  const { topic, sideA, sideB, rounds, verdict } = debate;
  const lines: string[] = [
    "# ⚖️ " + topic,
    "",
    "**" + sideA.name + "** (cautious) vs **" + sideB.name + "** (bold) — judged by The Arbiter.",
    "",
  ];

  for (const r of rounds) {
    lines.push("## Round " + r.n + " — " + r.label, "");
    lines.push("**" + sideA.name + ":** " + r.a.text);
    if (r.a.reactsTo) lines.push("*↳ responding to “" + r.a.reactsTo + "”*");
    lines.push("");
    lines.push("**" + sideB.name + ":** " + r.b.text);
    if (r.b.reactsTo) lines.push("*↳ responding to “" + r.b.reactsTo + "”*");
    lines.push("");
  }

  if (verdict) {
    lines.push("## The verdict", "");
    lines.push("> **" + verdict.decision + "**", "");
    lines.push("- **Leaning:** " + leanLabel(debate));
    lines.push("- **Confidence:** " + verdict.confidence + "%", "");
    if (verdict.summary) lines.push(verdict.summary, "");
    lines.push(...list("What it hinged on", verdict.forks, true));
    lines.push(...list("Main risks", verdict.risks, false));
    lines.push(...list("What would change it", verdict.changes, false));
  }

  lines.push("---");
  lines.push(
    "*Two minds argue. One judge rules. Generated with [Verdict Master](https://github.com/Yumogwai/verdict-master).*"
  );
  return lines.join("\n");
}

export function exportFilename(debate: Debate): string {
  const slug = debate.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return "verdict-" + (slug || "debate") + ".md";
}
