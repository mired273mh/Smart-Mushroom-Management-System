-- Additive migration. Refuse inconsistent existing data; never repair/delete it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.fulfillment_requests f
    JOIN public.harvests h ON h.id=f.harvest_id
    JOIN public.rental_items i ON i.id=h.rental_item_id
    JOIN public.rentals n ON n.id=i.rental_id
    WHERE f.customer_id IS DISTINCT FROM n.customer_id
  ) THEN
    RAISE EXCEPTION 'Existing fulfillment ownership mismatch: review data before migration'
      USING ERRCODE='23514';
  END IF;
END $$;

-- Historical ownership links cannot be rewired behind the API's tenant checks.
CREATE FUNCTION public.guard_historical_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE column_name text;
BEGIN
  FOREACH column_name IN ARRAY TG_ARGV LOOP
    IF (to_jsonb(NEW)->column_name) IS DISTINCT FROM (to_jsonb(OLD)->column_name) THEN
      RAISE EXCEPTION 'Historical identity cannot be changed: %.%',TG_TABLE_NAME,column_name
        USING ERRCODE='23514',CONSTRAINT='historical_identity_immutable';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER rentals_identity BEFORE UPDATE OF customer_id ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.guard_historical_identity('customer_id');
CREATE TRIGGER items_identity BEFORE UPDATE OF rental_id,tray_id ON public.rental_items
  FOR EACH ROW EXECUTE FUNCTION public.guard_historical_identity('rental_id','tray_id');
CREATE TRIGGER harvests_identity BEFORE UPDATE OF rental_item_id ON public.harvests
  FOR EACH ROW EXECUTE FUNCTION public.guard_historical_identity('rental_item_id');
CREATE TRIGGER fulfillment_identity BEFORE UPDATE OF harvest_id,customer_id ON public.fulfillment_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_historical_identity('harvest_id','customer_id');

CREATE FUNCTION public.guard_fulfillment_owner() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT n.customer_id INTO owner_id FROM public.harvests h
    JOIN public.rental_items i ON i.id=h.rental_item_id
    JOIN public.rentals n ON n.id=i.rental_id WHERE h.id=NEW.harvest_id;
  -- Missing parent is reported by the FK, preserving SQLSTATE 23503.
  IF FOUND AND NEW.customer_id IS DISTINCT FROM owner_id THEN
    RAISE EXCEPTION 'Fulfillment customer must own the harvested rental item'
      USING ERRCODE='23514',CONSTRAINT='fulfillment_customer_ownership';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fulfillment_owner BEFORE INSERT OR UPDATE OF harvest_id,customer_id
  ON public.fulfillment_requests FOR EACH ROW EXECUTE FUNCTION public.guard_fulfillment_owner();

-- Canonical reporting queries used by GET /reports, not demo-only copies.
CREATE VIEW public.v_room_cultivation_summary AS
  SELECT r.id,r.name,count(DISTINCT t.id)::int AS tray_count,
    count(DISTINCT i.id) FILTER (WHERE i.ended_at IS NULL)::int AS rented_trays,
    coalesce(sum(h.weight_grams),0)::bigint AS harvested_grams
  FROM public.rooms r LEFT JOIN public.trays t ON t.room_id=r.id
  LEFT JOIN public.rental_items i ON i.tray_id=t.id
  LEFT JOIN public.harvests h ON h.rental_item_id=i.id GROUP BY r.id;
CREATE VIEW public.v_room_environment_24h AS
  SELECT r.id,r.name,round(avg(s.temperature)::numeric,2) AS avg_temperature,
    round(avg(s.humidity)::numeric,2) AS avg_humidity,
    round(avg(s.co2)::numeric,0) AS avg_co2,count(s.id)::int AS sample_count,
    count(s.id) FILTER (WHERE s.simulated)::int AS simulated_sample_count,
    count(s.id) FILTER (WHERE NOT s.simulated)::int AS hardware_sample_count
  FROM public.rooms r LEFT JOIN public.devices d ON d.room_id=r.id
  LEFT JOIN public.sensor_readings s ON s.device_id=d.id AND s.recorded_at>now()-interval '24 hours'
  GROUP BY r.id;

-- Price comes from the signed rental snapshot, never today's plan price.
CREATE FUNCTION public.fn_rental_total_vnd(p_rental_id uuid) RETURNS bigint
LANGUAGE plpgsql STABLE STRICT SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE total bigint;
BEGIN
  SELECT n.price_per_tray_vnd::bigint*count(i.id) INTO total
    FROM public.rentals n LEFT JOIN public.rental_items i ON i.rental_id=n.id
    WHERE n.id=p_rental_id GROUP BY n.id;
  RETURN total;
END $$;

-- Replaces the API's payment UPDATE. No internal COMMIT: the caller owns ACID.
CREATE PROCEDURE public.sp_confirm_rental_payment(p_transaction_id uuid,p_actor_id uuid)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
  PERFORM id FROM public.users WHERE id=p_actor_id AND role IN ('admin','operator')
    AND active AND deleted_at IS NULL FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment actor must be active staff' USING ERRCODE='23514';
  END IF;
  UPDATE public.transactions SET status='paid',confirmed_by=p_actor_id,confirmed_at=clock_timestamp()
    WHERE id=p_transaction_id AND status='pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction is not pending' USING ERRCODE='P1001';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.guard_historical_identity(),public.guard_fulfillment_owner(),public.fn_rental_total_vnd(uuid) FROM PUBLIC;
REVOKE ALL ON PROCEDURE public.sp_confirm_rental_payment(uuid,uuid) FROM PUBLIC;
COMMENT ON FUNCTION public.fn_rental_total_vnd(uuid) IS 'Rental snapshot unit price times item count; bigint VND; NULL for missing rental';
COMMENT ON VIEW public.v_room_environment_24h IS '24h room aggregates including provenance counts; hardware mode is not proof of physical measurement';
