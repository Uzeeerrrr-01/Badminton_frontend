import { NextResponse } from "next/server";
import { getLeaderboard, adjustManualPoints, getPointsHistory } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const proxied = await forwardToBackend(request, "/api/points");
  if (proxied) return proxied;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const entityType = searchParams.get("entityType") || "";

    const leaderboard = getLeaderboard({ category, entityType });
    const history = getPointsHistory();

    return NextResponse.json({ leaderboard, history });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const proxied = await forwardToBackend(request, "/api/points");
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const data = await request.json();
    adjustManualPoints({
      ...data,
      adjustedBy: session.name || "Admin",
    });

    const leaderboard = getLeaderboard();
    const history = getPointsHistory();

    return NextResponse.json({ success: true, leaderboard, history });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
