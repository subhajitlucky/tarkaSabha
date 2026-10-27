-- Remove Supabase API-role access from the public schema.
--
-- RLS now blocks every row for `anon` and `authenticated`, but those roles still
-- hold full table grants. tarka-sabha never uses supabase-js, PostgREST or
-- GraphQL: all access goes through Prisma as the owner (`postgres`). Revoking
-- the unused grants removes the API surface entirely, including capabilities RLS
-- does not cover (for example TRUNCATE).
--
-- The owner and service_role are untouched.

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Stop tables created by future migrations (which run as the `postgres` owner)
-- from re-acquiring the API grants Supabase installs by default.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
