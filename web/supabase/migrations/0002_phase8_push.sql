-- Phase 8 Pillar 2 — Agents text first (proactive / async messaging)
-- Adds: push_subscriptions, scheduled_touches; extends profiles with prefs.

alter table public.profiles
    add column if not exists push_enabled       boolean not null default false,
    add column if not exists muted_characters   text[]  not null default '{}',
    add column if not exists quiet_hours_start  smallint not null default 23
        check (quiet_hours_start between 0 and 23),
    add column if not exists quiet_hours_end    smallint not null default 7
        check (quiet_hours_end   between 0 and 23),
    add column if not exists timezone           text not null default 'UTC';

-- One row per (user, browser/device). One user may have several subscriptions
-- (laptop + phone). The endpoint URL is unique — we upsert on it.
create table public.push_subscriptions (
    id          bigserial primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    endpoint    text not null unique,
    p256dh_key  text not null,
    auth_key    text not null,
    user_agent  text,
    last_used_at timestamptz,
    created_at  timestamptz not null default now()
);
create index push_subs_user on public.push_subscriptions (user_id);

-- Queue of upcoming proactive messages. The dispatcher cron reads rows where
-- scheduled_at <= now() and sent_at is null, generates the message via Claude,
-- pushes it, sets sent_at + stores the message text.
create table public.scheduled_touches (
    id            bigserial primary key,
    user_id       uuid not null references auth.users(id) on delete cascade,
    character     text not null check (character in
                    ('Monica','Joey','Ross','Chandler','Rachel','Phoebe')),
    scheduled_at  timestamptz not null,
    sent_at       timestamptz,
    message       text,
    failure_reason text,
    created_at    timestamptz not null default now()
);
create index touches_due
    on public.scheduled_touches (scheduled_at)
    where sent_at is null;
create index touches_user_recent
    on public.scheduled_touches (user_id, scheduled_at desc);

-- RLS — users see only their own rows. The dispatcher uses the service-role
-- client (bypasses RLS) so it can read across users.
alter table public.push_subscriptions enable row level security;
alter table public.scheduled_touches  enable row level security;

create policy "own push subs" on public.push_subscriptions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own touches" on public.scheduled_touches
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
