import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  buildGithubAuthorizeUrl,
  getGithubOAuthRedirectUri,
  signState,
} from "@/lib/githubOAuth";

type Ok = { url: string };
type Err = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const jwt = auth.slice("Bearer ".length).trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Supabase is not configured" });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const stateSecret = process.env.GITHUB_OAUTH_STATE_SECRET;
  if (!clientId || !stateSecret) {
    return res.status(500).json({ error: "GitHub OAuth is not configured on the server" });
  }

  const rawLogin = req.query.login;
  let loginHint: string | undefined;
  if (typeof rawLogin === "string") {
    const t = rawLogin.trim().slice(0, 39);
    // GitHub usernames: alphanumeric + single hyphens, no leading/trailing hyphen
    if (t && /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(t)) {
      loginHint = t;
    } else if (t) {
      return res.status(400).json({ error: "Invalid GitHub username for login hint" });
    }
  }

  const exp = Math.floor(Date.now() / 1000) + 10 * 60;
  const state = signState({ sub: user.id, exp }, stateSecret);
  const redirectUri = getGithubOAuthRedirectUri();
  const url = buildGithubAuthorizeUrl({ clientId, redirectUri, state, login: loginHint });

  return res.status(200).json({ url });
}
