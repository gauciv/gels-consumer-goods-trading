-- Team members table for the About section
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  avatar_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.team_members enable row level security;

create policy "Anyone can read team members"
  on public.team_members for select
  using (true);

create policy "Admins can manage team members"
  on public.team_members for all
  using (public.is_admin());

-- Updated_at trigger
create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.update_updated_at();

-- Storage bucket for team avatars (public, no auth needed to read)
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Storage policies: anyone can read, admins can upload/update/delete
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Admin avatar upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and public.is_admin());

create policy "Admin avatar update"
  on storage.objects for update
  using (bucket_id = 'avatars' and public.is_admin());

create policy "Admin avatar delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and public.is_admin());
