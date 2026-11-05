CREATE INDEX rentals_time_id_idx ON rentals(starts_at DESC, id DESC);
CREATE INDEX rentals_customer_time_id_idx ON rentals(customer_id, starts_at DESC, id DESC);
CREATE INDEX rentals_status_time_id_idx ON rentals(status, starts_at DESC, id DESC);
