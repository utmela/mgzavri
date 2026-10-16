-- Fresh installations only: existing tables are left intact for schema review.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role text not null default 'passenger',
  created_at timestamptz not null default now()
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  driver_name text not null,
  phone text not null,
  from_city text not null,
  to_city text not null,
  departure_time timestamptz not null,
  vehicle_type text not null,
  seats_total integer not null,
  seats_available integer not null,
  price_per_seat numeric(10,2) not null check (price_per_seat >= 0),
  accessories text[] not null default '{}',
  notes text,
  plate_number text,
  vehicle_color text,
  created_at timestamptz not null default now(),
  constraint rides_different_cities check (from_city <> to_city)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,
  passenger_name text,
  passenger_phone text,
  seats_booked integer not null check (seats_booked > 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  payment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_city text not null,
  to_city text not null,
  departure_date date not null,
  passengers integer not null check (passengers between 1 and 30),
  budget numeric(10,2) check (budget >= 0),
  phone text not null,
  note text,
  accessories text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint requests_different_cities check (from_city <> to_city)
);

alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.bookings enable row level security;
alter table public.requests enable row level security;

commit;
