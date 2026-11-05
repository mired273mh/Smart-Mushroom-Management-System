-- SIMULATOR data only. Device mode is provenance, not physical attestation.
SELECT count(*) AS sample_count,bool_and(simulated) AS all_simulated,
  min(temperature) AS min_celsius,max(humidity) AS max_rh,max(co2) AS max_co2_ppm
FROM sensor_readings WHERE device_id=current_setting('sm.demo_device_id')::uuid;
SELECT s.recorded_at,s.temperature,s.humidity,s.co2,s.simulated FROM sensor_readings s
WHERE s.device_id=current_setting('sm.demo_device_id')::uuid ORDER BY s.recorded_at;
SELECT c.actuator,c.enabled,c.dry_run,c.status,c.result FROM device_commands c
WHERE c.device_id=current_setting('sm.demo_device_id')::uuid ORDER BY c.created_at;
SELECT kind,count(*) FROM notifications WHERE reading_id IN
  (SELECT id FROM sensor_readings WHERE device_id=current_setting('sm.demo_device_id')::uuid)
GROUP BY kind HAVING count(*)>0;
