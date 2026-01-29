-- Onboarding V2: sessions + per-question answers (supports resume position)

create table if not exists onboarding_sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  version text not null default 'v2',
  status text not null default 'in_progress',
  current_question_id text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  completed_at timestamp
);

-- At most one in-progress onboarding session per (user, version)
create unique index if not exists onboarding_sessions_user_version_in_progress_uq
  on onboarding_sessions(user_id, version)
  where status = 'in_progress';

create index if not exists onboarding_sessions_user_id_idx on onboarding_sessions(user_id);

create table if not exists onboarding_answers (
  id text primary key,
  session_id text not null references onboarding_sessions(id) on delete cascade,
  question_id text not null,
  answer jsonb not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create unique index if not exists onboarding_answers_session_question_uq
  on onboarding_answers(session_id, question_id);

create index if not exists onboarding_answers_session_id_idx on onboarding_answers(session_id);

