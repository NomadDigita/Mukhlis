-- Mukhlis voice portfolio: private drafts, public published work, owner-managed access.
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.portfolio_admins enable row level security;

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text check (description is null or char_length(description) <= 1200),
  category text not null default 'Arabic' check (char_length(category) <= 80),
  media_type text not null check (media_type in ('audio', 'video')),
  storage_path text not null unique,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.works enable row level security;

-- SECURITY DEFINER avoids recursive RLS when the admin table is consulted.
create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

drop policy if exists "Admins read own allow-list row" on public.portfolio_admins;
drop policy if exists "Admins can read own membership" on public.portfolio_admins;
create policy "Admins read own allow-list row" on public.portfolio_admins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Public reads published" on public.works;
drop policy if exists "Public reads published works" on public.works;
drop policy if exists "Admins read all works" on public.works;
drop policy if exists "Admin inserts" on public.works;
drop policy if exists "Admins insert works" on public.works;
drop policy if exists "Admin updates" on public.works;
drop policy if exists "Admins update works" on public.works;
drop policy if exists "Admin deletes" on public.works;
drop policy if exists "Admins delete works" on public.works;
create policy "Public reads published works" on public.works
  for select to anon, authenticated using (published or (select public.is_portfolio_admin()));
create policy "Admins insert works" on public.works
  for insert to authenticated with check ((select public.is_portfolio_admin()));
create policy "Admins update works" on public.works
  for update to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "Admins delete works" on public.works
  for delete to authenticated using ((select public.is_portfolio_admin()));

-- Keep media private. Public playback is provided through expiring signed URLs
-- only for media whose portfolio record is published.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media', 'portfolio-media', false, 524288000,
  array[
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/flac',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload media" on storage.objects;
drop policy if exists "Admins read media" on storage.objects;
drop policy if exists "Admins delete media" on storage.objects;
drop policy if exists "Public signs published media" on storage.objects;
drop policy if exists "Read published or admin media" on storage.objects;
create policy "Admins upload media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'portfolio-media' and (select public.is_portfolio_admin())
  );
create policy "Admins read media" on storage.objects
  for select to authenticated using (
    bucket_id = 'portfolio-media' and (select public.is_portfolio_admin())
  );
create policy "Public signs published media" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'portfolio-media' and exists (
      select 1 from public.works
      where works.storage_path = storage.objects.name and works.published = true
    )
  );
create policy "Admins delete media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'portfolio-media' and (select public.is_portfolio_admin())
  );

-- After creating Auth users for Mukhlis and any approved studio editors,
-- grant access by UUID through the Supabase SQL editor:
-- insert into public.portfolio_admins(user_id) values ('AUTH_USER_UUID');
