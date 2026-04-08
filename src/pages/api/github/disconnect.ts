import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current Supabase user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Delete all user's repositories and issues (cascading)
    await supabase
      .from("repositories")
      .delete()
      .eq("user_id", user.id);

    // Delete GitHub connection
    const { error } = await supabase
      .from("github_connections")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Disconnect error:", error);
      return res.status(500).json({ error: "Failed to disconnect" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
}