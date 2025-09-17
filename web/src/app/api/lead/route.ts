import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // TODO: integrate HubSpot/SFDC. For demo: accept and return crm_ok
    return NextResponse.json({ crm_ok: true, received: payload ?? null });
  } catch {
    return NextResponse.json({ crm_ok: false }, { status: 400 });
  }
}


