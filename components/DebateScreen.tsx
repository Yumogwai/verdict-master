"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Debate, LiveState, Side, Turn as TurnT } from "@/lib/types";
import { roundLabel } from "@/lib/data";
import { Ic } from "./Icon";
import { Avatar } from "./Avatar";

function Fighter({
  persona,
  color,
  side,
}: {
  persona: Side;
  color: string;
  side: "A" | "B";
}) {
  return (
    <div className={"vm-fighter " + side.toLowerCase()}>
      <div
        className="vm-fighter-av"
        style={{
          background: color,
          boxShadow: "0 0 14px color-mix(in srgb, " + color + " 32%, transparent)",
        }}
      >
        <Ic name={persona.icon} />
      </div>
      <div className="vm-fighter-meta">
        <div className="nm">{persona.name}</div>
        <div
          className="rl"
          style={{ color: "color-mix(in srgb, " + color + " 78%, var(--fg-30))" }}
        >
          {side === "A" ? "Cautious" : "Bold"}
        </div>
      </div>
    </div>
  );
}

function Turn({
  turn,
  persona,
  color,
}: {
  turn: TurnT;
  persona: Side;
  color: string;
}) {
  // Base state is visible; reveal by dropping the `.enter` class via a timer
  // (timers fire even if the animation timeline is throttled). Matches the design.
  const [enter, setEnter] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setEnter(false), 24);
    return () => clearTimeout(id);
  }, []);
  return (
    <div
      className={"vm-turn " + turn.side.toLowerCase() + (enter ? " enter" : "")}
      style={{ "--c": color } as CSSProperties}
    >
      <div
        className="vm-turn-av"
        style={{ background: color, "--c": color } as CSSProperties}
      >
        <Ic name={persona.icon} />
      </div>
      <div className="vm-bubble">
        <div className="vm-bubble-name">
          <span className="nm">{persona.name}</span>
          <span className="rl">{persona.custom ? "" : persona.role}</span>
        </div>
        {turn.reactsTo ? (
          <div className="vm-react">
            <Ic name="arrowRight" />
            <span className="q">&ldquo;{turn.reactsTo}&rdquo;</span>
          </div>
        ) : null}
        <div className="vm-bubble-text">{turn.text}</div>
      </div>
    </div>
  );
}

function ThinkingBubble({
  side,
  color,
  icon,
}: {
  side: "A" | "B";
  color: string;
  icon: string;
}) {
  return (
    <div
      className={"vm-thinking " + side.toLowerCase()}
      style={{ "--c": color } as CSSProperties}
    >
      <div className="vm-turn-av" style={{ background: color }}>
        <Ic name={icon} />
      </div>
      <div className="vm-bubble">
        <span className="vm-dot" />
        <span className="vm-dot" />
        <span className="vm-dot" />
      </div>
    </div>
  );
}

export function DebateScreen({
  debate,
  live,
  onReveal,
}: {
  debate: Debate;
  live: LiveState;
  onReveal: () => void;
}) {
  const { sideA, sideB } = debate;
  const colorA = "var(--side-a)";
  const colorB = "var(--side-b)";
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-follow the newest content as the debate unfolds
  useEffect(() => {
    if (live.phase !== "debating" && live.phase !== "judging") return;
    const root = scrollRef.current;
    if (!root) return;
    const main = root.closest(".vm-main") as HTMLElement | null;
    const id = window.requestAnimationFrame(() => {
      if (main && main.scrollHeight > main.clientHeight + 4) {
        main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [live.turns.length, live.thinkingSide, live.phase]);

  const turns = live.turns || [];
  const maxRound = Math.max(
    live.thinkingRound || 0,
    turns.reduce((m, t) => Math.max(m, t.round), 0)
  );
  const rounds: {
    n: number;
    label: string;
    a?: TurnT;
    b?: TurnT;
  }[] = [];
  for (let n = 1; n <= maxRound; n++) {
    const a = turns.find((t) => t.round === n && t.side === "A");
    const b = turns.find((t) => t.round === n && t.side === "B");
    rounds.push({
      n,
      // Generated turns carry their label; the still-thinking round derives
      // its own from the debate length.
      label: a?.label || b?.label || roundLabel(n, live.totalRounds || maxRound),
      a,
      b,
    });
  }

  return (
    <div className="vm-debate" ref={scrollRef}>
      <div className="vm-debate-head">
        <div className="vm-dh-top">
          <div className="vm-dh-q">
            <div className="kicker">The motion on the table</div>
            <h2>{debate.topic}</h2>
          </div>
          <div className="vm-dh-fighters">
            <Fighter persona={sideA} color={colorA} side="A" />
            <span className="vm-fighter-vs">VS</span>
            <Fighter persona={sideB} color={colorB} side="B" />
          </div>
        </div>
      </div>

      <div className="vm-rounds">
        <div className="vm-spine" />
        {rounds.map((r) => {
          const showThinkA =
            live.phase === "debating" &&
            live.thinkingRound === r.n &&
            live.thinkingSide === "A" &&
            !r.a;
          const showThinkB =
            live.phase === "debating" &&
            live.thinkingRound === r.n &&
            live.thinkingSide === "B" &&
            !r.b;
          return (
            <div className="vm-round" key={r.n}>
              <div className="vm-round-label">
                <span className="line" />
                <span className="chip">
                  <span className="n">Round {r.n}</span> · {r.label}
                </span>
                <span className="line" />
              </div>
              {r.a ? <Turn turn={r.a} persona={sideA} color={colorA} /> : null}
              {showThinkA ? <ThinkingBubble side="A" color={colorA} icon={sideA.icon} /> : null}
              {r.b ? <Turn turn={r.b} persona={sideB} color={colorB} /> : null}
              {showThinkB ? <ThinkingBubble side="B" color={colorB} icon={sideB.icon} /> : null}
            </div>
          );
        })}

        {live.phase === "judging" ? (
          <div className="vm-tojudge">
            <Avatar
              icon="gavel"
              color="linear-gradient(135deg, var(--brand-500), var(--brand-indigo-600))"
              size={52}
              glow="var(--brand-glow)"
            />
            <div className="vm-typing-label">
              <span className="pl" /> The Arbiter is weighing both sides…
            </div>
          </div>
        ) : null}

        {live.phase === "ready" || live.phase === "done" ? (
          <div className="vm-tojudge">
            <Avatar
              icon="gavel"
              color="linear-gradient(135deg, var(--brand-500), var(--brand-indigo-600))"
              size={56}
              glow="var(--brand-glow)"
            />
            <div className="lead">
              {live.phase === "ready" ? "Both sides rest." : "The debate is settled."}
            </div>
            <div className="sub">
              The Arbiter{" "}
              {live.phase === "ready" ? "has reached a verdict" : "ruled on this one"} —
              with a confidence level and the forks it hinged on.
            </div>
            <button className="vm-run" style={{ maxWidth: 320 }} onClick={onReveal}>
              <Ic name="gavel" />{" "}
              {live.phase === "ready" ? "Deliver the verdict" : "See the verdict"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
