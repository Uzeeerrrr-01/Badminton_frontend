import { NextResponse } from "next/server";
import { setMatchStatus, startMatchWithToss } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const { status, toss } = await request.json();

    if (status === "live" && toss) {
      const started = startMatchWithToss(params.id, toss);
      return NextResponse.json({ success: true, match: started });
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    const updated = setMatchStatus(params.id, status);
    return NextResponse.json({ success: true, match: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
