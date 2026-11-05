-- Verification after REST/UI actions. No password/hash/token selected.
SELECT n.id,n.customer_id,n.status,count(i.id) AS tray_count,
  public.fn_rental_total_vnd(n.id) AS snapshot_total_vnd
FROM rentals n JOIN rental_items i ON i.rental_id=n.id
WHERE n.id=current_setting('sm.demo_rental_id')::uuid GROUP BY n.id;
SELECT status,amount_vnd,confirmed_by FROM transactions
WHERE rental_id=current_setting('sm.demo_rental_id')::uuid;
SELECT f.method,f.status,f.customer_id,h.weight_grams
FROM fulfillment_requests f JOIN harvests h ON h.id=f.harvest_id
WHERE h.id=current_setting('sm.demo_harvest_id')::uuid;
