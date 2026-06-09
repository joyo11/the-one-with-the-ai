-- Phase 8 Pillar 3 — Living World
-- Events the gang has on their calendar. Drive proactive touches + ground
-- chat. NOT user-scoped — these are GLOBAL world state, visible to all.

create table public.events (
    id          bigserial primary key,
    -- Which characters are involved (1+). Multi-character events let Monica's
    -- dinner reference Ross's drama at the same dinner.
    characters  text[] not null check (
        array_length(characters, 1) >= 1
        and characters <@ array['Monica','Joey','Ross','Chandler','Rachel','Phoebe']
    ),
    kind        text not null,  -- 'audition', 'dinner', 'gig', 'date', 'work', etc.
    title       text not null,  -- "Joey auditions for sci-fi movie"
    detail      text,           -- optional extra context the model can use
    -- Calendar slot. start_at is when the event begins in the world.
    start_at    timestamptz not null,
    duration_minutes int not null default 60,
    status      text not null default 'upcoming'
        check (status in ('upcoming','happening','done','cancelled')),
    created_at  timestamptz not null default now()
);
create index events_time on public.events (start_at);
create index events_chars on public.events using gin (characters);
create index events_status on public.events (status, start_at);

-- World events are readable by everyone, including anonymous browsers.
-- Writes happen via the service-role client (seeder + admin tools).
alter table public.events enable row level security;

create policy "anyone can read events" on public.events
    for select using (true);
-- No insert/update/delete policies — service-role only.
