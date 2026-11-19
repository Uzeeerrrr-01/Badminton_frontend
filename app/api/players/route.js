import { NextResponse } from "next/server";
import { getPlayers, createPlayer } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const status = searchParams.get("status") || "";

    const players = getPlayers({ search, category, gender, status });
    return NextResponse.json({ players });
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
    if (!data.full_name || !data.gender) {
      return NextResponse.json({ error: "Full name and gender are required." }, { status: 400 });
    }

    const player = createPlayer(data);
    return NextResponse.json({ success: true, player }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
