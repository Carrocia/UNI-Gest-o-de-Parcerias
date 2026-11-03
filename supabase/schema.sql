-- Execute once in Supabase > SQL Editor to create the starter tables.
create table if not exists public.parcerias (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Publicidade',
  status text not null default 'Ativa',
  offer text,
  benefit text,
  url text,
  contact text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data date not null,
  partnership_id uuid not null references public.parcerias(id) on delete cascade,
  data_contato date,
  data_materiais date,
  tarefa text
);

-- Starter version: public access is enabled for app use without login.
-- Before storing sensitive information or opening the site publicly, add authentication and tighten these policies.
alter table public.parcerias enable row level security;
alter table public.eventos enable row level security;
create policy "Permuta starter read parcerias" on public.parcerias for select to anon using (true);
create policy "Permuta starter add parcerias" on public.parcerias for insert to anon with check (true);
create policy "Permuta starter read eventos" on public.eventos for select to anon using (true);
create policy "Permuta starter add eventos" on public.eventos for insert to anon with check (true);
