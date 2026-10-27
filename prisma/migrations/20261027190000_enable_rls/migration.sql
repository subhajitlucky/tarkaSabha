-- Enable Row Level Security on every table in the public schema.
--
-- Context: Supabase's security advisor reported `rls_disabled_in_public` and
-- `sensitive_columns_exposed`. The `anon` and `authenticated` PostgREST roles
-- hold full table grants on public, so without RLS anyone with the project URL
-- could read or mutate User, Session, Account and Provider rows (including
-- session tokens and API keys).
--
-- This is safe for the application: Prisma connects as the table owner
-- (`postgres`), which has BYPASSRLS, so all server-side queries are unaffected.
--
-- No policies are created on purpose. tarka-sabha does not use supabase-js or
-- PostgREST for data access; RLS with zero policies is fail-closed for anon and
-- authenticated. Add explicit policies before exposing any table through the
-- Supabase client.

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Approval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Artifact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Decision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DecisionCandidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DecisionPin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DossierShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Persona" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonaOnChat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Provider" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SourceSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceDossier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
