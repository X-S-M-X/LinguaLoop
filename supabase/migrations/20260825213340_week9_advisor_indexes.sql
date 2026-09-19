-- Cover the new foreign keys reported by the Supabase performance advisor.

create index if not exists learning_attempts_concept_id_idx
  on public.learning_attempts (concept_id);

create index if not exists ai_session_runs_unit_id_idx
  on public.ai_session_runs (unit_id);
