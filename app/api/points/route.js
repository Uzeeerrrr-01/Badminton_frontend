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

    const categories = [
      "Men's Singles",
      "Women's Singles",
      "Men's Doubles",
      "Women's Doubles",
      "Mixed Doubles",
    ];

    const categoryLeaders = {};
    for (const cat of categories) {
      const topRecord = leaderboard.find((r) => r.category === cat) || null;
      const count = leaderboard.filter((r) => r.category === cat).length;
      categoryLeaders[cat] = {
        leader: topRecord,
        totalParticipants: count,
      };
    }

    return NextResponse.json({ leaderboard, history, categoryLeaders, categories });
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

export async function DELETE(request) {
  const proxied = await forwardToBackend(request, "/api/points");
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  return NextResponse.json({ error: "Backend service unavailable." }, { status: 503 });
}
