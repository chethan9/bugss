import type { NextApiRequest, NextApiResponse } from "next";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.redirect("/?error=no_code");
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.redirect("/?error=oauth_not_configured");
  }

  try {
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
    
    // Redirect back to app with token so client can store it securely with user session
    res.redirect(`/?github_token=${accessToken}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect("/?error=oauth_failed");
  }
}