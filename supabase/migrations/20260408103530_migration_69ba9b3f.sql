-- Create github_connections table
CREATE TABLE IF NOT EXISTS github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES github_connections(id) ON DELETE CASCADE,
  github_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  is_tracked BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  github_id BIGINT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL,
  labels JSONB DEFAULT '[]'::jsonb,
  assignees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  html_url TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repository_id, github_id)
);

-- RLS policies
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON github_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON github_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON github_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON github_connections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own repositories" ON repositories FOR SELECT USING (
  EXISTS (SELECT 1 FROM github_connections WHERE github_connections.id = repositories.connection_id AND github_connections.user_id = auth.uid())
);
CREATE POLICY "Users can insert own repositories" ON repositories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM github_connections WHERE github_connections.id = repositories.connection_id AND github_connections.user_id = auth.uid())
);
CREATE POLICY "Users can update own repositories" ON repositories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM github_connections WHERE github_connections.id = repositories.connection_id AND github_connections.user_id = auth.uid())
);
CREATE POLICY "Users can delete own repositories" ON repositories FOR DELETE USING (
  EXISTS (SELECT 1 FROM github_connections WHERE github_connections.id = repositories.connection_id AND github_connections.user_id = auth.uid())
);

CREATE POLICY "Users can view own issues" ON issues FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM repositories 
    JOIN github_connections ON github_connections.id = repositories.connection_id 
    WHERE repositories.id = issues.repository_id AND github_connections.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own issues" ON issues FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM repositories 
    JOIN github_connections ON github_connections.id = repositories.connection_id 
    WHERE repositories.id = issues.repository_id AND github_connections.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_connection ON repositories(connection_id);
CREATE INDEX IF NOT EXISTS idx_issues_repository ON issues(repository_id);
CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state);
CREATE INDEX IF NOT EXISTS idx_issues_synced_at ON issues(synced_at);