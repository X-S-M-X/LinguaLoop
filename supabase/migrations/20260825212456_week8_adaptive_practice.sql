-- Week 8: store individual learning attempts for honest adaptive review.
-- Completion remains in public.progress. Attempts are append-only evidence.

create table if not exists public.learning_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  activity_type text not null check (
    activity_type in ('flashcard', 'quiz', 'speech', 'smart_review')
  ),
  was_correct boolean not null,
  score smallint check (score is null or score between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists learning_attempts_user_created_idx
  on public.learning_attempts (user_id, created_at desc);

create index if not exists learning_attempts_user_concept_idx
  on public.learning_attempts (user_id, concept_id);

alter table public.learning_attempts enable row level security;

drop policy if exists "Users can read their own learning attempts"
  on public.learning_attempts;
create policy "Users can read their own learning attempts"
  on public.learning_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own learning attempts"
  on public.learning_attempts;
create policy "Users can add their own learning attempts"
  on public.learning_attempts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on table public.learning_attempts from anon, authenticated;
grant select, insert on table public.learning_attempts to authenticated;
