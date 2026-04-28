# PerfPath

Your perfusion career. One path.

## Tech Stack
- React + Vite
- Tailwind CSS
- Supabase (auth + database)
- React Router v6

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

Then edit `.env`:
```
VITE_SUPABASE_URL=https://uokuyjtbpecwllollsha.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set up Supabase

Make sure your `profiles` table exists with this schema:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  user_type text check (user_type in ('pre_applicant', 'student', 'ccp')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in Vercel dashboard
4. Connect PerfPath.com domain in Vercel settings

## Project Structure
```
src/
  lib/
    supabase.js        # Supabase client
    AuthContext.jsx    # Auth state + functions
  pages/
    Landing.jsx        # Home screen
    SignUp.jsx         # Create account
    ChoosePath.jsx     # User type selection
    LogIn.jsx          # Login screen
    Dashboard.jsx      # Protected dashboard router
  components/
    PreApplicantDashboard.jsx
    StudentDashboard.jsx
    CCPDashboard.jsx
```

## Color Palette
- Navy: `#1B2B4B`
- Red: `#C0392B`
- White: `#F5F5F5`
