import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/anthropic";
import { buildVerdictPrompt, parseVerdict } from "@/lib/debate-prompts";
import type { VerdictRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: VerdictRequest;
  try {
    body = (await req.json()) as VerdictRequest;
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
    // A touch more room than a round — the verdict carries three lists.
    const verdict = await generate(buildVerdictPrompt(body), parseVerdict, 2, 1400);
    return NextResponse.json(verdict);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The verdict could not be generated.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
