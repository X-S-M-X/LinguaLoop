-- Week 9: opt-in AI practice sessions with a server-enforced daily limit.

alter table public.profiles
  add column if not exists ai_coaching_enabled boolean not null default false;

alter table public.learning_attempts
  drop constraint if exists learning_attempts_activity_type_check;

alter table public.learning_attempts
  add constraint learning_attempts_activity_type_check
  check (activity_type in ('flashcard', 'quiz', 'speech', 'smart_review', 'ai_review'));

create table if not exists public.ai_session_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  model text not null check (char_length(model) between 1 and 80),
  created_at timestamptz not null default now()
);

create index if not exists ai_session_runs_user_created_idx
  on public.ai_session_runs (user_id, created_at desc);

alter table public.ai_session_runs enable row level security;

drop policy if exists "Users can read their own AI session history"
  on public.ai_session_runs;
create policy "Users can read their own AI session history"
  on public.ai_session_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.ai_session_runs from anon, authenticated;
grant select on table public.ai_session_runs to authenticated;

create or replace function public.reserve_ai_session(
  requested_unit_id uuid,
  requested_model text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  today_count integer;
begin
  if caller_id is null
    or requested_unit_id is null
    or requested_model is null
    or char_length(requested_model) not between 1 and 80 then
    return false;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = caller_id
      and ai_coaching_enabled = true
  ) or not exists (
    select 1
    from public.units
    where id = requested_unit_id
  ) then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(caller_id::text, 0)
  );

  select count(*)
  into today_count
  from public.ai_session_runs
  where user_id = caller_id
    and created_at >= pg_catalog.date_trunc('day', pg_catalog.now());

  if today_count >= 10 then
    return false;
  end if;

  insert into public.ai_session_runs (user_id, unit_id, model)
  values (caller_id, requested_unit_id, requested_model);

  return true;
end;
$$;

revoke all on function public.reserve_ai_session(uuid, text) from public, anon;
grant execute on function public.reserve_ai_session(uuid, text) to authenticated;
