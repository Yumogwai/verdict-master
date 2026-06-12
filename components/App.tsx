"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Debate, LiveState, Round, Side, Turn, Verdict } from "@/lib/types";
import {
  SAMPLE_HISTORY,
  roundLabel,
  personaById,
} from "@/lib/data";
import { generateRound, generateVerdict } from "@/lib/debate-api";
import { Ic } from "./Icon";
import { InputScreen } from "./InputScreen";
import { DebateScreen } from "./DebateScreen";
import { VerdictScreen } from "./VerdictScreen";
import {
  SettingsPanel,
  DEFAULT_SETTINGS,
  type Settings,
} from "./SettingsPanel";

const VM_STORE_KEY = "vm_history_v1";
const VM_SETTINGS_KEY = "vm_settings_v1";

function defaultSide(id: string): Side {
  const p = personaById(id)!;
  return {
    personaId: p.id,
    name: p.name,
    role: p.role,
    icon: p.icon,
    hue: p.hue,
    traits: p.traits,
    blurb: p.blurb,
  };
}
const VM_DEFAULT_A = defaultSide("skeptic");
const VM_DEFAULT_B = defaultSide("optimist");

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 7) return d + "d ago";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function persistHistory(list: Debate[]) {
  try {
    localStorage.setItem(VM_STORE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Shape-check a persisted debate so corrupted storage can't crash the UI. */
function isSavedDebate(d: unknown): d is Debate {
  if (!d || typeof d !== "object") return false;
  const x = d as Record<string, any>;
  return (
    typeof x.id === "string" &&
    typeof x.topic === "string" &&
    !!x.sideA &&
    typeof x.sideA.name === "string" &&
    !!x.sideB &&
    typeof x.sideB.name === "string" &&
    Array.isArray(x.rounds)
  );
}

function liveFromDebate(debate: Debate): LiveState {
  const turns: Turn[] = [];
  (debate.rounds || []).forEach((r) => {
    turns.push({ round: r.n, label: r.label, side: "A", text: r.a.text, reactsTo: r.a.reactsTo || "" });
    turns.push({ round: r.n, label: r.label, side: "B", text: r.b.text, reactsTo: r.b.reactsTo || "" });
  });
  return {
    turns,
    thinkingRound: 0,
    thinkingSide: null,
    totalRounds: (debate.rounds || []).length,
    phase: "done",
    error: null,
  };
}

function HistoryItem({
  debate,
  active,
  onClick,
  onDelete,
}: {
  debate: Debate;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const v = debate.verdict;
  let leanColor = "var(--brand-400)";
  let leanTxt = "Split";
  if (v?.leaning === "A") {
    leanColor = "var(--side-a)";
    leanTxt = "Caution";
  } else if (v?.leaning === "B") {
    leanColor = "var(--side-b)";
    leanTxt = "Bold";
  }
  return (
    <div
      className={"vm-hist-item" + (active ? " active" : "")}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="vm-hist-top">
        <div className="vm-hist-faces">
          <span className="f" style={{ background: "var(--side-a)" }}>
            <Ic name={debate.sideA.icon} />
          </span>
          <span className="f" style={{ background: "var(--side-b)" }}>
            <Ic name={debate.sideB.icon} />
          </span>
        </div>
        {onDelete ? (
          <button
            className="vm-hist-del"
            title="Delete this debate"
            aria-label="Delete this debate"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Ic name="trash" />
          </button>
        ) : null}
      </div>
      <div className="q">{debate.topic}</div>
      <div className="vm-hist-meta">
        <span className="vm-hist-verdict" style={{ color: leanColor }}>
          <Ic name="dot" style={{ width: 9, height: 9 }} />
          {leanTxt} · {v ? v.confidence : "—"}%
        </span>
        <span className="vm-hist-time">
          {debate.sample ? "Example" : timeAgo(debate.createdAt)}
        </span>
      </div>
    </div>
  );
}

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<"input" | "debate" | "verdict">("input");
  const [topic, setTopic] = useState("");
  const [sideA, setSideA] = useState<Side | null>(VM_DEFAULT_A);
  const [sideB, setSideB] = useState<Side | null>(VM_DEFAULT_B);
  const [current, setCurrent] = useState<Debate | null>(null);
  const [live, setLive] = useState<LiveState>({
    turns: [],
    thinkingRound: 0,
    thinkingSide: null,
    totalRounds: 0,
    phase: "idle",
    error: null,
  });
  const [userHistory, setUserHistory] = useState<Debate[]>([]);
  const [railOpen, setRailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const runIdRef = useRef(0);

  // Load persisted state on mount (client only — avoids SSR/hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VM_SETTINGS_KEY);
      if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(VM_STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setUserHistory(parsed.filter(isSavedDebate));
      }
    } catch {
      /* ignore */
    }
    const onResize = () => setIsMobile(window.innerWidth <= 860);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Apply settings to :root and persist them.
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--side-a", settings.sides[0]);
    r.style.setProperty("--side-b", settings.sides[1]);
    r.style.setProperty("--pace", String(settings.pace));
    if (settings.theme === "light") r.classList.add("light");
    else r.classList.remove("light");
    try {
      localStorage.setItem(VM_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const roundsCount = Math.max(2, Math.min(4, settings.rounds || 3));

  const allHistory = useMemo(
    () => userHistory.concat(SAMPLE_HISTORY),
    [userHistory]
  );

  function saveDebate(debate: Debate) {
    setUserHistory((prev) => {
      const next = [debate]
        .concat(prev.filter((d) => d.id !== debate.id))
        .slice(0, 40);
      persistHistory(next);
      return next;
    });
  }

  async function runDebate(debate: Debate) {
    const myId = ++runIdRef.current;
    const total = roundsCount;
    const pace = Number(settings.pace) || 1;
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const stale = () => myId !== runIdRef.current;

    setCurrent(debate);
    setView("debate");
    setRailOpen(false);
    setLive({
      turns: [],
      thinkingRound: 1,
      thinkingSide: "A",
      totalRounds: total,
      phase: "debating",
      error: null,
    });

    const history: Round[] = [];
    const turns: Turn[] = [];
    try {
      for (let n = 1; n <= total; n++) {
        const label = roundLabel(n, total);
        if (stale()) return;
        setLive((L) => ({ ...L, phase: "debating", thinkingRound: n, thinkingSide: "A" }));
        const round = await generateRound({
          topic: debate.topic,
          sideA: debate.sideA,
          sideB: debate.sideB,
          roundNum: n,
          totalRounds: total,
          history,
        });
        if (stale()) return;
        history.push({ n, label, a: round.a, b: round.b });
        turns.push({ round: n, label, side: "A", text: round.a.text, reactsTo: round.a.reactsTo });
        setLive((L) => ({ ...L, turns: turns.slice(), thinkingSide: null }));
        await sleep(820 * pace);
        if (stale()) return;
        setLive((L) => ({ ...L, thinkingRound: n, thinkingSide: "B" }));
        await sleep(640 * pace);
        if (stale()) return;
        turns.push({ round: n, label, side: "B", text: round.b.text, reactsTo: round.b.reactsTo });
        setLive((L) => ({ ...L, turns: turns.slice(), thinkingSide: null }));
        await sleep(780 * pace);
      }
      if (stale()) return;
      setLive((L) => ({ ...L, phase: "judging", thinkingSide: null }));
      const verdict: Verdict = await generateVerdict({
        topic: debate.topic,
        sideA: debate.sideA,
        sideB: debate.sideB,
        history,
      });
      if (stale()) return;
      const finished: Debate = {
        ...debate,
        rounds: history.map((h) => ({ n: h.n, label: h.label, a: h.a, b: h.b })),
        verdict,
        status: "complete",
      };
      saveDebate(finished);
      setCurrent(finished);
      setLive((L) => ({ ...L, phase: "ready" }));
    } catch (e) {
      if (stale()) return;
      const message =
        e instanceof Error ? e.message : "The debate could not be generated.";
      setLive((L) => ({ ...L, phase: "error", error: message }));
    }
  }

  function startDebate() {
    if (!topic.trim() || !sideA || !sideB) return;
    const debate: Debate = {
      id: "d-" + Date.now(),
      createdAt: Date.now(),
      topic: topic.trim(),
      sideA,
      sideB,
      rounds: [],
      verdict: null,
      status: "debating",
    };
    runDebate(debate);
  }

  function newDebate() {
    runIdRef.current++;
    setCurrent(null);
    setLive({
      turns: [],
      thinkingRound: 0,
      thinkingSide: null,
      totalRounds: 0,
      phase: "idle",
      error: null,
    });
    setView("input");
    setRailOpen(false);
  }

  function openHistory(debate: Debate) {
    runIdRef.current++;
    setCurrent(debate);
    setLive(liveFromDebate(debate));
    setView("verdict");
    setRailOpen(false);
  }

  function retry() {
    if (current) runDebate(current);
  }

  function deleteDebate(id: string) {
    setUserHistory((prev) => {
      const next = prev.filter((d) => d.id !== id);
      persistHistory(next);
      return next;
    });
    if (current && current.id === id) newDebate();
  }

  function clearHistory() {
    if (!window.confirm("Delete all saved debates? The two examples stay.")) return;
    setUserHistory([]);
    persistHistory([]);
    // Reset the stage only when it shows a now-deleted saved debate — never
    // interrupt a debate that is still being generated (it isn't saved yet).
    const running = live.phase === "debating" || live.phase === "judging";
    if (current && !current.sample && !running) newDebate();
  }

  /** Same dilemma, opposite casting: each voice now argues the other case. */
  function rematch(debate: Debate) {
    runDebate({
      id: "d-" + Date.now(),
      createdAt: Date.now(),
      topic: debate.topic,
      sideA: debate.sideB,
      sideB: debate.sideA,
      rounds: [],
      verdict: null,
      status: "debating",
    });
  }

  // ── render the active screen ──
  let screen: React.ReactNode = null;
  if (view === "input") {
    screen = (
      <InputScreen
        topic={topic}
        setTopic={setTopic}
        sideA={sideA}
        sideB={sideB}
        onSetSide={(side, p) => {
          if (side === "A") setSideA(p);
          else setSideB(p);
        }}
        onRun={startDebate}
      />
    );
  } else if (view === "debate") {
    if (live.phase === "error") {
      screen = (
        <div className="vm-error">
          <div className="ic">
            <Ic name="alert" />
          </div>
          <h3>The debate stalled</h3>
          <p>
            {live.error ||
              "The AI advisors couldn’t be reached, or the response came back malformed."}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="vm-btn-secondary" onClick={newDebate}>
              Start over
            </button>
            <button className="vm-btn-primary" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      );
    } else if (current) {
      screen = (
        <DebateScreen
          debate={current}
          live={live}
          onReveal={() => setView("verdict")}
        />
      );
    }
  } else if (view === "verdict" && current && current.verdict) {
    const debate = current;
    screen = (
      <VerdictScreen
        debate={debate}
        saved={!debate.sample}
        onBack={() => setView("debate")}
        onNew={newDebate}
        onRematch={() => rematch(debate)}
      />
    );
  }

  return (
    <div className="vm-app">
      {isMobile && railOpen ? (
        <div className="vm-scrim" onClick={() => setRailOpen(false)} />
      ) : null}
      <aside className={"vm-rail" + (railOpen ? " open" : "")}>
        <div className="vm-brand">
          <div className="vm-logo">
            <Ic name="scale" />
          </div>
          <div>
            <div className="wm">
              Verdict<span className="b">Master</span>
            </div>
            <div className="tag">AI decision arbiter</div>
          </div>
        </div>
        <button className="vm-newbtn" onClick={newDebate}>
          <Ic name="plus" /> New debate
        </button>
        <div className="vm-rail-label">
          History
          {userHistory.length > 0 ? (
            <button
              className="vm-rail-clear"
              onClick={clearHistory}
              title="Delete all saved debates"
            >
              Clear
            </button>
          ) : null}
          <span className="ct">{allHistory.length}</span>
        </div>
        <div className="vm-history">
          {allHistory.length === 0 ? (
            <div className="vm-hist-empty">
              No debates yet. Pose a dilemma and watch it get argued out.
            </div>
          ) : (
            allHistory.map((d) => (
              <HistoryItem
                key={d.id}
                debate={d}
                active={!!current && current.id === d.id}
                onClick={() => openHistory(d)}
                onDelete={d.sample ? undefined : () => deleteDebate(d.id)}
              />
            ))
          )}
        </div>
        <div className="vm-rail-foot">
          Two minds argue. One judge rules. You decide.
        </div>
      </aside>

      <main className="vm-main">
        <div className="vm-stage-bg" />
        {isMobile ? (
          <div className="vm-topbar">
            <button className="mbtn" onClick={() => setRailOpen(true)} aria-label="Menu">
              <Ic name="panelLeft" />
            </button>
            <div className="vm-logo" style={{ width: 30, height: 30 }}>
              <Ic name="scale" />
            </div>
            <div className="tt">
              Verdict<span style={{ color: "var(--brand-400)" }}>Master</span>
            </div>
          </div>
        ) : null}
        {screen}
      </main>

      <SettingsPanel
        settings={settings}
        onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
      />
    </div>
  );
}
