/**
 * Shiftwave Ambassador Tool — Supabase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://supabase.com and create a free project (takes ~2 min)
 * 2. In your project dashboard: Settings → API
 *    - Copy "Project URL" → paste as SUPABASE_URL below
 *    - Copy "anon public" key → paste as SUPABASE_ANON_KEY below
 * 3. In the SQL Editor, run the schema below to create the tables
 * 4. Save this file and push to GitHub
 *
 * ─── SQL SCHEMA (run once in Supabase SQL Editor) ──────────────────────────
 *
 *   create table evaluations (
 *     id text primary key,
 *     data jsonb not null,
 *     created_at timestamptz default now(),
 *     updated_at timestamptz default now()
 *   );
 *
 *   create table app_config (
 *     id int primary key default 1,
 *     data jsonb not null,
 *     history jsonb default '[]'::jsonb,
 *     updated_at timestamptz default now()
 *   );
 *
 *   -- Allow public read/write (internal tool — protected by password gate)
 *   alter table evaluations enable row level security;
 *   alter table app_config enable row level security;
 *   create policy "allow_all" on evaluations for all using (true) with check (true);
 *   create policy "allow_all" on app_config for all using (true) with check (true);
 *
 * ───────────────────────────────────────────────────────────────────────────
 */

window.SUPABASE_URL  = 'https://fhuhgfcqbeqyjaioaxtr.supabase.co';
window.SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodWhnZmNxYmVxeWphaW9heHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTI1MDAsImV4cCI6MjA5NjIyODUwMH0.EhZKTMidXXpwwUpyske_tatozIx7PvPZymKi-rny8j0';

/**
 * Password gate config.
 * Change SW_PASSWORD to whatever you want your team to use.
 * All employees share this single password.
 */
window.SW_PASSWORD = 'shiftwave';
