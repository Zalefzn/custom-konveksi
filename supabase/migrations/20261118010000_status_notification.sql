-- Status terakhir yang sudah dikirim ke WA pembeli (agar tiap status hanya dikirim sekali)
alter table public.orders add column if not exists wa_status_notified text;
