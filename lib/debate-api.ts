// Verdict Master — client-side API: calls the server proxy routes that hold the
// Anthropic key. Mirrors the staged generation of the design (one call per round
// + a verdict call), so each side genuinely rebuts the prior rounds.
import type {
  RoundRequest,
  VerdictRequest,
  RoundUtterance,
  Verdict,
} from "./types";

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "The request to the AI failed.";
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      /* ignore — use the default message */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function generateRound(
  opts: RoundRequest
): Promise<{ a: RoundUtterance; b: RoundUtterance }> {
  return postJSON("/api/round", opts);
}

export function generateVerdict(opts: VerdictRequest): Promise<Verdict> {
  return postJSON("/api/verdict", opts);
}
