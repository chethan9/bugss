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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("[github-oauth-callback] SUPABASE_SERVICE_ROLE_KEY is not set");
    return redirect(res, "/?github_oauth=error&reason=save_failed&hint=missing_service_role");
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: selectError } = await admin
      .from("github_connections")
      .select("id")
      .eq("user_id", payload.sub)
      .eq("username", userData.login)
      .maybeSingle();

    if (selectError) {
      console.error("[github-oauth-callback] select github_connections", selectError);
      throw selectError;
    }

    const row = {
      username: userData.login,
      access_token: accessToken,
      avatar_url: userData.avatar_url ?? null,
      connected_at: new Date().toISOString(),
    };

    let connectionId: string;

    if (existing?.id) {
      const { error } = await admin
        .from("github_connections")
        .update(row)
        .eq("id", existing.id);
      if (error) {
        console.error("[github-oauth-callback] update github_connections", error);
        throw error;
      }
      connectionId = existing.id;
    } else {
      const { data: inserted, error } = await admin
        .from("github_connections")
        .insert({
          user_id: payload.sub,
          ...row,
        })
        .select("id")
        .single();
      if (error) {
        console.error("[github-oauth-callback] insert github_connections", error);
        throw error;
      }
      if (!inserted?.id) throw new Error("insert returned no id");
      connectionId = inserted.id;
    }

    const { data: settingsRow, error: settingsSelectError } = await admin
      .from("user_settings")
      .select("id")
      .eq("user_id", payload.sub)
      .maybeSingle();

    if (settingsSelectError) {
      console.error("[github-oauth-callback] select user_settings", settingsSelectError);
      throw settingsSelectError;
    }

    if (settingsRow?.id) {
      const { error: settingsUpdateError } = await admin
        .from("user_settings")
        .update({
          active_github_connection_id: connectionId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", payload.sub);
      if (settingsUpdateError) {
        console.error("[github-oauth-callback] update user_settings active_github", settingsUpdateError);
        throw settingsUpdateError;
      }
    }
  } catch (e: unknown) {
    console.error("[github-oauth-callback] save failed", e);
    const err = e as { message?: string; code?: string };
    const msg = err?.message ? String(err.message) : String(e);
    const code = err?.code ? String(err.code) : "";
    const lower = msg.toLowerCase();
    let hint = "unknown";
    if (
      lower.includes("missing next_public_supabase_url") ||
      lower.includes("supabase_service_role_key")
    ) {
      hint = "missing_service_role";
    } else if (
      code === "42501" ||
      lower.includes("permission denied") ||
      lower.includes("row-level security") ||
      lower.includes("42501")
    ) {
      hint = "rls_use_service_role";
    } else if (code === "23503" || lower.includes("foreign key")) {
      hint = "invalid_user";
    }
    return redirect(res, `/?github_oauth=error&reason=save_failed&hint=${hint}`);
  }

  const loginEnc = encodeURIComponent(userData.login);
  return redirect(res, `/?github_oauth=success&linked_login=${loginEnc}`);
}
