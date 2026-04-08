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

export async function saveGitHubConnection(accessToken: string, username: string, avatarUrl: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("github_connections")
    .upsert({
      user_id: user.id,
      access_token: accessToken,
      username,
      avatar_url: avatarUrl,
      connected_at: new Date().toISOString()
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGitHubConnection() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function fetchGitHubRepositories(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

export async function saveRepositories(connectionId: string, repos: GitHubRepo[]) {
  const reposToInsert = repos.map(repo => ({
    connection_id: connectionId,
    github_id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner.login,
    description: repo.description,
    is_private: repo.private,
    is_tracked: true
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

  if (error) throw error;
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
    throw new Error(`GitHub API error: ${response.statusText}`);
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

  const { error } = await supabase
    .from("issues")
    .upsert(issuesToInsert, { onConflict: "repository_id,github_id" });

  if (error) throw error;

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
    .eq("repositories.is_tracked", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateRepositoryTracking(repositoryId: string, isTracked: boolean) {
  const { error } = await supabase
    .from("repositories")
    .update({ is_tracked: isTracked })
    .eq("id", repositoryId);

  if (error) throw error;
}