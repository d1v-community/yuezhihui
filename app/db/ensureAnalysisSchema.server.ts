import { sql } from "drizzle-orm";
import { db } from "./db.server";

// Best-effort self-healing for prod/dev DBs that missed SQL migrations.
// Keep this in sync with `drizzle/0003_analysis_cycles_share.sql`.
let ensuredOnce: Promise<void> | null = null;

export async function ensureAnalysisSchema(): Promise<void> {
  if (ensuredOnce) return ensuredOnce;

  ensuredOnce = (async () => {
    // 1) Analysis cycles table.
    await db.execute(
      sql.raw(`
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
        )
      `),
    );

    await db.execute(
      sql.raw(
        `create unique index if not exists menstrual_cycle_user_start_uq on menstrual_cycle(user_id, start_date)`,
      ),
    );
    await db.execute(
      sql.raw(
        `create index if not exists menstrual_cycle_user_start_idx on menstrual_cycle(user_id, start_date desc)`,
      ),
    );

    // 2) Attach cycle markers (nullable).
    await db.execute(
      sql.raw(
        `alter table menstrual_daily add column if not exists cycle_id integer references menstrual_cycle(id) on delete set null`,
      ),
    );
    await db.execute(
      sql.raw(`create index if not exists menstrual_daily_cycle_id_idx on menstrual_daily(cycle_id)`),
    );

    await db.execute(
      sql.raw(
        `alter table menstrual_event add column if not exists cycle_id integer references menstrual_cycle(id) on delete set null`,
      ),
    );
    await db.execute(
      sql.raw(`create index if not exists menstrual_event_cycle_id_idx on menstrual_event(cycle_id)`),
    );

    // 3) Share records (used by /api/share/*).
    await db.execute(
      sql.raw(`
        create table if not exists share_record (
          id bigserial primary key,
          owner_user_id text not null references users(id) on delete cascade,
          share_code char(32) not null,
          share_type text not null,
          params_json jsonb,
          expire_at timestamp,
          created_at timestamp not null default now()
        )
      `),
    );
    await db.execute(
      sql.raw(`create unique index if not exists share_record_share_code_uq on share_record(share_code)`),
    );
    await db.execute(
      sql.raw(
        `create index if not exists share_record_owner_created_at_idx on share_record(owner_user_id, created_at desc)`,
      ),
    );
    await db.execute(sql.raw(`create index if not exists share_record_expire_at_idx on share_record(expire_at)`));
  })().catch((err) => {
    // Allow retry on transient failures (e.g. cold-start / network hiccup).
    ensuredOnce = null;
    throw err;
  });

  return ensuredOnce;
}
