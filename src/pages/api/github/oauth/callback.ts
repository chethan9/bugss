import type { NextApiRequest, NextApiResponse } from "next";
import {
  exchangeGithubOAuthCode,
  getGithubOAuthRedirectUri,
  verifyState,
} from "@/lib/githubOAuth";
import { createAdminClient } from "@/lib/supabaseAdmin";

function appOrigin(): string {
  try {
    return new URL(getGithubOAuthRedirectUri()).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function redirect(res: NextApiResponse, path: string) {
  res.redirect(302, `${appOrigin()}${path}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const q = req.query;
  const ghError = q.error;
  if (typeof ghError === "string" && ghError) {
    const desc =
      typeof q.error_description === "string"
        ? encodeURIComponent(q.error_description.slice(0, 200))
        : "";
    return redirect(res, `/?github_oauth=error&reason=${encodeURIComponent(ghError)}&detail=${desc}`);
  }

  const code = q.code;
  const state = q.state;
  if (typeof code !== "string" || typeof state !== "string") {
    return redirect(res, "/?github_oauth=error&reason=missing_params");
  }

  const stateSecret = process.env.GITHUB_OAUTH_STATE_SECRET;
  if (!stateSecret) {
    return redirect(res, "/?github_oauth=error&reason=server_config");
  }

  const payload = verifyState(state, stateSecret);
  if (!payload) {
    return redirect(res, "/?github_oauth=error&reason=invalid_state");
  }

  let accessToken: string;
  try {
    accessToken = await exchangeGithubOAuthCode(code);
  } catch {
    return redirect(res, "/?github_oauth=error&reason=token_exchange");
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!userRes.ok) {
    return redirect(res, "/?github_oauth=error&reason=github_user");
  }

  const userData = (await userRes.json()) as {
    login?: string;
    avatar_url?: string | null;
  };

  if (!userData.login) {
    return redirect(res, "/?github_oauth=error&reason=github_user");
  }

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("github_connections")
      .select("id")
      .eq("user_id", payload.sub)
      .maybeSingle();

    const row = {
      username: userData.login,
      access_token: accessToken,
      avatar_url: userData.avatar_url ?? null,
      connected_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await admin
        .from("github_connections")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await admin.from("github_connections").insert({
        user_id: payload.sub,
        ...row,
      });
      if (error) throw error;
    }
  } catch {
    return redirect(res, "/?github_oauth=error&reason=save_failed");
  }

  return redirect(res, "/?github_oauth=success");
}
