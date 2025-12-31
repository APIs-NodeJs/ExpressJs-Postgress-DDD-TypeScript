-- migrations/001_create_outbox_events_table.sql
-- Migration to create outbox_events table for transactional outbox pattern

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  event_name VARCHAR(255) NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP,
  published_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON outbox_events(status);
CREATE INDEX IF NOT EXISTS idx_outbox_events_event_name ON outbox_events(event_name);
CREATE INDEX IF NOT EXISTS idx_outbox_events_aggregate_id ON outbox_events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_outbox_events_created_at ON outbox_events(created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_events_status_attempt ON outbox_events(status, attempt_count);

-- Add comment
COMMENT ON TABLE outbox_events IS 'Transactional outbox for reliable event publishing';

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outbox_events_updated_at
  BEFORE UPDATE ON outbox_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();