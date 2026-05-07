alter table users
  add column if not exists deleted_at timestamp,
  add column if not exists deletion_reason text;
