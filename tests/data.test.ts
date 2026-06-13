// Static data consistency: personas, icons, round labels, sample history.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PERSONAS, JUDGE, SAMPLE_HISTORY, personaById, roundLabel } from "../lib/data";
import { ICONS } from "../lib/icons";

test("roundLabel always closes on the last round, whatever the length", () => {
  // 2-round debate: opening straight into the close (the old fixed list
  // mislabeled this finale as "Rebuttal").
  assert.equal(roundLabel(1, 2), "Opening statements");
  assert.equal(roundLabel(2, 2), "Closing arguments");
  // 3-round debate
  assert.equal(roundLabel(2, 3), "Rebuttal");
  assert.equal(roundLabel(3, 3), "Closing arguments");
  // 4-round debate
  assert.equal(roundLabel(2, 4), "Rebuttal");
  assert.equal(roundLabel(3, 4), "Crossfire");
  assert.equal(roundLabel(4, 4), "Closing arguments");
});

test("personas have unique ids and resolvable icons", () => {
  const ids = new Set(PERSONAS.map((p) => p.id));
  assert.equal(ids.size, PERSONAS.length);
  for (const p of PERSONAS) {
    assert.ok(ICONS[p.icon], p.name + " icon '" + p.icon + "' must exist in ICONS");
    assert.ok(p.traits.length > 0);
    assert.ok(p.blurb.length > 0);
  }
  assert.ok(ICONS[JUDGE.icon]);
});

test("UI-critical icons are all present in the icon set", () => {
  // Referenced directly in the chrome/actions, not via persona data — a removal
  // would otherwise render a silently-empty <svg>.
  for (const name of ["scale", "gavel", "swords", "plus", "play", "swap", "copy", "download", "trash", "alert", "arrowLeft", "arrowRight", "check"]) {
    assert.ok(ICONS[name], "icon '" + name + "' must exist in ICONS");
  }
});

test("personaById finds presets and rejects unknowns", () => {
  assert.equal(personaById("skeptic")?.name, "The Skeptic");
  assert.equal(personaById("nope"), null);
});

test("sample history ships complete, judged debates", () => {
  assert.ok(SAMPLE_HISTORY.length >= 2);
  for (const d of SAMPLE_HISTORY) {
    assert.equal(d.sample, true);
    assert.equal(d.status, "complete");
    assert.ok(d.rounds.length >= 2);
    assert.ok(d.verdict, d.id + " must carry a verdict");
    assert.ok(d.verdict!.forks.length === 3);
    assert.ok(d.verdict!.risks.length === 3);
    assert.ok(d.verdict!.changes.length === 3);
    assert.ok(d.verdict!.confidence > 0 && d.verdict!.confidence <= 100);
  }
});
