-- Phase 8 Pillar 2 — in-app inbox for proactive touches
-- Adds a read_at column so the chat UI can render unread touches as the
-- character's first message in the thread, then mark them read.

alter table public.scheduled_touches
    add column if not exists read_at timestamptz;

create index if not exists touches_unread
    on public.scheduled_touches (user_id, character)
    where read_at is null and sent_at is not null;
