"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Debate, Leaning, Side } from "@/lib/types";
import { JUDGE } from "@/lib/data";
import { debateToMarkdown, exportFilename } from "@/lib/export";
import { Ic } from "./Icon";

function LeanPill({
  leaning,
  sideA,
  sideB,
}: {
  leaning: Leaning;
  sideA: Side;
  sideB: Side;
}) {
  let color: string, label: string, icon: string;
  if (leaning === "A") {
    color = "var(--side-a)";
    label = "Sides with caution · " + sideA.name;
    icon = "shield";
  } else if (leaning === "B") {
    color = "var(--side-b)";
    label = "Sides with the bold call · " + sideB.name;
    icon = "rocket";
  } else {
    color = "var(--brand-400)";
    label = "Genuinely too close to call";
    icon = "scale";
  }
  return (
    <span
      className="vm-lean-pill"
      style={{
        color,
        background: "color-mix(in srgb, " + color + " 12%, transparent)",
        borderColor: "color-mix(in srgb, " + color + " 35%, transparent)",
      }}
    >
      <Ic name={icon} /> {label}
    </span>
  );
}

function DetailCard({
  icon,
  color,
  title,
  items,
  kind,
}: {
  icon: string;
  color: string;
  title: string;
  items: string[];
  kind: "fork" | "risk" | "change";
}) {
  return (
    <div className="vm-detail-card">
      <h4>
        <span
          className="ic"
          style={{ background: "color-mix(in srgb, " + color + " 13%, transparent)", color }}
        >
          <Ic name={icon} />
        </span>
        {title}
      </h4>
      <div className="vm-detail-list">
        {items.map((it, i) => (
          <div className="vm-detail-item" key={i}>
            {kind === "fork" ? (
              <span className="b">{i + 1}</span>
            ) : (
              <Ic name={icon} style={{ color }} />
            )}
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VerdictScreen({
  debate,
  saved,
  onBack,
  onNew,
  onRematch,
}: {
  debate: Debate;
  saved: boolean;
  onBack: () => void;
  onNew: () => void;
  onRematch: () => void;
}) {
  const v = debate.verdict!;
  const [ringVal, setRingVal] = useState(0);
  const [countVal, setCountVal] = useState(0);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(debateToMarkdown(debate));
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context) — the download path still works */
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([debateToMarkdown(debate)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(debate);
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    // ring fills via inline --val; count-up via setInterval (fires even when rAF is throttled)
    const ringT = setTimeout(() => setRingVal(v.confidence), 80);
    setCountVal(0);
    let cur = 0;
    const target = v.confidence;
    const inc = Math.max(1, Math.round(target / 26));
    const iv = setInterval(() => {
      cur = Math.min(target, cur + inc);
      setCountVal(cur);
      if (cur >= target) clearInterval(iv);
    }, 28);
    return () => {
      clearTimeout(ringT);
      clearInterval(iv);
    };
  }, [v.confidence]);

  const judge = JUDGE;

  return (
    <div className="vm-verdict">
      <button className="vm-back" onClick={onBack}>
        <Ic name="arrowLeft" /> Back to the debate
      </button>

      <div className="vm-verdict-hero">
        <div className="vm-judge-row">
          <div className="vm-judge-av">
            <Ic name="gavel" />
          </div>
          <div className="jm">
            <div className="nm">{judge.name}</div>
            <div className="rl">The verdict</div>
          </div>
        </div>

        <div className="vm-verdict-grid">
          <div className="vm-verdict-decision">
            <LeanPill leaning={v.leaning} sideA={debate.sideA} sideB={debate.sideB} />
            <h1>{v.decision}</h1>
            {v.summary ? <p className="summary">{v.summary}</p> : null}
          </div>
          <div className="vm-conf">
            <div className="vm-ring" style={{ "--val": ringVal } as CSSProperties}>
              <span className="v">{countVal}</span>
            </div>
            <span className="clabel">Confidence</span>
          </div>
        </div>
      </div>

      <div className="vm-detail-grid">
        <DetailCard
          icon="split"
          color="var(--brand-400)"
          title="What it hinged on"
          items={v.forks}
          kind="fork"
        />
        <DetailCard
          icon="alert"
          color="var(--danger-400)"
          title="Main risks"
          items={v.risks}
          kind="risk"
        />
        <DetailCard
          icon="refresh"
          color="var(--info-400)"
          title="What would change it"
          items={v.changes}
          kind="change"
        />
      </div>

      <div className="vm-verdict-actions">
        {saved ? (
          <span className="vm-saved-flag" style={{ alignSelf: "center", marginRight: 4 }}>
            <Ic name="check" /> Saved to history
          </span>
        ) : null}
        <button
          className="vm-btn-secondary"
          onClick={copyMarkdown}
          title="Copy the full debate + verdict as Markdown"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Ic name={copied ? "check" : "copy"} style={{ width: 14, height: 14 }} />
            {copied ? "Copied" : "Copy result"}
          </span>
        </button>
        <button
          className="vm-btn-secondary"
          onClick={downloadMarkdown}
          title="Download as a .md file"
          aria-label="Download as Markdown"
        >
          <Ic name="download" style={{ width: 14, height: 14 }} />
        </button>
        <button
          className="vm-btn-secondary"
          onClick={onRematch}
          title="Rerun this dilemma with the two voices arguing the opposite cases"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Ic name="swap" style={{ width: 14, height: 14 }} /> Rematch · swap sides
          </span>
        </button>
        <button className="vm-btn-secondary" onClick={onBack}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Ic name="swords" style={{ width: 14, height: 14 }} /> Reread the debate
          </span>
        </button>
        <button className="vm-btn-primary" onClick={onNew}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Ic name="plus" style={{ width: 14, height: 14 }} /> New debate
          </span>
        </button>
      </div>
    </div>
  );
}
