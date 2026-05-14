-- Rename product default from FixFlix to Bugzilla (existing DBs that already ran older migrations)
ALTER TABLE user_settings ALTER COLUMN app_name SET DEFAULT 'Bugzilla';
UPDATE user_settings SET app_name = 'Bugzilla' WHERE app_name = 'FixFlix';
