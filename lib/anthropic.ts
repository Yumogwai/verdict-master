// Verdict Master — server-side Anthropic integration.
// This module must only be imported from server code (route handlers).
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.VM_MODEL || "claude-opus-4-8";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured on the server. Copy .env.example to .env.local and add your key."
    );
  }
  if (!cached) cached = new Anthropic({ apiKey });
  return cached;
}

/**
 * Run a single prompt and return the model's text output.
 * Thinking is disabled so generation stays snappy for the live, round-by-round
 * reveal and the short structured outputs never get truncated by thinking tokens.
 */
export async function completeText(prompt: string, maxTokens = 1024): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "disabled" },
    messages: [{ role: "user", content: prompt }],
  });
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/** Run a prompt and parse it, retrying once on malformed/transient output. */
export async function generate<T>(
  prompt: string,
  parse: (raw: string) => T,
  attempts = 2,
  maxTokens = 1024
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return parse(await completeText(prompt, maxTokens));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Generation failed.");
}
