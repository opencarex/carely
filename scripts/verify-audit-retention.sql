-- Run by hand in psql against the approved development database, using the
-- application role (not a superuser). This probe is always rolled back.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE probe_id uuid;
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id)
  VALUES ('foundation.retention_probe', 'session', 'retention-probe')
  RETURNING id INTO probe_id;
  BEGIN
    UPDATE audit_log SET action = 'foundation.changed' WHERE id = probe_id;
    RAISE EXCEPTION 'FAIL: audit UPDATE was accepted';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: audit UPDATE rejected';
  END;
  BEGIN
    DELETE FROM audit_log WHERE id = probe_id;
    RAISE EXCEPTION 'FAIL: audit DELETE was accepted';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: audit DELETE rejected';
  END;
END;
$$;
ROLLBACK;
