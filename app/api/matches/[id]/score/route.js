import { NextResponse } from "next/server";
import { addPoint } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const { winningTeam, faultReason } = await request.json();
    if (winningTeam !== "A" && winningTeam !== "B") {
      return NextResponse.json({ error: "Invalid winningTeam. Must be 'A' or 'B'." }, { status: 400 });
    }

    const updated = addPoint(params.id, winningTeam, faultReason);
    return NextResponse.json({ success: true, match: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
