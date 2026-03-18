-- ============================================
-- Power BI Read-Only User Setup
-- Auto-runs when PostgreSQL container starts
-- ============================================

-- Create read-only user for Power BI
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'powerbi_user') THEN
    CREATE USER powerbi_user WITH PASSWORD 'CtWPFyv8uEBOGGxRKKDkZuYS';
  ELSE
    ALTER USER powerbi_user WITH PASSWORD 'CtWPFyv8uEBOGGxRKKDkZuYS';
  END IF;
END
$$;

-- Grant connection access
GRANT CONNECT ON DATABASE leadify TO powerbi_user;

-- Grant schema access
GRANT USAGE ON SCHEMA public TO powerbi_user;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powerbi_user;

-- Grant SELECT on future tables automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powerbi_user;
