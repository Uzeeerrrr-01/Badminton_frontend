import { NextResponse } from "next/server";
import { getTeams, createTeam } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const teams = getTeams({ category, search });
    return NextResponse.json({ teams });
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
    if (!data.name || !data.category || !data.player1_id) {
      return NextResponse.json({ error: "Name, category, and player 1 are required." }, { status: 400 });
    }

    const team = createTeam(data);
    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
