import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.redirect("/?error=no_code");
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.redirect("/?error=oauth_not_configured");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.redirect(`/?error=${tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const userData = await userResponse.json();

    // Get current Supabase user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.redirect("/?error=not_authenticated");
    }

    // Store connection in database
    const { error: dbError } = await supabase
      .from("github_connections")
      .upsert({
        user_id: user.id,
        github_user_id: userData.id,
        github_username: userData.login,
        github_email: userData.email,
        access_token: accessToken,
        token_type: "oauth",
        avatar_url: userData.avatar_url,
      }, {
        onConflict: "user_id"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return res.redirect("/?error=database_error");
    }

    // Redirect back to app with success
    res.redirect("/?connected=true");
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect("/?error=oauth_failed");
  }
}