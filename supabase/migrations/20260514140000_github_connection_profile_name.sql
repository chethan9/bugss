-- Multiple PAT profiles per user (including same GitHub @username): unique by profile_name per user.

ALTER TABLE github_connections
  ADD COLUMN IF NOT EXISTS profile_name text;

UPDATE github_connections
SET profile_name = username
WHERE profile_name IS NULL;

ALTER TABLE github_connections
  ALTER COLUMN profile_name SET NOT NULL;

DROP INDEX IF EXISTS github_connections_user_username_lower_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS github_connections_user_profile_name_lower_uidx
  ON github_connections (user_id, lower(profile_name));
