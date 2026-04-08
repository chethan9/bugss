import type { NextApiRequest, NextApiResponse } from "next";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`
  : "http://localhost:3000/api/github/callback";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ 
      error: "GitHub OAuth not configured. Please add GITHUB_CLIENT_ID to environment variables." 
    });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  // Store state in session/cookie for verification (simplified for now)
  res.setHeader("Set-Cookie", `github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax`);

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo,read:user&state=${state}`;

  res.status(200).json({ url: githubAuthUrl });
}