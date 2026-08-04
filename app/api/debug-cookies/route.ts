import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return NextResponse.json({
    rawCookieHeader: request.headers.get("cookie"),
  });
}
