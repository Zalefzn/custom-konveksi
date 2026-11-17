-- =========================================================
-- RSCustom: tabel pesanan, storage desain, realtime
-- Jalankan lewat `supabase db push` atau tempel di SQL Editor.
-- =========================================================

-- ---------- Admin ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admin lihat daftar admin" on public.admins;
create policy "admin lihat daftar admin" on public.admins
  for select to authenticated using (public.is_admin());

-- ---------- Pesanan ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'baru'
    check (status in ('baru', 'dikonfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),

  product text not null check (char_length(product) <= 50),
  model text check (char_length(model) <= 80),
  color_name text check (char_length(color_name) <= 50),
  color_hex text check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  details jsonb not null default '{}'::jsonb,
  label jsonb,
  design_type text check (design_type in ('full', 'galeri', 'jasa')),
  gallery_choice text check (char_length(gallery_choice) <= 80),
  brief text check (char_length(brief) <= 2000),
  sizes jsonb not null default '{}'::jsonb,
  total_qty integer not null check (total_qty between 1 and 100000),
  needed_date date,
  note text check (char_length(note) <= 2000),

  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (customer_phone ~ '^(\+?62|0)8[0-9]{7,12}$'),
  customer_email text not null check (char_length(customer_email) <= 150),
  address text not null check (char_length(address) between 10 and 500),

  preview_url text,
  design_urls text[] not null default '{}',
  label_logo_url text,

  wa_admin_sent_at timestamptz,
  wa_customer_sent_at timestamptz,
  wa_error text
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

-- Pengunjung (anon) hanya boleh MEMBUAT pesanan baru, tidak bisa membaca/mengubah.
drop policy if exists "pengunjung buat pesanan" on public.orders;
create policy "pengunjung buat pesanan" on public.orders
  for insert to anon, authenticated
  with check (
    status = 'baru'
    and wa_admin_sent_at is null
    and wa_customer_sent_at is null
    and wa_error is null
  );

drop policy if exists "admin lihat pesanan" on public.orders;
create policy "admin lihat pesanan" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "admin ubah pesanan" on public.orders;
create policy "admin ubah pesanan" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- updated_at otomatis
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------- Realtime ----------
-- 1) Dashboard admin: dengarkan perubahan tabel lewat WebSocket (postgres_changes)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- 2) Halaman pembeli: status pesanan dikirim lewat broadcast ke topik "order-<id>".
--    Pembeli tidak punya akses SELECT, jadi yang dikirim hanya status (tanpa data pribadi).
create or replace function public.broadcast_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform realtime.send(
      jsonb_build_object('status', new.status, 'updated_at', new.updated_at),
      'status',
      'order-' || new.id::text,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_broadcast_status on public.orders;
create trigger orders_broadcast_status after update of status on public.orders
  for each row execute function public.broadcast_order_status();

-- ---------- Storage: file desain ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-designs', 'order-designs', true, 5242880, array['image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Pengunjung boleh upload (tidak boleh menimpa/menghapus). Path: <uuid pesanan>/<nama>.png|jpg
drop policy if exists "pengunjung upload desain" on storage.objects;
create policy "pengunjung upload desain" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'order-designs'
    and name ~ '^[0-9a-f-]{36}/[a-z0-9-]{1,40}\.(png|jpg)$'
  );
