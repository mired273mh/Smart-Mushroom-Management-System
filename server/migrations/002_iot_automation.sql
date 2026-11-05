ALTER TABLE devices ADD COLUMN automation_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE device_commands ADD COLUMN source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','automatic'));
ALTER TABLE device_commands ADD COLUMN result text;
CREATE INDEX commands_device_time_idx ON device_commands(device_id, created_at DESC);
