-- Menstrual (daily + events), products (brands + series), feedback

create table if not exists menstrual_daily (
  user_id text not null references users(id) on delete cascade,
  record_date date not null,
  has_bleeding boolean not null default false,
  total_volume_ml integer not null default 0,
  day_color text,
  clot_small_count integer not null default 0,
  clot_large_count integer not null default 0,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create unique index if not exists menstrual_daily_user_date_uq
  on menstrual_daily(user_id, record_date);
create index if not exists menstrual_daily_user_id_idx on menstrual_daily(user_id);
create index if not exists menstrual_daily_record_date_idx on menstrual_daily(record_date);

create table if not exists menstrual_event (
  id serial primary key,
  user_id text not null references users(id) on delete cascade,
  record_date date not null,
  event_time timestamp not null,
  event_type text not null,
  volume_ml integer not null default 0,
  color text,
  product_type text,
  brand text,
  series text,
  length_mm integer,
  model text,
  absorbency text,
  symptom_name text,
  created_at timestamp not null default now()
);

create index if not exists menstrual_event_user_date_idx on menstrual_event(user_id, record_date);
create index if not exists menstrual_event_user_date_time_idx on menstrual_event(user_id, record_date, event_time);

create table if not exists product_brands (
  id serial primary key,
  type text not null,
  name text not null,
  sort integer not null default 0,
  created_at timestamp not null default now()
);
create index if not exists product_brands_type_idx on product_brands(type);
create unique index if not exists product_brands_type_name_uq on product_brands(type, name);

create table if not exists product_series (
  id serial primary key,
  brand_id integer not null references product_brands(id) on delete cascade,
  name text not null,
  sort integer not null default 0,
  created_at timestamp not null default now()
);
create index if not exists product_series_brand_id_idx on product_series(brand_id);
create unique index if not exists product_series_brand_name_uq on product_series(brand_id, name);

create table if not exists feedback (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type_index integer not null default 0,
  content text not null,
  contact text,
  images jsonb,
  meta jsonb,
  created_at timestamp not null default now()
);
create index if not exists feedback_user_id_idx on feedback(user_id);
create index if not exists feedback_created_at_idx on feedback(created_at);

