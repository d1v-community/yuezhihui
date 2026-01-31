-- Analysis (menstrual_cycle + cycle_id), Share (share_record)

-- 1) Menstrual cycles (computed groups)
create table if not exists menstrual_cycle (
  id serial primary key,
  user_id text not null references users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days_count integer not null default 0,
  total_volume_ml integer not null default 0,
  level_status text,
  distribution_status text,
  color_status text,
  clot_status text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create unique index if not exists menstrual_cycle_user_start_uq
  on menstrual_cycle(user_id, start_date);
create index if not exists menstrual_cycle_user_start_idx
  on menstrual_cycle(user_id, start_date desc);

-- 2) Attach cycle_id to daily/event rows (nullable; recomputed on demand)
alter table menstrual_daily
  add column if not exists cycle_id integer references menstrual_cycle(id) on delete set null;
create index if not exists menstrual_daily_cycle_id_idx on menstrual_daily(cycle_id);

alter table menstrual_event
  add column if not exists cycle_id integer references menstrual_cycle(id) on delete set null;
create index if not exists menstrual_event_cycle_id_idx on menstrual_event(cycle_id);

-- 3) Share records (store params; compute data on read)
create table if not exists share_record (
  id bigserial primary key,
  owner_user_id text not null references users(id) on delete cascade,
  share_code char(32) not null,
  share_type text not null,
  params_json jsonb,
  expire_at timestamp,
  created_at timestamp not null default now()
);

create unique index if not exists share_record_share_code_uq on share_record(share_code);
create index if not exists share_record_owner_created_at_idx on share_record(owner_user_id, created_at desc);
create index if not exists share_record_expire_at_idx on share_record(expire_at);

