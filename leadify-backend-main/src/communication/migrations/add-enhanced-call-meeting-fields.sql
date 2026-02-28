-- Migration: Add enhanced fields for Call Log and Meeting Notes modules
-- Date: 2026-02-28

-- ============================================================================
-- 1. Update comm_call_logs table with new fields
-- ============================================================================

-- Add transcription field
ALTER TABLE comm_call_logs
ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Add disposition field
ALTER TABLE comm_call_logs
ADD COLUMN IF NOT EXISTS disposition VARCHAR(50);

-- Add new call outcomes to enum (PostgreSQL specific)
-- Note: This requires checking if values already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_comm_call_logs_outcome'
    AND e.enumlabel = 'INTERESTED'
  ) THEN
    ALTER TYPE "enum_comm_call_logs_outcome" ADD VALUE 'INTERESTED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_comm_call_logs_outcome'
    AND e.enumlabel = 'NOT_INTERESTED'
  ) THEN
    ALTER TYPE "enum_comm_call_logs_outcome" ADD VALUE 'NOT_INTERESTED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_comm_call_logs_outcome'
    AND e.enumlabel = 'FOLLOW_UP'
  ) THEN
    ALTER TYPE "enum_comm_call_logs_outcome" ADD VALUE 'FOLLOW_UP';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_comm_call_logs_outcome'
    AND e.enumlabel = 'CALLBACK'
  ) THEN
    ALTER TYPE "enum_comm_call_logs_outcome" ADD VALUE 'CALLBACK';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_comm_call_logs_outcome'
    AND e.enumlabel = 'FAILED'
  ) THEN
    ALTER TYPE "enum_comm_call_logs_outcome" ADD VALUE 'FAILED';
  END IF;
END$$;

-- ============================================================================
-- 2. Create comm_meeting_notes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS comm_meeting_notes (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES comm_activities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  meeting_type VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
  meeting_date TIMESTAMP,
  attendees JSONB DEFAULT '[]',
  minutes TEXT,
  action_items JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  calendar_event_id VARCHAR(255),
  template_id VARCHAR(255),
  follow_ups JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT comm_meeting_notes_activity_id_key UNIQUE(activity_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comm_meeting_notes_activity_id
ON comm_meeting_notes(activity_id);

CREATE INDEX IF NOT EXISTS idx_comm_meeting_notes_meeting_date
ON comm_meeting_notes(meeting_date);

CREATE INDEX IF NOT EXISTS idx_comm_meeting_notes_meeting_type
ON comm_meeting_notes(meeting_type);

-- ============================================================================
-- 3. Add indexes to comm_call_logs for analytics queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comm_call_logs_outcome
ON comm_call_logs(outcome);

CREATE INDEX IF NOT EXISTS idx_comm_call_logs_disposition
ON comm_call_logs(disposition);

-- ============================================================================
-- 4. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN comm_call_logs.transcription IS 'Automatic or manual transcription of the call';
COMMENT ON COLUMN comm_call_logs.disposition IS 'Call disposition for lead qualification (interested, not_interested, follow_up, etc)';

COMMENT ON TABLE comm_meeting_notes IS 'Enhanced meeting notes with attendees, action items, and attachments';
COMMENT ON COLUMN comm_meeting_notes.attendees IS 'JSON array of meeting participants with id, name, email, type';
COMMENT ON COLUMN comm_meeting_notes.action_items IS 'JSON array of action items with task, assigneeId, assigneeName, dueDate, completed, linkedTaskId';
COMMENT ON COLUMN comm_meeting_notes.attachments IS 'JSON array of file attachments with name, url, type, size';
COMMENT ON COLUMN comm_meeting_notes.follow_ups IS 'JSON array of follow-up reminders with description, dueDate, status, reminderId';

-- ============================================================================
-- 5. Update trigger for updated_at on comm_meeting_notes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_comm_meeting_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comm_meeting_notes_updated_at ON comm_meeting_notes;

CREATE TRIGGER trigger_update_comm_meeting_notes_updated_at
BEFORE UPDATE ON comm_meeting_notes
FOR EACH ROW
EXECUTE FUNCTION update_comm_meeting_notes_updated_at();

-- ============================================================================
-- Migration complete
-- ============================================================================
