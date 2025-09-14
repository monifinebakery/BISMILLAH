alter table public.bahan_baku
  alter column tanggal_kadaluwarsa type timestamptz using tanggal_kadaluwarsa::timestamptz;
