import { NextRequest, NextResponse } from "next/server";
import { getCase } from "@/lib/cases";

// Verdict resolution. theoryIndex of -1 means "suspect cracked" — just return the reveal.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const caze = getCase(body.caseId);
  if (!caze) return NextResponse.json({ error: "Unknown case" }, { status: 400 });

  const idx = Number(body.theoryIndex);
  if (idx === -1) {
    return NextResponse.json({ correct: true, reveal: caze.reveal });
  }
  const theory = caze.theories[idx];
  if (!theory) return NextResponse.json({ error: "Bad theory" }, { status: 400 });
  return NextResponse.json({ correct: theory.correct, reveal: caze.reveal });
}
