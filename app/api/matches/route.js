import { NextResponse } from "next/server";
import { getMatches, createMatch } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const proxied = await forwardToBackend(request, "/api/matches");
  if (proxied) return proxied;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const court = searchParams.get("court") || null;

    const matches = getMatches({ status, category, court });
    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const proxied = await forwardToBackend(request, "/api/matches");
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const data = await request.json();
    if (!data.category || !data.team_a_name || !data.team_b_name) {
      return NextResponse.json(
        { error: "Category, Team A, and Team B details are required." },
        { status: 400 }
      );
    }

    const match = createMatch(data);
    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
