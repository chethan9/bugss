import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { saveUserSettings } from "@/services/userSettingsService";

export type GitHubConnectionRow = Tables<"github_connections">;

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}

export async function saveGitHubConnection(accessToken: string) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log("Session check:", { session, sessionError });

  if (!session?.user) {
    console.error("No session found");
    throw new Error("Not authenticated. Please refresh the page and try again.");
  }

  const user = session.user;

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) throw new Error("Invalid GitHub token");
  const userData = (await userResponse.json()) as { login: string; avatar_url?: string | null };
  console.log("GitHub user data:", userData);

  const { data: existing } = await supabase
    .from("github_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("username", userData.login)
    .maybeSingle();

  const row = {
    username: userData.login,
    access_token: accessToken,
    avatar_url: userData.avatar_url ?? null,
    connected_at: new Date().toISOString(),
  };

  let connectionId: string;

  if (existing?.id) {
    const { error } = await supabase
      .from("github_connections")
      .update(row)
      .eq("id", existing.id);
    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    connectionId = existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("github_connections")
      .insert({
        user_id: user.id,
        ...row,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    if (!inserted?.id) throw new Error("Failed to save GitHub connection");
    connectionId = inserted.id;
  }

  await saveUserSettings(user.id, { active_github_connection_id: connectionId });
  console.log("GitHub connection saved successfully");
}

export async function getGitHubConnections(): Promise<GitHubConnectionRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", user.id)
    .order("connected_at", { ascending: false });

  if (error) {
    console.error("Error fetching GitHub connections:", error);
    return [];
  }

  return data ?? [];
}

export async function getGitHubConnection(): Promise<GitHubConnectionRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: settingsRow, error: settingsError } = await supabase
    .from("user_settings")
    .select("active_github_connection_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (settingsError) {
    console.error("Error fetching user_settings for active GitHub:", settingsError);
  }

  const activeId = settingsRow?.active_github_connection_id ?? null;

  if (activeId) {
    const { data, error } = await supabase
      .from("github_connections")
      .select("*")
      .eq("id", activeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching active GitHub connection:", error);
    } else if (data) {
      return data;
    }
  }

  const { data: fallback, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", user.id)
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching GitHub connection:", error);
    return null;
  }

  return fallback;
}

export async function setActiveGitHubConnection(connectionId: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (connectionId) {
    const { data } = await supabase
      .from("github_connections")
      .select("id")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) throw new Error("GitHub connection not found");
  }

  const ok = await saveUserSettings(user.id, { active_github_connection_id: connectionId });
  if (!ok) throw new Error("Failed to update active GitHub account");
}

export async function disconnectGitHubConnection(connectionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: settingsRow } = await supabase
    .from("user_settings")
    .select("active_github_connection_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id);

  if (error) throw error;

  if (settingsRow?.active_github_connection_id === connectionId) {
    await saveUserSettings(user.id, { active_github_connection_id: null });
  }
}

export async function disconnectAllGitHubConnections() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
  await saveUserSettings(user.id, { active_github_connection_id: null });
}

/** Removes all linked GitHub OAuth rows for the signed-in user. */
export async function disconnectGitHub() {
  await disconnectAllGitHubConnections();
}

export async function fetchGitHubRepositories(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json"
    }
  }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

export async function saveRepositories(repos: GitHubRepo[]) {
  const connection = await getGitHubConnection();
  if (!connection) throw new Error("No GitHub connection found");

  const reposToInsert = repos.map(repo => ({
    connection_id: connection.id,
    github_id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner.login,
    description: repo.description,
    is_private: repo.private,
    is_tracked: false
  }));

  const { data, error } = await supabase
    .from("repositories")
    .upsert(reposToInsert, { onConflict: "github_id" })
    .select();

  if (error) throw error;
  return data;
}

export async function getTrackedRepositories() {
  const connection = await getGitHubConnection();
  if (!connection) return [];

  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("connection_id", connection.id)
    .eq("is_tracked", true)
    .order("name");

  if (error) {
    console.error("Error fetching tracked repositories:", error);
    return [];
  }
  
  return data || [];
}

export async function getAllRepositories() {
  const connection = await getGitHubConnection();
  if (!connection) return [];

  const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("connection_id", connection.id)
    .order("name");

  if (error) {
    console.error("Error fetching repositories:", error);
    return [];
  }
  
  return data || [];
}

