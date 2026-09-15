-- Signature Prints PH — Job Tracker schema
-- Run this once in your Supabase project's SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  customer text not null,
  job_type text,
  description text,
  quantity text,
  due_date date,
  price numeric,
  rush boolean default false,
  notes text,
  stage text not null default 'quote',
  payment_status text not null default 'unpaid',
  invoice_number text,
  approval_status text not null default 'pending',
  approval_note text,
  created_at timestamptz default now()
);

create table if not exists job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  uploaded_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supplies text,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  qty_on_hand numeric,
  unit text,
  reorder_point numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists counters (
  id int primary key default 1,
  job_counter int not null default 1000,
  invoice_counter int not null default 500
);
insert into counters (id, job_counter, invoice_counter)
  values (1, 1000, 500)
  on conflict (id) do nothing;

-- Realtime: let the app subscribe to live changes on every table
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table job_files;
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table suppliers;
alter publication supabase_realtime add table materials;
alter publication supabase_realtime add table counters;

-- Row Level Security
-- This app has no login system — it's a shared team tool, same as the Claude version.
-- These policies let anyone with your site's URL and its public "anon" key read and write.
-- That matches how the shared board worked inside Claude. If you later want a password
-- or login before people can edit, that's a further step we can add.
alter table jobs enable row level security;
alter table job_files enable row level security;
alter table customers enable row level security;
alter table suppliers enable row level security;
alter table materials enable row level security;
alter table counters enable row level security;

create policy "public read jobs" on jobs for select using (true);
create policy "public write jobs" on jobs for insert with check (true);
create policy "public update jobs" on jobs for update using (true);
create policy "public delete jobs" on jobs for delete using (true);

create policy "public read job_files" on job_files for select using (true);
create policy "public write job_files" on job_files for insert with check (true);
create policy "public delete job_files" on job_files for delete using (true);

create policy "public read customers" on customers for select using (true);
create policy "public write customers" on customers for insert with check (true);
create policy "public update customers" on customers for update using (true);
create policy "public delete customers" on customers for delete using (true);

create policy "public read suppliers" on suppliers for select using (true);
create policy "public write suppliers" on suppliers for insert with check (true);
create policy "public update suppliers" on suppliers for update using (true);
create policy "public delete suppliers" on suppliers for delete using (true);

create policy "public read materials" on materials for select using (true);
create policy "public write materials" on materials for insert with check (true);
create policy "public update materials" on materials for update using (true);
create policy "public delete materials" on materials for delete using (true);

create policy "public read counters" on counters for select using (true);
create policy "public update counters" on counters for update using (true);

-- Atomic "next number" functions, so two people creating a job/invoice
-- at the same moment never get the same number.
create or replace function next_job_number() returns text as $$
declare
  new_val int;
begin
  update counters set job_counter = job_counter + 1 where id = 1 returning job_counter into new_val;
  return 'PR-' || (new_val - 1);
end;
$$ language plpgsql;

create or replace function next_invoice_number() returns text as $$
declare
  new_val int;
begin
  update counters set invoice_counter = invoice_counter + 1 where id = 1 returning invoice_counter into new_val;
  return 'INV-' || (new_val - 1);
end;
$$ language plpgsql;

-- Make sure the public "anon" key (what your hosted site uses) can actually
-- read/write these tables and call the functions above.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- File uploads: proofs, references, and 3D models attached to a job
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('job-files', 'job-files', true)
  on conflict (id) do nothing;

create policy "public read job files bucket" on storage.objects
  for select using (bucket_id = 'job-files');
create policy "public upload job files bucket" on storage.objects
  for insert with check (bucket_id = 'job-files');
create policy "public delete job files bucket" on storage.objects
  for delete using (bucket_id = 'job-files');
