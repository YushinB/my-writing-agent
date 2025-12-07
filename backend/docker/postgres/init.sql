-- PostgreSQL initialization script for ProsePolish
-- This script runs once when the PostgreSQL container is first created

-- Ensure database encoding is correct
SELECT 'Database initialization started' AS status;

-- Create extensions if needed (uncomment if you need them in the future)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone to UTC
ALTER DATABASE prosepolish_db SET timezone TO 'UTC';

SELECT 'Database initialization completed' AS status;
