import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildAuthorizeUrl } from "@/lib/hackclubAuth";
import { STATE_COOKIE } from "@/lib/session";

export async function GET() {
  const state = randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
