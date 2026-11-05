CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','operator','customer')),
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  camera_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE trays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','maintenance','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trays_room_idx ON trays(room_id);
CREATE TABLE rental_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  duration_days integer NOT NULL CHECK (duration_days BETWEEN 1 AND 365),
  price_vnd integer NOT NULL CHECK (price_vnd BETWEEN 0 AND 1000000000),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  plan_id uuid NOT NULL REFERENCES rental_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  price_per_tray_vnd integer NOT NULL CHECK (price_per_tray_vnd >= 0),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expected_end_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  CHECK (expected_end_at > starts_at),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);
CREATE INDEX rentals_customer_idx ON rentals(customer_id, starts_at DESC);
CREATE TABLE rental_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES rentals(id),
  tray_id uuid NOT NULL REFERENCES trays(id),
  stage text NOT NULL DEFAULT 'incubation' CHECK (stage IN ('incubation','fruiting','ready','harvested')),
  expected_harvest_at timestamptz,
  linked_at timestamptz,
  ended_at timestamptz,
  UNIQUE (rental_id, tray_id)
);
CREATE UNIQUE INDEX rental_items_one_active_tray ON rental_items(tray_id) WHERE ended_at IS NULL;
CREATE INDEX rental_items_rental_idx ON rental_items(rental_id);
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES rentals(id),
  amount_vnd bigint NOT NULL CHECK (amount_vnd >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  method text NOT NULL DEFAULT 'manual' CHECK (method = 'manual'),
  confirmed_by uuid REFERENCES users(id),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'paid') = (confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL))
);
CREATE TABLE growth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_item_id uuid NOT NULL REFERENCES rental_items(id),
  stage text NOT NULL CHECK (stage IN ('incubation','fruiting','ready','harvested')),
  note text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_item_id uuid NOT NULL REFERENCES rental_items(id),
  weight_grams integer NOT NULL CHECK (weight_grams BETWEEN 1 AND 100000000),
  note text NOT NULL DEFAULT '',
  harvested_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES users(id)
);
CREATE TABLE fulfillment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id uuid NOT NULL UNIQUE REFERENCES harvests(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  method text NOT NULL CHECK (method IN ('pickup','delivery')),
  address text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (method <> 'delivery' OR length(trim(address)) > 0),
  CHECK (method <> 'delivery' OR address IS NOT NULL)
);
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id),
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'simulator' CHECK (mode IN ('simulator','hardware')),
  active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id),
  temperature real NOT NULL CHECK (temperature BETWEEN -40 AND 85),
  humidity real NOT NULL CHECK (humidity BETWEEN 0 AND 100),
  co2 integer NOT NULL CHECK (co2 BETWEEN 0 AND 40000),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  simulated boolean NOT NULL
);
CREATE INDEX sensor_readings_device_time_idx ON sensor_readings(device_id, recorded_at DESC);
CREATE TABLE room_thresholds (
  room_id uuid PRIMARY KEY REFERENCES rooms(id),
  temperature_min real NOT NULL DEFAULT 15,
  temperature_max real NOT NULL DEFAULT 30,
  humidity_min real NOT NULL DEFAULT 70,
  humidity_max real NOT NULL DEFAULT 95,
  co2_max integer NOT NULL DEFAULT 1500,
  notifications_enabled boolean NOT NULL DEFAULT true,
  CHECK (temperature_min >= -40 AND temperature_max <= 85 AND temperature_min < temperature_max),
  CHECK (humidity_min >= 0 AND humidity_max <= 100 AND humidity_min < humidity_max),
  CHECK (co2_max BETWEEN 0 AND 40000)
);
CREATE TABLE device_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id),
  actuator text NOT NULL CHECK (actuator IN ('mist','fan','light','heater')),
  enabled boolean NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 1 AND 60),
  dry_run boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'dry_run' CHECK (status IN ('dry_run','pending','acknowledged','failed','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 seconds'),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL CHECK (kind IN ('environment','growth','harvest','rental')),
  message text NOT NULL,
  rental_item_id uuid REFERENCES rental_items(id),
  reading_id uuid REFERENCES sensor_readings(id),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_time_idx ON notifications(user_id, created_at DESC);
