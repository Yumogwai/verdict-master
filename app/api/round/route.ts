import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/anthropic";
import { buildRoundPrompt, parseRound } from "@/lib/debate-prompts";
import type { RoundRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: RoundRequest;
  try {
    body = (await req.json()) as RoundRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body?.topic || !body?.sideA || !body?.sideB) {
    return NextResponse.json(
      { error: "Missing topic or debaters." },
      { status: 400 }
    );
  }

  try {
    const round = await generate(buildRoundPrompt(body), parseRound);
    return NextResponse.json(round);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The debate could not be generated.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
