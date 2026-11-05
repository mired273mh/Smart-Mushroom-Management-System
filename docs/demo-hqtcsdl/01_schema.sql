-- Read-only; uses the selected isolated lab database.
SELECT table_name,column_name,data_type,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN
  (SELECT tablename FROM pg_tables WHERE schemaname='public')
ORDER BY table_name,ordinal_position;

SELECT conrelid::regclass AS table_name,conname,contype,pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE connamespace='public'::regnamespace
ORDER BY conrelid::regclass::text,conname;

SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public'
ORDER BY tablename,indexname;
