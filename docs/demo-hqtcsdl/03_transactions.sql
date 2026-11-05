-- Changes apply only to the disposable lab room. COMMIT and ROLLBACK are real.
BEGIN;
UPDATE rooms SET description='HQ demo committed' WHERE id=current_setting('sm.demo_room_id')::uuid;
COMMIT;
BEGIN;
UPDATE rooms SET description='This value must roll back' WHERE id=current_setting('sm.demo_room_id')::uuid;
ROLLBACK;
SELECT description FROM rooms WHERE id=current_setting('sm.demo_room_id')::uuid;

-- PL/pgSQL exception blocks are subtransactions: the first INSERT rolls back
-- when the second INSERT violates the active-tray unique index.
DO $$
DECLARE attempted uuid:=gen_random_uuid();
BEGIN
  BEGIN
    INSERT INTO rentals(id,customer_id,plan_id,price_per_tray_vnd,duration_days,expected_end_at,created_by)
      SELECT attempted,customer_id,plan_id,price_per_tray_vnd,duration_days,now()+interval '30 days',created_by
      FROM rentals WHERE id=current_setting('sm.demo_rental_id')::uuid;
    INSERT INTO rental_items(rental_id,tray_id)
      SELECT attempted,tray_id FROM rental_items WHERE rental_id=current_setting('sm.demo_rental_id')::uuid LIMIT 1;
    RAISE EXCEPTION 'FAIL: active tray was booked twice';
  EXCEPTION WHEN unique_violation THEN
    IF EXISTS(SELECT 1 FROM rentals WHERE id=attempted) THEN
      RAISE EXCEPTION 'FAIL: orphan rental survived rollback';
    END IF;
    RAISE NOTICE 'PASS: failed multi-table booking leaves no orphan rental';
  END;
END $$;
