-- Controlled comparison, NOT an assertion that production previously lacked an index.
-- Only planner settings in these transactions change. No index is dropped.
ANALYZE public.sensor_readings;
BEGIN;
SET LOCAL enable_indexscan=off;
SET LOCAL enable_indexonlyscan=off;
SET LOCAL enable_bitmapscan=off;
EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON)
  SELECT recorded_at,temperature,humidity,co2 FROM public.sensor_readings
  WHERE device_id=current_setting('sm.demo_perf_device_id')::uuid
  ORDER BY recorded_at DESC LIMIT 20;
ROLLBACK;
BEGIN;
EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON)
  SELECT recorded_at,temperature,humidity,co2 FROM public.sensor_readings
  WHERE device_id=current_setting('sm.demo_perf_device_id')::uuid
  ORDER BY recorded_at DESC LIMIT 20;
ROLLBACK;
