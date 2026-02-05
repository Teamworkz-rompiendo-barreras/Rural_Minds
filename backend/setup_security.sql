-- setup_storage.sql
-- Run this in your Supabase SQL Editor

-- 1. Create Buckets
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true);

insert into storage.buckets (id, name, public)
values ('private-docs', 'private-docs', false);

-- 2. Set up RLS for public-assets
-- Allow anyone to read
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'public-assets' );

-- Allow authenticated users to upload (adjust roles as needed)
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'public-assets' AND
  auth.role() = 'authenticated'
);

-- 3. Set up RLS for private-docs
-- Only owner can read (assuming path includes user/org ID)
create policy "Owner Access"
on storage.objects for select
using (
  bucket_id = 'private-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Only owner can insert
create policy "Owner Upload"
on storage.objects for insert
with check (
  bucket_id = 'private-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable RLS on Tables (Core Security)
alter table users enable row level security;
alter table organizations enable row level security;

-- Base Policies for Users
create policy "Users can view their own data"
on public.users for select
using ( auth.uid() = id );

create policy "Users can update their own data"
on public.users for update
using ( auth.uid() = id );
