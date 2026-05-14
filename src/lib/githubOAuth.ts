import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const GITHUB_OAUTH_SCOPES = ["repo", "read:user", "user:email"].join(" ");

export type OAuthStatePayload = {
  sub: string;
  exp: number;
  n: string;
};

export function getGithubOAuthRedirectUri(): string {
  const explicit = process.env.GITHUB_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  let base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  if (!base.startsWith("http")) {
    base = `https://${base}`;
  }

  return `${base}/api/github/oauth/callback`;
}

export function signState(
  payload: Omit<OAuthStatePayload, "n"> & { n?: string },
  secret: string
): string {
  const full: OAuthStatePayload = {
    ...payload,
    n: payload.n ?? randomBytes(16).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state: string, secret: string): OAuthStatePayload | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expectedSig = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const data = JSON.parse(json) as OAuthStatePayload;
    if (!data.sub || typeof data.exp !== "number") return null;
    if (Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function buildGithubAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
  /** Suggests which GitHub account to authenticate — required to link a second user while the browser is signed into another. */
  login?: string;
}): string {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("state", params.state);
  u.searchParams.set("scope", params.scope ?? GITHUB_OAUTH_SCOPES);
  u.searchParams.set("allow_signup", "true");
  if (params.login?.trim()) {
    u.searchParams.set("login", params.login.trim());
  }
  return u.toString();
}

export async function exchangeGithubOAuthCode(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || "Token exchange failed");
  }

  return data.access_token;
}
