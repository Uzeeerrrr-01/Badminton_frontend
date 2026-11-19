import { NextResponse } from "next/server";
import { letPoint } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const updated = letPoint(params.id);
    return NextResponse.json({ success: true, match: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
