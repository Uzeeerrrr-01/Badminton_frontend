import { NextResponse } from "next/server";
import { getLeaderboard, adjustManualPoints, getPointsHistory } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const entityType = searchParams.get("entityType") || "";

    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.BACKEND_URL || "http://localhost:5050";
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (entityType) params.set("entityType", entityType);

      const res = await fetch(`${backendUrl}/api/points?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {
      // Fallback to SQLite if backend unavailable
    }

    const leaderboard = getLeaderboard({ category, entityType });
    const history = getPointsHistory();

    return NextResponse.json({ leaderboard, history });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const data = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.BACKEND_URL || "http://localhost:5050";

    try {
      const res = await fetch(`${backendUrl}/api/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          adjustedBy: session.name || "Admin",
        }),
      });
      if (res.ok) {
        const pRes = await fetch(`${backendUrl}/api/points`, { cache: "no-store" });
        if (pRes.ok) {
          const ptData = await pRes.json();
          return NextResponse.json({ success: true, ...ptData });
        }
        return NextResponse.json({ success: true });
      }
    } catch (_) {
      // Fallback to SQLite
    }

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
