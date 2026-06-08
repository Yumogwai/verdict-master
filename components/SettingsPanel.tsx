"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Ic } from "./Icon";

export interface Settings {
  sides: [string, string];
  rounds: number;
  pace: number;
  theme: "dark" | "light";
}

export const DEFAULT_SETTINGS: Settings = {
  sides: ["#a855f7", "#22d3ee"],
  rounds: 3,
  pace: 1,
  theme: "dark",
};

const SIDE_PRESETS: [string, string][] = [
  ["#a855f7", "#22d3ee"],
  ["#a855f7", "#fbbf24"],
  ["#60a5fa", "#fb7185"],
  ["#34d399", "#fb7185"],
  ["#c084fc", "#34d399"],
];

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const sideKey = settings.sides.join("|");

  return (
    <div ref={wrapRef}>
      {open && (
        <div className="vm-settings" role="dialog" aria-label="Settings">
          <div className="vm-settings-title">
            <Ic name="sliders" /> Tweaks
          </div>

          <div className="vm-set-row">
            <div className="lbl">The two sides</div>
            <div className="vm-set-colors">
              {SIDE_PRESETS.map((preset) => {
                const on = preset.join("|") === sideKey;
                return (
                  <button
                    key={preset.join("|")}
                    className={"vm-set-color" + (on ? " on" : "")}
                    aria-label={preset.join(" vs ")}
                    title={preset.join(" · ")}
                    onClick={() => onChange({ sides: preset })}
                  >
                    <span style={{ background: preset[0] }} />
                    <span style={{ background: preset[1] }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="vm-set-row">
            <div className="lbl">Rounds</div>
            <div className="vm-seg">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={settings.rounds === n ? "on" : ""}
                  onClick={() => onChange({ rounds: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="vm-set-row">
            <div className="lbl">
              Pacing <span className="val">{settings.pace.toFixed(1)}×</span>
            </div>
            <input
              className="vm-set-range"
              type="range"
              min={0.4}
              max={1.8}
              step={0.1}
              value={settings.pace}
              onChange={(e) => onChange({ pace: Number(e.target.value) })}
            />
          </div>

          <div className="vm-set-row">
            <div className="lbl">Theme</div>
            <div className="vm-seg">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  className={settings.theme === t ? "on" : ""}
                  onClick={() => onChange({ theme: t })}
                  style={{ textTransform: "capitalize" } as CSSProperties}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        className={"vm-fab" + (open ? " on" : "")}
        aria-label="Tweaks"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Ic name="sliders" />
      </button>
    </div>
  );
}
