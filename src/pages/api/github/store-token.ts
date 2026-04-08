import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Verify token by fetching user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }

    const userData = await userResponse.json();

    // Get current Supabase user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Store connection in database
    const { error: dbError } = await supabase
      .from("github_connections")
      .upsert({
        user_id: user.id,
        github_user_id: userData.id,
        github_username: userData.login,
        github_email: userData.email,
        access_token: token,
        token_type: "pat",
        avatar_url: userData.avatar_url,
      }, {
        onConflict: "user_id"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to store connection" });
    }

    res.status(200).json({ 
      success: true,
      user: {
        username: userData.login,
        email: userData.email,
        avatar: userData.avatar_url
      }
    });
  } catch (error) {
    console.error("Token storage error:", error);
    res.status(500).json({ error: "Failed to process token" });
  }
}