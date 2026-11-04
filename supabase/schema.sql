-- Shafi Mobile Zone database schema
-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.mobiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  model text,
  price numeric(12,2) not null default 0 check (price >= 0),
  ram text,
  storage text,
  battery text,
  camera text,
  display text,
  processor text,
  condition text not null default 'New' check (condition in ('New','Used')),
  location text,
  description text,
  image_url text,
  stock_quantity integer not null default 1 check (stock_quantity >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mobile_requests (
  id uuid primary key default gen_random_uuid(),
  mobile_id uuid references public.mobiles(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending','contacted','approved','completed','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text,
  body text not null,
  status text not null default 'unread' check (status in ('unread','read','replied','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  total_amount numeric(12,2) not null check (total_amount > 0),
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mobile_id uuid not null references public.mobiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id,mobile_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mobile_id uuid not null references public.mobiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(user_id,mobile_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.increment_mobile_request_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.mobile_id is not null then
    update public.mobiles set request_count = request_count + 1 where id = new.mobile_id;
  end if;
  return new;
end;
$$;
drop trigger if exists mobile_request_count_trigger on public.mobile_requests;
create trigger mobile_request_count_trigger after insert on public.mobile_requests
for each row execute procedure public.increment_mobile_request_count();

alter table public.profiles enable row level security;
alter table public.mobiles enable row level security;
alter table public.mobile_requests enable row level security;
alter table public.messages enable row level security;
alter table public.sales enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

-- Profiles: users can read/update their own profile; admins can manage all.
drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profile update own or admin" on public.profiles;
create policy "profile update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Prevent users from changing their own role through the client.
create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() and new.role <> old.role then
    raise exception 'Only an administrator can change account roles';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger before update on public.profiles
for each row execute procedure public.protect_profile_role();

drop policy if exists "public read active mobiles" on public.mobiles;
create policy "public read active mobiles" on public.mobiles for select using (is_active = true or public.is_admin());
drop policy if exists "admin insert mobiles" on public.mobiles;
create policy "admin insert mobiles" on public.mobiles for insert with check (public.is_admin());
drop policy if exists "admin update mobiles" on public.mobiles;
create policy "admin update mobiles" on public.mobiles for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete mobiles" on public.mobiles;
create policy "admin delete mobiles" on public.mobiles for delete using (public.is_admin());

drop policy if exists "customer create own requests" on public.mobile_requests;
create policy "customer create own requests" on public.mobile_requests for insert with check (user_id = auth.uid());
drop policy if exists "read own requests or admin" on public.mobile_requests;
create policy "read own requests or admin" on public.mobile_requests for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin update requests" on public.mobile_requests;
create policy "admin update requests" on public.mobile_requests for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customer create own messages" on public.messages;
create policy "customer create own messages" on public.messages for insert with check (user_id = auth.uid());
drop policy if exists "read own messages or admin" on public.messages;
create policy "read own messages or admin" on public.messages for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin update messages" on public.messages;
create policy "admin update messages" on public.messages for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage sales" on public.sales;
create policy "admin manage sales" on public.sales for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users manage own favorites" on public.favorites;
create policy "users manage own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews for select using (true);
drop policy if exists "users create own reviews" on public.reviews;
create policy "users create own reviews" on public.reviews for insert with check (user_id = auth.uid());
drop policy if exists "users update own reviews" on public.reviews;
create policy "users update own reviews" on public.reviews for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- Storage bucket for product images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mobile-images','mobile-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "public view mobile images" on storage.objects;
create policy "public view mobile images" on storage.objects for select using (bucket_id = 'mobile-images');
drop policy if exists "admin upload mobile images" on storage.objects;
create policy "admin upload mobile images" on storage.objects for insert with check (bucket_id = 'mobile-images' and public.is_admin());
drop policy if exists "admin update mobile images" on storage.objects;
create policy "admin update mobile images" on storage.objects for update using (bucket_id = 'mobile-images' and public.is_admin()) with check (bucket_id = 'mobile-images' and public.is_admin());
drop policy if exists "admin delete mobile images" on storage.objects;
create policy "admin delete mobile images" on storage.objects for delete using (bucket_id = 'mobile-images' and public.is_admin());

-- IMPORTANT: Promote your own account to admin manually after signing up:
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_ADDRESS';
-- Never expose the Supabase service_role key in frontend code.
