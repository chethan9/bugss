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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) throw new Error("Invalid GitHub token");
  const userData = await userResponse.json();

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
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("github_connections")
      .insert({
        user_id: user.id,
        username: userData.login,
        access_token: accessToken,
        avatar_url: userData.avatar_url,
      });
    if (error) throw error;
  }
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