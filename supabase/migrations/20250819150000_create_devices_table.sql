-- Create devices table for tracking user sessions across devices
create table if not exists public.devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  device_id text not null, -- Unique identifier for the device
  device_name text, -- User-friendly name for the device
  device_type text, -- mobile, desktop, tablet, etc.
  browser text, -- Browser information
  os text, -- Operating system
  ip_address text, -- IP address (hashed for privacy)
  last_active timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  is_current boolean default false, -- Whether this is the current device
  refresh_token_hash text, -- Hashed refresh token for security
  unique(user_id, device_id)
);

-- Enable RLS
alter table public.devices enable row level security;

-- Policies
create policy "Users can view their own devices" on public.devices
  for select using (auth.uid() = user_id);

create policy "Users can insert their own devices" on public.devices
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own devices" on public.devices
  for update using (auth.uid() = user_id);

create policy "Users can delete their own devices" on public.devices
  for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists devices_user_id_idx on public.devices (user_id);
create index if not exists devices_device_id_idx on public.devices (device_id);
create index if not exists devices_last_active_idx on public.devices (last_active);