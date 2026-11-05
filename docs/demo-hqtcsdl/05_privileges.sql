-- Run with the actual runtime/report login; metadata checks do not read PII.
SELECT current_user,
  has_schema_privilege(current_user,'public','CREATE') AS can_create_persistent_objects,
  has_table_privilege(current_user,'public.users','SELECT') AS can_read_users,
  has_table_privilege(current_user,'public.schema_migrations','SELECT') AS can_read_migrations,
  has_table_privilege(current_user,'public.sensor_readings','TRUNCATE') AS can_truncate,
  has_table_privilege(current_user,'public.v_room_cultivation_summary','SELECT') AS can_read_aggregate;
SELECT * FROM public.v_room_cultivation_summary ORDER BY name;
