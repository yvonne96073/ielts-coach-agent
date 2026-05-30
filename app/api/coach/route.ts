import { NextResponse } from "next/server";
import { scoreIeltsResponse, type PracticeMode } from "@/lib/ieltsScoring";

type CoachRequest = {
  mode?: PracticeMode;
  task?: string;
  answer?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CoachRequest;
  const mode = body.mode === "speaking" ? "speaking" : "writing";
  const task = body.task?.trim() ?? "";
  const answer = body.answer?.trim() ?? "";

  if (!task || !answer) {
    return NextResponse.json(
      { error: "Please provide both the IELTS task and your answer." },
      { status: 400 },
    );
  }

  return NextResponse.json(scoreIeltsResponse({ mode, task, answer }));
}
