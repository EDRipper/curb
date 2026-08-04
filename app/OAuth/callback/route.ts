import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchUserInfo } from "@/lib/hackclubAuth";
import { signSession, SESSION_COOKIE, STATE_COOKIE } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/login-error?reason=state", request.url),
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const hcaUser = await fetchUserInfo(accessToken);

    const user = await db.user.upsert({
      where: { hcaSub: hcaUser.sub },
      update: { email: hcaUser.email, name: hcaUser.name, slackId: hcaUser.slackId },
      create: {
        hcaSub: hcaUser.sub,
        email: hcaUser.email,
        name: hcaUser.name,
        slackId: hcaUser.slackId,
      },
    });

    const sessionToken = await signSession({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("oauth callback failed", err);
    return NextResponse.redirect(
      new URL("/login-error?reason=exchange", request.url),
    );
  }
}