export async function fetchGitHubIssues(accessToken: string, repoFullName: string): Promise<GitHubIssue[]> {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/issues?state=all&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

export async function syncRepositoryIssues(repositoryId: string, repoFullName: string, accessToken: string) {
  const issues = await fetchGitHubIssues(accessToken, repoFullName);

  const issuesToInsert = issues.map(issue => ({
    repository_id: repositoryId,
    github_id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels,
    assignees: issue.assignees,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    closed_at: issue.closed_at,
    html_url: issue.html_url,
    synced_at: new Date().toISOString()
  }));

  if (issuesToInsert.length > 0) {
    const { error } = await supabase
      .from("issues")
      .upsert(issuesToInsert, { onConflict: "repository_id,github_id" });

    if (error) throw error;
  }

  // Update last synced timestamp
  await supabase
    .from("repositories")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", repositoryId);
}

export async function getAllIssues() {
  const connection = await getGitHubConnection();
  if (!connection) return [];

  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      repositories!inner(
        id,
        name,
        full_name,
        owner,
        connection_id
      )
    `)
    .eq("repositories.connection_id", connection.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching issues:", error);
    return [];
  }
  
  return data || [];
}

export async function updateRepositoryTracking(repositoryId: string, isTracked: boolean) {
  const { error } = await supabase
    .from("repositories")
    .update({ is_tracked: isTracked })
    .eq("id", repositoryId);

  if (error) throw error;
}

export async function fetchRepositoryIssues(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  let page = 1;
  let hasMore = true;

  // Fetch all pages of issues
  while (hasMore) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.statusText}`);
    }

    const pageIssues = await response.json();
    
    // Filter out pull requests (GitHub API includes PRs in /issues endpoint)
    const actualIssues = pageIssues.filter((item: any) => !item.pull_request);
    
    allIssues.push(...actualIssues);

    // Check if there are more pages
    if (pageIssues.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allIssues;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  open_issues_count: number;
  language: string | null;
  private: boolean;
  /** Present on REST repo objects; used for stable ordering after merges. */
  updated_at?: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

/**
 * Fetch repositories the token can access: personal, collaborator, and organization
 * repositories. Merges `GET /user/repos` (with org-member affiliation) with a per-org
 * pass via `GET /user/orgs` + `GET /orgs/{org}/repos`, deduped by GitHub repo id.
 * (Do not add `type` to `GET /user/repos` when using `affiliation` — GitHub returns 422.)
 *
 * For organization and private org repos, ensure:
 * - OAuth: app is approved under the org (GitHub → Organization → Third-party access).
 * - PAT: scopes include `repo` and `read:org` (re-generate the token after adding scopes).
 */
export async function fetchUserRepositories(token: string): Promise<GitHubRepository[]> {
  if (!token || token.trim() === "") {
    throw new Error("GitHub token is required");
  }

  const tokenPrefix = token.substring(0, 4);
  if (!["ghp_", "gho_", "gith"].includes(tokenPrefix)) {
    console.warn("⚠️ Token may have invalid format. GitHub tokens usually start with ghp_, gho_, or github_pat_");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  } as const;

  const handleRepoListError = async (response: Response, context: string): Promise<never> => {
    if (response.status === 401) {
      throw new Error("Invalid or expired GitHub token. Please check your token and try again.");
    }
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("GitHub API rate limit exceeded. Please try again later or use a different token.");
      }
      const body = await response.text();
      throw new Error(
        `GitHub API access forbidden (${context}). Use a token with repo (and read:org for org listing). ${body.slice(0, 160)}`
      );
    }
    if (response.status === 404) {
      throw new Error(`GitHub API endpoint not found (${context}).`);
    }
    const errorText = await response.text();
    console.error("GitHub API Error Response:", errorText);
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  };

  try {
    const byId = new Map<number, GitHubRepository>();

    let page = 1;
    while (page <= 100) {
      console.log(`📡 Fetching user/repos page ${page}...`);
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
        { headers }
      );
      console.log(`📊 user/repos response: ${response.status}`);
      if (!response.ok) {
        await handleRepoListError(response, "user/repos");
      }
      const data = (await response.json()) as GitHubRepository[];
      if (!Array.isArray(data) || data.length === 0) break;
      for (const r of data) {
        if (r?.id != null) byId.set(r.id, r);
      }
      if (data.length < 100) break;
      page++;
    }

    try {
      let orgPage = 1;
      const orgLogins: string[] = [];
      while (orgPage <= 100) {
        const orgRes = await fetch(`https://api.github.com/user/orgs?per_page=100&page=${orgPage}`, {
          headers,
        });
        if (!orgRes.ok) {
          if (orgRes.status === 403 || orgRes.status === 401) {
            console.warn(
              "[github repos] user/orgs returned",
              orgRes.status,
              "— add read:org to PAT scopes, or approve this OAuth app for the organization (Org settings → Third-party access)."
            );
          } else {
            console.warn("[github repos] user/orgs returned", orgRes.status);
          }
          break;
        }
        const orgs = (await orgRes.json()) as Array<{ login?: string }>;
        if (!Array.isArray(orgs) || orgs.length === 0) break;
        for (const o of orgs) {
          if (o.login) orgLogins.push(o.login);
        }
        if (orgs.length < 100) break;
        orgPage++;
      }

      for (const orgLogin of orgLogins) {
        let rpage = 1;
        while (rpage <= 100) {
          const orgRepoRes = await fetch(
            `https://api.github.com/orgs/${encodeURIComponent(orgLogin)}/repos?per_page=100&page=${rpage}&type=all&sort=updated`,
            { headers }
          );
          if (!orgRepoRes.ok) {
            console.warn(`[github repos] orgs/${orgLogin}/repos returned`, orgRepoRes.status);
            break;
          }
          const chunk = (await orgRepoRes.json()) as GitHubRepository[];
          if (!Array.isArray(chunk) || chunk.length === 0) break;
          for (const r of chunk) {
            if (r?.id != null) byId.set(r.id, r);
          }
          if (chunk.length < 100) break;
          rpage++;
        }
      }
    } catch (e) {
      console.warn("[github repos] supplemental org listing skipped:", e);
    }

    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
      const ta = a.updated_at ?? "";
      const tb = b.updated_at ?? "";
      if (ta && tb) return tb.localeCompare(ta);
      return a.full_name.localeCompare(b.full_name);
    });

    console.log(`🎉 Total repositories fetched (deduped): ${merged.length}`);
    return merged;
  } catch (error: any) {
    console.error("❌ Failed to fetch repositories:", error);

    if (error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to reach GitHub API. Please check:\n" +
          "1. Your internet connection\n" +
          "2. GitHub API is accessible (https://api.github.com)\n" +
          "3. No browser extensions blocking the request\n" +
          "4. No firewall/VPN blocking GitHub"
      );
    }

    if (error.message.includes("GitHub") || error.message.includes("token")) {
      throw error;
    }

    throw new Error(`Failed to fetch repositories: ${error.message}`);
  }
}