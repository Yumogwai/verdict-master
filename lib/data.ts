// Verdict Master — static data: personas, judge, round labels, sample history.
import type { Persona, Debate } from "./types";

export const PERSONAS: Persona[] = [
  {
    id: "skeptic",
    name: "The Skeptic",
    role: "Cautious analyst",
    icon: "shield",
    hue: "#60a5fa",
    traits: ["Risk-averse", "Evidence-first", "Devil’s advocate"],
    blurb: "Pressure-tests every claim. Assumes the downside until proven otherwise.",
  },
  {
    id: "optimist",
    name: "The Optimist",
    role: "Bold believer",
    icon: "rocket",
    hue: "#fbbf24",
    traits: ["Upside-seeking", "Decisive", "High-momentum"],
    blurb: "Hunts the asymmetric bet. Believes the cost of inaction is the real risk.",
  },
  {
    id: "pragmatist",
    name: "The Pragmatist",
    role: "Cold realist",
    icon: "scale",
    hue: "#a1a1aa",
    traits: ["Trade-offs", "Constraints", "ROI-driven"],
    blurb: "Lives in the real world of time, money and energy. No theory without a cost.",
  },
  {
    id: "visionary",
    name: "The Visionary",
    role: "Long-game thinker",
    icon: "compass",
    hue: "#a78bfa",
    traits: ["10-year view", "Second-order", "Ambition"],
    blurb: "Zooms out to the decade. Cares where the road bends, not the next step.",
  },
  {
    id: "contrarian",
    name: "The Contrarian",
    role: "Pattern-breaker",
    icon: "zap",
    hue: "#fb7185",
    traits: ["Inverts assumptions", "Provocative", "Unflinching"],
    blurb: "Attacks the consensus on principle. If everyone agrees, someone is wrong.",
  },
  {
    id: "stoic",
    name: "The Stoic",
    role: "Calm operator",
    icon: "anchor",
    hue: "#22d3ee",
    traits: ["Equanimity", "Downside focus", "Discipline"],
    blurb: "Strips emotion from the call. Asks what you control and what you can endure.",
  },
  {
    id: "strategist",
    name: "The Strategist",
    role: "Chessmaster",
    icon: "target",
    hue: "#c084fc",
    traits: ["Game theory", "Leverage", "Positioning"],
    blurb: "Plays the board, not the move. Hunts leverage and second-mover advantage.",
  },
  {
    id: "empath",
    name: "The Empath",
    role: "Human-first",
    icon: "heart",
    hue: "#34d399",
    traits: ["Values", "Relationships", "Wellbeing"],
    blurb: "Weighs the human cost. Asks who is affected and how you’ll feel in a year.",
  },
];

export const JUDGE = {
  name: "The Arbiter",
  role: "Impartial judge",
  icon: "gavel",
  blurb:
    "Hears both sides, weighs the evidence, and rules with a confidence level — not a coin flip.",
};

export const ROUND_LABELS = [
  "Opening statements",
  "Rebuttal",
  "Closing arguments",
  "Final exchange",
  "Last word",
];

export function personaById(id: string): Persona | null {
  return PERSONAS.find((p) => p.id === id) || null;
}

const HOUR = 1000 * 60 * 60;

