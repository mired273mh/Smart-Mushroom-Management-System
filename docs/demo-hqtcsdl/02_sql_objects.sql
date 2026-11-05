-- Load private lab variables first. All writes in this example are rolled back.
BEGIN;
SELECT * FROM public.v_room_cultivation_summary ORDER BY name;
SELECT * FROM public.v_room_environment_24h ORDER BY name;
SELECT public.fn_rental_total_vnd(current_setting('sm.demo_rental_id')::uuid) AS snapshot_total_vnd;
CALL public.sp_confirm_rental_payment(
  current_setting('sm.demo_transaction_id')::uuid,current_setting('sm.demo_staff_id')::uuid);
SELECT status,confirmed_at FROM transactions WHERE id=current_setting('sm.demo_transaction_id')::uuid;
DO $$
BEGIN
  BEGIN
    INSERT INTO fulfillment_requests(harvest_id,customer_id,method)
    VALUES(current_setting('sm.demo_harvest_id')::uuid,current_setting('sm.demo_other_id')::uuid,'pickup');
    RAISE EXCEPTION 'FAIL: mismatched customer was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: DB trigger rejects cross-customer fulfillment (23514)';
  END;
END $$;
ROLLBACK;
