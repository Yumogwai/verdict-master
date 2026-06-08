"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { PERSONAS } from "@/lib/data";
import type { Side } from "@/lib/types";
import { Ic } from "./Icon";

type Selection =
  | { type: "preset"; id: string }
  | { type: "custom" }
  | null;

export function PersonaPicker({
  side,
  sideColor,
  currentId,
  excludeId,
  onPick,
  onClose,
}: {
  side: "A" | "B";
  sideColor: string;
  currentId?: string | null;
  excludeId?: string | null;
  onPick: (side: Side) => void;
  onClose: () => void;
}) {
  const personas = PERSONAS;
  const initial: Selection =
    currentId && currentId !== "custom" ? { type: "preset", id: currentId } : null;
  const [sel, setSel] = useState<Selection>(initial);
  const [customName, setCustomName] = useState("");
  const [customStance, setCustomStance] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isCustomValid = customName.trim() && customStance.trim();
  const canConfirm =
    (sel && sel.type === "preset") ||
    (sel && sel.type === "custom" && isCustomValid);

  function confirm() {
    if (sel && sel.type === "preset") {
      const p = personas.find((x) => x.id === sel.id);
      if (!p) return;
      onPick({
        personaId: p.id,
        name: p.name,
        role: p.role,
        icon: p.icon,
        hue: p.hue,
        traits: p.traits,
        blurb: p.blurb,
      });
    } else if (sel && sel.type === "custom" && isCustomValid) {
      onPick({
        personaId: "custom",
        custom: true,
        name: customName.trim(),
        role: "Custom voice",
        icon: "pen",
        hue: sideColor,
        stance: customStance.trim(),
      });
    }
  }

  return (
    <div
      className="vm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="vm-modal" style={{ "--slot-c": sideColor } as CSSProperties}>
        <div className="vm-modal-head">
          <div>
            <h3>Cast the {side === "A" ? "cautious" : "bold"} voice</h3>
            <div className="sub">
              Side {side} argues the{" "}
              {side === "A" ? "“protect the downside”" : "“seize the upside”"} case.
              Pick its character.
            </div>
          </div>
          <button className="vm-x" onClick={onClose} aria-label="Close">
            <Ic name="x" />
          </button>
        </div>
        <div className="vm-modal-body">
          <div className="vm-persona-grid">
            {personas.map((p) => {
              const disabled = p.id === excludeId;
              const selected = sel?.type === "preset" && sel.id === p.id;
              return (
                <button
                  key={p.id}
                  className={"vm-pcard" + (selected ? " sel" : "")}
                  style={
                    {
                      "--pc": p.hue,
                      opacity: disabled ? 0.32 : 1,
                      pointerEvents: disabled ? "none" : "auto",
                    } as CSSProperties
                  }
                  onClick={() => setSel({ type: "preset", id: p.id })}
                >
                  <div className="vm-pcard-av" style={{ background: p.hue }}>
                    <Ic name={p.icon} />
                  </div>
                  <div className="vm-pcard-meta">
                    <div className="vm-pcard-name">{p.name}</div>
                    <div className="vm-pcard-role">{p.role}</div>
                    <div className="vm-pcard-blurb">{p.blurb}</div>
                    <div className="vm-pcard-traits">
                      {p.traits.map((t) => (
                        <span key={t} className="vm-trait">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div
            className="vm-custom-row"
            style={{
              borderColor:
                sel?.type === "custom"
                  ? "color-mix(in srgb, " + sideColor + " 45%, transparent)"
                  : undefined,
            }}
            onClick={() => setSel({ type: "custom" })}
          >
            <div className="lbl">
              <Ic name="pen" /> Or write your own voice
            </div>
            <input
              className="vm-input"
              placeholder="Name — e.g. My inner critic, Future me, A trusted mentor"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSel({ type: "custom" });
              }}
            />
            <input
              className="vm-input"
              placeholder="How does it think? e.g. ruthlessly weighs money and time, no sentimentality"
              value={customStance}
              onChange={(e) => {
                setCustomStance(e.target.value);
                setSel({ type: "custom" });
              }}
            />
          </div>
        </div>
        <div className="vm-modal-foot">
          <button className="vm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="vm-btn-primary" disabled={!canConfirm} onClick={confirm}>
            Set side {side}
          </button>
        </div>
      </div>
    </div>
  );
}