// Sample history so the product is explorable without spending API calls.
export const SAMPLE_HISTORY: Debate[] = [
  {
    id: "sample-1",
    createdAt: Date.now() - HOUR * 26,
    sample: true,
    status: "complete",
    topic:
      "I have a stable $180k job. A pre-seed startup offered me a co-founder seat — half the cash, 8% equity. Do I jump?",
    sideA: { personaId: "skeptic", name: "The Skeptic", role: "Cautious analyst", icon: "shield", hue: "#60a5fa" },
    sideB: { personaId: "optimist", name: "The Optimist", role: "Bold believer", icon: "rocket", hue: "#fbbf24" },
    rounds: [
      {
        n: 1,
        label: "Opening statements",
        a: { text: "Eight percent of nothing is nothing. Pre-seed startups fail ~90% of the time, and you’d be trading a guaranteed $180k for a coin flip with worse odds than a coin. Run the math before the dream.", reactsTo: "" },
        b: { text: "You’re pricing the equity at zero and the salary at full value — that’s the staff-job bias talking. A co-founder seat is optionality you can never buy back later. The real risk is waking up at 45 having only ever rented your time.", reactsTo: "" },
      },
      {
        n: 2,
        label: "Rebuttal",
        a: { text: 'Optionality is a nice word for "unpaid". Halving cash isn’t a rounding error — it resets savings, runway, and leverage in every future negotiation. You can take asymmetric bets without setting fire to the floor you’re standing on.', reactsTo: "optionality" },
        b: { text: "Then de-risk it instead of refusing it. Six months of expenses in the bank turns this from a gamble into a tuition payment. The skills, network and equity compound whether or not this exact company wins.", reactsTo: "fire to the floor" },
      },
      {
        n: 3,
        label: "Closing arguments",
        a: { text: "My case is simple: don’t bet what you can’t afford to lose, and only bet on a hand you’ve actually seen. Diligence the founders and the cap table first; the seat will still be there next week if it’s real.", reactsTo: "" },
        b: { text: "And mine: regret compounds faster than money. If the founders and the market check out, the asymmetry is exactly the kind you’re supposed to take while you’re young enough to recover. Jump — with a parachute, not blind.", reactsTo: "" },
      },
    ],
    verdict: {
      leaning: "B",
      decision: "Lean yes — but make it conditional, not a leap of faith.",
      confidence: 64,
      summary:
        'The upside case wins on asymmetry and timing, but only once the Skeptic’s guardrails are in place. This is a "yes, if" — not a "yes".',
      forks: [
        "Do the founders and the cap table survive real diligence?",
        "Can you build 6–12 months of personal runway before joining?",
        "Is this a market you’d bet a decade of your career on?",
      ],
      risks: [
        "Halved cash resets your savings and weakens every future salary negotiation.",
        "Pre-seed base rates are brutal — most of these companies do not survive 3 years.",
        "Co-founder conflict is the #1 killer; you have not stress-tested the relationship.",
      ],
      changes: [
        "If diligence reveals a weak or evasive founding team → flips to a clear no.",
        "If you have <3 months runway and dependents → flips to no for now.",
        "If they matched cash or offered 12%+ → confidence jumps to ~80%.",
      ],
    },
  },
  {
    id: "sample-2",
    createdAt: Date.now() - HOUR * 73,
    sample: true,
    status: "complete",
    topic:
      "Should I move to a new city for a relationship before either of us has a job lined up there?",
    sideA: { personaId: "stoic", name: "The Stoic", role: "Calm operator", icon: "anchor", hue: "#22d3ee" },
    sideB: { personaId: "empath", name: "The Empath", role: "Human-first", icon: "heart", hue: "#34d399" },
    rounds: [
      {
        n: 1,
        label: "Opening statements",
        a: { text: "Separate what you control from what you don’t. You control your finances, your skills and your timeline; you do not control how this relationship turns out. Moving with no job ties your stability to a variable you can’t steer.", reactsTo: "" },
        b: { text: "You can’t spreadsheet a life. People who optimise for safety over connection are the ones who write the wistful essays at 50. Some bets are about who you become, not what you can endure if it fails.", reactsTo: "" },
      },
      {
        n: 2,
        label: "Rebuttal",
        a: { text: "I’m not arguing against the relationship — I’m arguing against doing it from a position of weakness. Land remote work or a 2-month buffer first. Love survives a delayed move; resentment from financial panic often doesn’t.", reactsTo: "spreadsheet a life" },
        b: { text: 'Fair — but indefinite "later" is how people stay in the wrong city for a decade. Set a date, not a condition. The discomfort of the leap is the point; growth rarely arrives pre-funded.', reactsTo: "position of weakness" },
      },
      {
        n: 3,
        label: "Closing arguments",
        a: { text: "Make the move — but make it deliberate. A funded, time-boxed move is courage; an unfunded one is just anxiety with a moving truck. Protect the relationship by protecting yourself first.", reactsTo: "" },
        b: { text: "Move, and let it cost you something. Give it a real date, a shared plan, and an honest conversation about money. The relationship deserves a decision, not a permanent maybe.", reactsTo: "" },
      },
    ],
    verdict: {
      leaning: "split",
      decision: "Yes — but only with a date and a runway, never on hope alone.",
      confidence: 58,
      summary:
        "Both sides actually converge: the move is worth making, but the unfunded, open-ended version is the one to reject. Commit to it, then engineer the safety.",
      forks: [
        "Can you secure remote income or a 2–3 month financial buffer first?",
        "Are you both treating this as a shared decision with a real date?",
        "Have you had the explicit money-and-expectations conversation?",
      ],
      risks: [
        "Financial panic after the move can poison the very relationship you moved for.",
        "An open-ended \"later\" can quietly become never — or a decade in the wrong place.",
        "Tying self-worth to one outcome you don’t fully control.",
      ],
      changes: [
        "If you can lock remote work before moving → confidence jumps to ~80%.",
        "If your partner won’t commit to a shared plan/date → flips toward no.",
        "If you have zero buffer and high debt → delay until you do.",
      ],
    },
  },
];
