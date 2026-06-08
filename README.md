# ⚖️ Verdict Master

**An AI decision arbiter.** Pose a hard decision and two AI personas argue it out — live, round by round, genuinely rebutting each other — then a third agent, **The Arbiter**, delivers a structured verdict: a ruling, a confidence level, the key forks it hinged on, the main risks, and what would change the call.

Built with **Next.js (App Router) + TypeScript** and the **Anthropic API**. Dark, purple‑anchored design system; responsive; real AI throughout.

> Made for people standing in front of a real decision — career, money, business, the personal stuff — who want to walk away with *clarity*, not two more opinions.

---

## ✨ Features

- **One focused input** — a single field ("What are you *wrestling with*?"), example dilemmas, and two persona slots.
- **Rich persona picker** — 8 characters (Skeptic, Optimist, Pragmatist, Visionary, Contrarian, Stoic, Strategist, Empath) with traits and blurbs, plus *write‑your‑own* voices.
- **Live, staggered debate** — rounds unfold down a central spine: cautious **Side A** (left) vs bold **Side B** (right). Each round is generated *with full prior context*, so the sides actually counter each other — complete with "↳ responding to…" tags and thinking‑dot beats for real debate tension.
- **The verdict payoff** — The Arbiter's ruling, a conic confidence ring, a lean pill, a summary, and three cards: *what it hinged on · main risks · what would change it*.
- **History** — every debate is saved to `localStorage` and reopenable from the left rail; seeded with two worked examples so the app is explorable immediately.
- **Tweaks** — a settings panel to recolor the two sides, set round count (2–4), adjust pacing, and toggle light/dark. Persisted locally.
- **Responsive** — collapses to a mobile layout with a slide‑in rail.

---

## 🧠 How it works

The Anthropic API caps each call's output, and — more importantly — **staged generation is what makes the debate feel alive.** Instead of one giant request, Verdict Master makes:

1. **One call per round.** Each round's prompt includes the full transcript so far, so Side B can attack Side A's *actual* last point, not a generic position. Side A always argues caution; Side B argues boldness; the chosen personas color the *voice*.
2. **One verdict call.** The Arbiter receives the complete transcript and returns a structured ruling.

Each round is generated, then revealed with a brief "thinking" beat — so you watch the argument develop rather than waiting for a wall of text. That few‑seconds‑per‑round latency *is* the live‑reveal effect.

All AI calls go through server‑side route handlers (`app/api/round`, `app/api/verdict`) so your **API key never reaches the browser**.

---

## 🚀 Getting started

### Prerequisites

- Node.js **18.18+**
- An **Anthropic API key** — create one at [console.anthropic.com](https://console.anthropic.com/settings/keys)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure your key
cp .env.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Without a key, the four screens and the sample history are fully browsable — starting a *new* debate will surface a clear "configure your key" message.

### Environment variables

| Variable            | Required | Default            | Notes                                                        |
| ------------------- | -------- | ------------------ | ------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | ✅       | —                  | Used **server‑side only**. Never exposed to the client.      |
| `VM_MODEL`          | —        | `claude-opus-4-8`  | Override the model used for generation (e.g. a faster tier). |

### Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm start       # serve the production build
```

---

## 🗂️ Project structure

```
app/
  api/
    round/route.ts      # POST → generate one debate round (server proxy)
    verdict/route.ts    # POST → generate the verdict (server proxy)
  globals.css           # font import + tokens.css + vm.css
  tokens.css            # design system tokens (colors, type, spacing, shadows)
  vm.css                # application styles
  icon.svg              # favicon (the scales logo)
  layout.tsx            # root layout + metadata
  page.tsx              # renders <App />
components/
  App.tsx               # root: routing, the staged debate runner, history, settings
  InputScreen.tsx       # the focused input + persona slots
  PersonaPicker.tsx     # the persona/custom-voice modal
  DebateScreen.tsx      # the live, staggered round-by-round dialogue
  VerdictScreen.tsx     # the verdict payoff (ring, lean pill, three cards)
  SettingsPanel.tsx     # side colors / rounds / pacing / theme (localStorage)
  Icon.tsx, Avatar.tsx  # shared primitives
lib/
  types.ts              # shared TypeScript types
  data.ts               # personas, judge, round labels, sample history
  icons.ts              # Lucide-style icon markup
  debate-prompts.ts     # prompt construction + defensive response parsing (pure)
  anthropic.ts          # server-side Anthropic client + retry (server only)
  debate-api.ts         # client fetch wrappers for the API routes
```

---

## 🎨 Design

The UI is a faithful implementation of a design mocked up in **Claude Design** and handed off as an HTML/CSS/JS prototype. The visual system — dark canvas, purple brand anchor, **Syne** (display) + **Outfit** (UI) typefaces, glow‑based elevation, two‑hued debate spine — is preserved 1:1; the prototype's in‑browser React/Babel was rebuilt as a production Next.js + TypeScript app with a real Anthropic backend.

---

## 📝 License

MIT — do whatever you like.

---

<sub>Two minds argue. One judge rules. You decide.</sub>
