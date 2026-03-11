-- 智言汉语（chinese-edu-platform）Supabase 数据库初始化
-- 适用：Supabase Dashboard -> SQL Editor 直接执行

-- 扩展
create extension if not exists "pgcrypto";

-- profiles：与 auth.users 一对一
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  avatar_url text,
  level int not null default 1,
  experience int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- words：词库
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  pinyin text not null,
  type text not null,
  level text not null,
  definition text not null,
  etymology text,
  examples text[] not null default '{}'::text[],
  synonyms text[] not null default '{}'::text[],
  antonyms text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

-- user_words：用户生词本/学习状态
create table if not exists public.user_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  status text not null default 'new' check (status in ('new','learning','mastered')),
  review_count int not null default 0,
  correct_count int not null default 0,
  last_reviewed timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, word_id)
);

-- learning_records：学习记录（用于统计）
create table if not exists public.learning_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  correct boolean not null,
  learned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- chat_history：对话记录（可选）
create table if not exists public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- updated_at 自动更新时间
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_words_updated_at on public.user_words;
create trigger trg_user_words_updated_at
before update on public.user_words
for each row execute function public.set_updated_at();

-- 新用户注册时自动创建 profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_words enable row level security;
alter table public.learning_records enable row level security;
alter table public.chat_history enable row level security;

-- profiles：本人可读写
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- user_words：本人可读写
drop policy if exists "user_words_select_own" on public.user_words;
create policy "user_words_select_own"
on public.user_words for select
using (auth.uid() = user_id);

drop policy if exists "user_words_insert_own" on public.user_words;
create policy "user_words_insert_own"
on public.user_words for insert
with check (auth.uid() = user_id);

drop policy if exists "user_words_update_own" on public.user_words;
create policy "user_words_update_own"
on public.user_words for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_words_delete_own" on public.user_words;
create policy "user_words_delete_own"
on public.user_words for delete
using (auth.uid() = user_id);

-- learning_records：本人可读写
drop policy if exists "learning_records_select_own" on public.learning_records;
create policy "learning_records_select_own"
on public.learning_records for select
using (auth.uid() = user_id);

drop policy if exists "learning_records_insert_own" on public.learning_records;
create policy "learning_records_insert_own"
on public.learning_records for insert
with check (auth.uid() = user_id);

-- chat_history：本人可读写
drop policy if exists "chat_history_select_own" on public.chat_history;
create policy "chat_history_select_own"
on public.chat_history for select
using (auth.uid() = user_id);

drop policy if exists "chat_history_insert_own" on public.chat_history;
create policy "chat_history_insert_own"
on public.chat_history for insert
with check (auth.uid() = user_id);

-- words：默认所有人可读（前端词典/练习需要）
-- 如你想仅登录可读，把 USING(true) 改为 auth.role() = 'authenticated'
alter table public.words enable row level security;
drop policy if exists "words_select_public" on public.words;
create policy "words_select_public"
on public.words for select
using (true);

