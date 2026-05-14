-- Allow multiple GitHub identities per app user; track which connection is active.
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS active_github_connection_id UUID REFERENCES github_connections(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS github_connections_user_username_lower_uidx
  ON github_connections (user_id, lower(username));
