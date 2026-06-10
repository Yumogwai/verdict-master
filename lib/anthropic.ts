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
 * The `thinking` param is deliberately omitted (= no thinking on the current
 * lineup) so generation stays snappy for the live, round-by-round reveal and
 * the short structured outputs never get truncated by thinking tokens.
 * Omitting — rather than sending an explicit "disabled" — keeps VM_MODEL
 * overrides working on models where an explicit disable is rejected.
 */
export async function completeText(prompt: string, maxTokens = 1024): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/** Errors a retry cannot fix: bad key, bad model, malformed request, missing config. */
function isFatal(err: unknown): boolean {
  if (err instanceof Anthropic.APIError) {
    return [400, 401, 403, 404, 413].includes(err.status ?? 0);
  }
  return err instanceof Error && err.message.startsWith("ANTHROPIC_API_KEY");
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
      if (isFatal(err)) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Generation failed.");
}

/**
 * Map a generation error to an HTTP status and a message that is safe and
 * useful to show in the UI (configuration problems say so; transient AI-side
 * problems suggest retrying; anything else falls back to the route's message).
 */
export function describeGenerationError(
  err: unknown,
  fallback: string
): { status: number; message: string } {
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    if (status === 401 || status === 403) {
      return {
        status: 500,
        message:
          "The server's Anthropic API key is invalid or unauthorized. Check ANTHROPIC_API_KEY.",
      };
    }
    if (status === 404) {
      return {
        status: 500,
        message: 'The configured model "' + MODEL + '" was not found. Check VM_MODEL.',
      };
    }
    if (status === 429) {
      return {
        status: 503,
        message: "The AI service is rate-limited right now — wait a moment and try again.",
      };
    }
    if (status >= 500) {
      return {
        status: 503,
        message: "The AI service is briefly overloaded — try again in a moment.",
      };
    }
  }
  if (err instanceof Error && err.message.startsWith("ANTHROPIC_API_KEY")) {
    return { status: 500, message: err.message };
  }
  return { status: 500, message: fallback };
}
