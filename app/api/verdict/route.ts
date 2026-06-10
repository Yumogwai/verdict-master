import { NextRequest, NextResponse } from "next/server";
import { generate, describeGenerationError } from "@/lib/anthropic";
import { buildVerdictPrompt, parseVerdict } from "@/lib/debate-prompts";
import { parseVerdictRequest } from "@/lib/validate";
import { rateLimit, clientId } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientId(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Easy there — too many debates at once. Try again in ~" + limit.retryAfterSec + "s." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = parseVerdictRequest(raw);
  if (!body) {
    return NextResponse.json(
      { error: "Missing or invalid topic, debaters, or debate transcript." },
      { status: 400 }
    );
  }

  try {
    // A touch more room than a round — the verdict carries three lists.
    const verdict = await generate(buildVerdictPrompt(body), parseVerdict, 2, 1400);
    return NextResponse.json(verdict);
  } catch (err) {
    const { status, message } = describeGenerationError(
      err,
      "The verdict could not be generated."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
