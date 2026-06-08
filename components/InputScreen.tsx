"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Side } from "@/lib/types";
import { Ic } from "./Icon";
import { PersonaPicker } from "./PersonaPicker";

const VM_EXAMPLES = [
  "Should I leave my stable job to go all-in on my side project?",
  "Take the higher salary, or the role with better growth and worse pay?",
  "Should we raise a bigger round now, or stay lean and keep control?",
  "Do I move across the country for this relationship?",
];

function SlotButton({
  side,
  persona,
  color,
  onClick,
}: {
  side: "A" | "B";
  persona: Side | null;
  color: string;
  onClick: () => void;
}) {
  const filled = !!persona;
  return (
    <button
      className={"vm-slot" + (filled ? " filled" : "")}
      style={{ "--slot-c": color } as CSSProperties}
      onClick={onClick}
    >
      {filled ? (
        <div
          className="vm-slot-av"
          style={{
            background: color,
            boxShadow: "0 0 16px color-mix(in srgb, " + color + " 35%, transparent)",
          }}
        >
          <Ic name={persona!.icon} />
        </div>
      ) : (
        <div className="vm-slot-av empty">
          <Ic name="plus" />
        </div>
      )}
      <div className="vm-slot-meta">
        <div
          className="vm-slot-side"
          style={{
            color: filled
              ? "color-mix(in srgb, " + color + " 80%, var(--fg-30))"
              : undefined,
          }}
        >
          Side {side} · {side === "A" ? "cautious" : "bold"}
        </div>
        {filled ? (
          <>
            <div className="vm-slot-name">{persona!.name}</div>
            <div className="vm-slot-role">
              {persona!.custom ? persona!.stance : persona!.role}
            </div>
          </>
        ) : (
          <div className="vm-slot-empty-txt">Choose a debater</div>
        )}
      </div>
    </button>
  );
}

export function InputScreen({
  topic,
  setTopic,
  sideA,
  sideB,
  onSetSide,
  onRun,
}: {
  topic: string;
  setTopic: (t: string) => void;
  sideA: Side | null;
  sideB: Side | null;
  onSetSide: (side: "A" | "B", persona: Side) => void;
  onRun: () => void;
}) {
  const [picker, setPicker] = useState<"A" | "B" | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(132, ta.scrollHeight) + "px";
  }, [topic]);

  const ready = topic.trim().length > 3 && !!sideA && !!sideB;

  return (
    <div className="vm-input-wrap">
      <div className="vm-input-inner">
        <div className="vm-input-head">
          <div className="vm-eyebrow">
            <Ic name="swords" /> The unfair fight, evened up
          </div>
          <h1>
            What are you <span className="grad">wrestling with</span>?
          </h1>
          <p>
            Lay out the decision. Two AI minds will argue it out, round by round —
            then a judge rules with a confidence level, the key forks, and what
            would change the call.
          </p>
        </div>

        <div className="vm-field">
          <textarea
            ref={taRef}
            value={topic}
            placeholder="Type the dilemma in your own words… the messier and more specific, the better."
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ready) onRun();
            }}
          />
        </div>

        {!topic.trim() && (
          <div className="vm-examples">
            {VM_EXAMPLES.map((ex) => (
              <button key={ex} className="vm-ex-chip" onClick={() => setTopic(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}

        <div className="vm-vs-row">
          <SlotButton side="A" persona={sideA} color="var(--side-a)" onClick={() => setPicker("A")} />
          <div className="vm-vs-badge">VS</div>
          <SlotButton side="B" persona={sideB} color="var(--side-b)" onClick={() => setPicker("B")} />
        </div>

        <button className="vm-run" disabled={!ready} onClick={onRun}>
          <Ic name="swords" /> Start the debate
        </button>
        <div className="vm-run-hint">
          Two agents debate live · a third delivers the verdict · ⌘↵ to run
        </div>
      </div>

      {picker && (
        <PersonaPicker
          side={picker}
          sideColor={picker === "A" ? "var(--side-a)" : "var(--side-b)"}
          currentId={picker === "A" ? sideA?.personaId : sideB?.personaId}
          excludeId={picker === "A" ? sideB?.personaId : sideA?.personaId}
          onPick={(p) => {
            onSetSide(picker, p);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
