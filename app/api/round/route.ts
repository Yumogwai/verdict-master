import { NextRequest, NextResponse } from "next/server";
import { generate, describeGenerationError } from "@/lib/anthropic";
import { buildRoundPrompt, parseRound } from "@/lib/debate-prompts";
import { parseRoundRequest } from "@/lib/validate";
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

  const body = parseRoundRequest(raw);
  if (!body) {
    return NextResponse.json(
      { error: "Missing or invalid topic, debaters, or round number." },
      { status: 400 }
    );
  }

  try {
    const round = await generate(buildRoundPrompt(body), parseRound);
    return NextResponse.json(round);
  } catch (err) {
    const { status, message } = describeGenerationError(
      err,
      "The debate could not be generated."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
