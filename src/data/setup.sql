-- Protocol Library table
create table protocols (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null,
  summary text,
  content text,
  submitted_by_id uuid references auth.users on delete set null,
  submitted_by_name text,
  approved boolean default false,
  featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table protocols enable row level security;

-- Anyone can read approved protocols
create policy "Anyone can view approved protocols"
  on protocols for select
  using (approved = true);

-- Authenticated users can insert (submit)
create policy "Authenticated users can submit protocols"
  on protocols for insert
  with check (auth.uid() is not null);

-- Admin can do everything (handled in app logic)
create policy "Admin full access"
  on protocols for all
  using (auth.uid() = '1f7435a2-3ecb-4218-aeb5-569a8e869c08'::uuid);

-- Hospital Directory submissions
create table hospital_submissions (
  id uuid default gen_random_uuid() primary key,
  hospital_name text not null,
  city_state text not null,
  pump_type text,
  call_structure text,
  case_volume text,
  hiring_status text,
  notes text,
  submitted_by_id uuid references auth.users on delete set null,
  submitted_by_name text,
  approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table hospital_submissions enable row level security;

create policy "Authenticated users can submit hospitals"
  on hospital_submissions for insert
  with check (auth.uid() is not null);

create policy "Admin can manage hospital submissions"
  on hospital_submissions for all
  using (auth.uid() = '1f7435a2-3ecb-4218-aeb5-569a8e869c08'::uuid);
