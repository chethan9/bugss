CREATE TABLE IF NOT EXISTS app_version (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_log TEXT
);

-- Insert initial version
INSERT INTO app_version (version_number, change_log) 
VALUES (1, 'Initial release')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "public_read_version" ON app_version FOR SELECT USING (true);

-- Allow authenticated users to update
CREATE POLICY "auth_update_version" ON app_version FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_version" ON app_version FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);