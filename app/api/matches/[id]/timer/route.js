import { NextResponse } from "next/server";
import { getMatch, checkAndFinalizeMatchByTimer, updateTimerAction } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const proxied = await forwardToBackend(request, `/api/matches/${params.id}/timer`);
  if (proxied) return proxied;

  const match = getMatch(params.id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  return NextResponse.json({
    timer_enabled: match.timer_enabled,
    timer_status: match.timer_status,
    timer_remaining_seconds: match.timer_remaining_seconds,
    timer_duration_seconds: match.timer_duration_seconds,
    timer_start_ts: match.timer_start_ts,
  });
}

export async function PUT(request, { params }) {
  const proxied = await forwardToBackend(request, `/api/matches/${params.id}/timer`);
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }
  try {
    const { action } = await request.json();

    if (action === "check") {
      const updated = checkAndFinalizeMatchByTimer(params.id);
      return NextResponse.json({ success: true, match: updated });
    }

    if (["pause", "resume", "reset"].includes(action)) {
      const updated = updateTimerAction(params.id, action);
      return NextResponse.json({ success: true, match: updated });
    }

    return NextResponse.json(
      { error: "Invalid action. Valid actions: check, pause, resume, reset" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
