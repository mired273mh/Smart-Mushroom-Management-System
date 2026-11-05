-- DBA only, dedicated Smart Mushroom DB, AFTER migrations.
-- Supply EXISTING fresh non-superuser/non-owner roles and db_name using psql -v.
-- Does not create users/passwords or alter cluster authentication.
BEGIN;
SELECT set_config('smart_mushroom.runtime_role', :'runtime_role', true);
SELECT set_config('smart_mushroom.report_role', :'report_role', true);
DO $$
DECLARE target record; role_count integer;
BEGIN
  SELECT count(*) INTO role_count FROM pg_roles WHERE rolname IN
    (current_setting('smart_mushroom.runtime_role'),current_setting('smart_mushroom.report_role'));
  IF role_count<>2 THEN RAISE EXCEPTION 'Supply two distinct existing fresh roles'; END IF;
  FOR target IN SELECT * FROM pg_roles WHERE rolname IN
    (current_setting('smart_mushroom.runtime_role'),current_setting('smart_mushroom.report_role')) LOOP
    IF target.rolsuper OR target.rolcreaterole OR target.rolcreatedb OR target.rolbypassrls OR
      pg_has_role(target.oid,(SELECT datdba FROM pg_database WHERE datname=current_database()),'MEMBER') THEN
      RAISE EXCEPTION 'Runtime/report role must not be privileged or a member of the database owner';
    END IF;
  END LOOP;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
-- Reapply after pg_restore --no-privileges: routine default EXECUTE is PUBLIC.
REVOKE ALL ON FUNCTION public.guard_historical_identity(),public.guard_fulfillment_owner(),public.fn_rental_total_vnd(uuid) FROM PUBLIC;
REVOKE ALL ON PROCEDURE public.sp_confirm_rental_payment(uuid,uuid) FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO :"runtime_role",:"report_role";
GRANT USAGE ON SCHEMA public TO :"runtime_role",:"report_role";
GRANT SELECT,INSERT,UPDATE ON
  public.users,public.rooms,public.trays,public.rental_plans,
  public.rental_items,public.transactions,public.fulfillment_requests,
  public.devices,public.room_thresholds,public.device_commands,public.notifications
  TO :"runtime_role";
GRANT SELECT,INSERT ON public.rentals TO :"runtime_role";
GRANT UPDATE(status,completed_at) ON public.rentals TO :"runtime_role";
GRANT SELECT,INSERT,DELETE ON public.sessions TO :"runtime_role";
GRANT SELECT,INSERT ON public.growth_events,public.harvests,public.sensor_readings TO :"runtime_role";
GRANT SELECT ON public.v_room_cultivation_summary,public.v_room_environment_24h
  TO :"runtime_role",:"report_role";
GRANT EXECUTE ON FUNCTION public.fn_rental_total_vnd(uuid) TO :"runtime_role";
GRANT EXECUTE ON PROCEDURE public.sp_confirm_rental_payment(uuid,uuid) TO :"runtime_role";
COMMIT;
