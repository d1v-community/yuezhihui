-- User preferences (minimal)
-- Store whether the user typically uses tampons. NULL means "unset" (keep current default behavior).

alter table users
  add column if not exists use_tampon boolean;

