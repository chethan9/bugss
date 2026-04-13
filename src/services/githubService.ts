import { supabase } from "@/integrations/supabase/client";

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
  // Get current session with better debugging
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log("Session check:", { session, sessionError });
  
  if (!session || !session.user) {
    console.error("No session found");
    throw new Error("Not authenticated. Please refresh the page and try again.");
  }

  const user = session.user;
  console.log("User authenticated:", user.id);

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) throw new Error("Invalid GitHub token");
  const userData = await userResponse.json();
  console.log("GitHub user data:", userData);

  const { data: existing } = await supabase
    .from("github_connections")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("github_connections")
      .update({
        username: userData.login,
        access_token: accessToken,
        avatar_url: userData.avatar_url,
        connected_at: new Date().toISOString()
      })
      .eq("id", existing.id);
    if (error) {
      console.error("Update error:", error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("github_connections")
      .insert({
        user_id: user.id,
        username: userData.login,
        access_token: accessToken,
        avatar_url: userData.avatar_url,
      });
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
  }
  
  console.log("GitHub connection saved successfully");
}

export async function getGitHubConnection() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching GitHub connection:", error);
    return null;
  }
  
  return data;
}

export async function disconnectGitHub() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("user_id", user.id);
    
  if (error) throw error;
}

export async function fetchGitHubRepositories(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json"
    }
  });

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
  owner: {
    login: string;
    avatar_url: string;
  };
}

/**
 * Fetch all repositories accessible by the authenticated user
 */
export async function fetchUserRepositories(token: string): Promise<GitHubRepository[]> {
  const repos: GitHubRepository[] = [];
  let page = 1;
  let hasMore = true;

  // Validate token format
  if (!token || token.trim() === "") {
    throw new Error("GitHub token is required");
  }

  // Check token format (should start with ghp_, gho_, or github_pat_)
  const tokenPrefix = token.substring(0, 4);
  if (!["ghp_", "gho_", "gith"].includes(tokenPrefix)) {
    console.warn("⚠️ Token may have invalid format. GitHub tokens usually start with ghp_, gho_, or github_pat_");
  }

  try {
    while (hasMore) {
      console.log(`📡 Fetching repositories - Page ${page}...`);
      
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid or expired GitHub token. Please check your token and try again.");
        }
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
          if (rateLimitRemaining === "0") {
            throw new Error("GitHub API rate limit exceeded. Please try again later or use a different token.");
          }
          throw new Error("GitHub API access forbidden. Please ensure your token has 'repo' scope permissions.");
        }
        if (response.status === 404) {
          throw new Error("GitHub API endpoint not found. Please verify your token has access to repositories.");
        }
        
        const errorText = await response.text();
        console.error("GitHub API Error Response:", errorText);
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Fetched ${data.length} repositories on page ${page}`);
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        repos.push(...data);
        page++;
      }

      // GitHub API rate limiting: max 100 pages
      if (page > 100) {
        console.warn("⚠️ Reached maximum page limit (100)");
        hasMore = false;
      }
    }

    console.log(`🎉 Total repositories fetched: ${repos.length}`);
    return repos;
  } catch (error: any) {
    console.error("❌ Failed to fetch repositories:", error);
    
    // Handle network errors
    if (error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to reach GitHub API. Please check:\n" +
        "1. Your internet connection\n" +
        "2. GitHub API is accessible (https://api.github.com)\n" +
        "3. No browser extensions blocking the request\n" +
        "4. No firewall/VPN blocking GitHub"
      );
    }
    
    // Re-throw with original message if it's our custom error
    if (error.message.includes("GitHub") || error.message.includes("token")) {
      throw error;
    }
    
    // Generic error
    throw new Error(`Failed to fetch repositories: ${error.message}`);
  }
}