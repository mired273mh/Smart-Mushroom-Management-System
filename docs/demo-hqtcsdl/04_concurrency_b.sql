-- Session B: run while A holds its tray lock. Expected error: SQLSTATE 23505.
-- psql ON_ERROR_STOP closes this failed transaction; interactive use: ROLLBACK.
BEGIN;
SELECT set_config('sm.race_new_rental',gen_random_uuid()::text,true);
SELECT id FROM trays WHERE id=current_setting('sm.demo_race_tray_id')::uuid FOR UPDATE;
INSERT INTO rentals(id,customer_id,plan_id,price_per_tray_vnd,duration_days,expected_end_at,created_by)
  SELECT current_setting('sm.race_new_rental')::uuid,customer_id,plan_id,price_per_tray_vnd,duration_days,
    now()+interval '30 days',created_by FROM rentals WHERE id=current_setting('sm.demo_rental_id')::uuid;
INSERT INTO rental_items(rental_id,tray_id)
  VALUES(current_setting('sm.race_new_rental')::uuid,current_setting('sm.demo_race_tray_id')::uuid);
INSERT INTO transactions(rental_id,amount_vnd)
  SELECT current_setting('sm.race_new_rental')::uuid,public.fn_rental_total_vnd(current_setting('sm.race_new_rental')::uuid);
COMMIT;
