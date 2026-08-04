const AUTHORIZE_URL = "https://auth.hackclub.com/oauth/authorize";
const TOKEN_URL = "https://auth.hackclub.com/oauth/token";
const USERINFO_URL = "https://auth.hackclub.com/api/v1/me";

const SCOPES = "openid profile email name slack_id";

export function buildAuthorizeUrl(state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", process.env.HCA_CLIENT_ID!);
  url.searchParams.set("redirect_uri", process.env.HCA_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.HCA_REDIRECT_URI!,
      client_id: process.env.HCA_CLIENT_ID!,
      client_secret: process.env.HCA_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  }

  const data: TokenResponse = await res.json();
  return data.access_token;
}

type HcaMeResponse = {
  identity: {
    id: string;
    first_name?: string;
    last_name?: string;
    primary_email?: string;
    slack_id?: string;
  };
  scopes: string[];
};

export type HcaUser = {
  sub: string;
  email: string;
  name: string;
  slackId?: string;
};

export async function fetchUserInfo(accessToken: string): Promise<HcaUser> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`userinfo fetch failed: ${res.status} ${await res.text()}`);
  }

  const data: HcaMeResponse = await res.json();
  const name = [data.identity.first_name, data.identity.last_name]
    .filter(Boolean)
    .join(" ");

  return {
    sub: data.identity.id,
    email: data.identity.primary_email ?? "",
    name: name || "unknown",
    slackId: data.identity.slack_id,
  };
}
