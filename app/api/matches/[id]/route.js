import { NextResponse } from "next/server";
import { getMatch, updateMatch, deleteMatch } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const match = getMatch(params.id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json({ match });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const data = await request.json();
    const match = updateMatch(params.id, data);
    return NextResponse.json({ success: true, match });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    deleteMatch(params.id);
    return NextResponse.json({ success: true, message: "Match deleted" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
