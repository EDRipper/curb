import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  return NextResponse.json({
    rawCookieHeader: request.headers.get("cookie"),
    session,
    timestamp: new Date().toISOString(),
  });
}
