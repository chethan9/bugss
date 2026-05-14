-- Upsert from GitHub sync requires UPDATE, not only INSERT
CREATE POLICY "Users can update own issues" ON issues FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM repositories
    JOIN github_connections ON github_connections.id = repositories.connection_id
    WHERE repositories.id = issues.repository_id AND github_connections.user_id = auth.uid()
  )
);
