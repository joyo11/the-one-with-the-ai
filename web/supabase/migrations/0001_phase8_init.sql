-- Phase 8 Pillar 1 — Be the 7th Friend (identity + memory)
-- Tables: profiles, memories, conversations, messages
-- RLS: every table is user-scoped; a user can only read/write their own rows.
-- Auto-create profile row on auth.users insert.

-- profiles: user identity surface. id mirrors auth.users.id.
create table public.profiles (
    id                  uuid primary key references auth.users(id) on delete cascade,
    display_name        text,
    favorite_character  text check (favorite_character in
                          ('Monica','Joey','Ross','Chandler','Rachel','Phoebe')),
    about               text,
    onboarded_at        timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- memories: facts characters know about the user.
-- character = '*' means a global fact every character can see.
create table public.memories (
    id                  bigserial primary key,
    user_id             uuid not null references auth.users(id) on delete cascade,
    character           text not null check (character in
                          ('Monica','Joey','Ross','Chandler','Rachel','Phoebe','*')),
    fact                text not null,
    source_message_id   uuid,
    confidence          real not null default 0.7,
    created_at          timestamptz not null default now()
);
create index memories_user_char_recent
    on public.memories (user_id, character, created_at desc);

-- conversations: one open thread per (user, character).
create table public.conversations (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    character   text not null check (character in
                  ('Monica','Joey','Ross','Chandler','Rachel','Phoebe')),
    created_at  timestamptz not null default now(),
    unique (user_id, character)
);

-- messages: ordered chat history per conversation.
create table public.messages (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    role            text not null check (role in ('user','assistant')),
    content         text not null,
    created_at      timestamptz not null default now()
);
create index messages_conv_time on public.messages (conversation_id, created_at);

-- RLS
alter table public.profiles      enable row level security;
alter table public.memories      enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

create policy "own profile"      on public.profiles
    for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own memories"     on public.memories
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own conversations" on public.conversations
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages"     on public.messages
    for all using (
        exists (
            select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid()
        )
    );

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id) values (new.id)
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
