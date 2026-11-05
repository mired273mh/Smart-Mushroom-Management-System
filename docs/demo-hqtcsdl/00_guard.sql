DO $$
BEGIN
  IF current_database() !~ '^sm_test_[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'HQTCSDL SQL demos require the isolated sm_test_* lab database';
  END IF;
END $$;
