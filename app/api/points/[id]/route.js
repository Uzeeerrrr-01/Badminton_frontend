import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const proxied = await forwardToBackend(request, `/api/points/${params.id}`);
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  return NextResponse.json({ error: "Backend service unavailable." }, { status: 503 });
}

export async function DELETE(request, { params }) {
  const proxied = await forwardToBackend(request, `/api/points/${params.id}`);
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  return NextResponse.json({ error: "Backend service unavailable." }, { status: 503 });
}
