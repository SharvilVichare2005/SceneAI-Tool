-- PostgreSQL schema for the web workspace. The MVP API currently uses an in-memory
-- adapter so the existing local inference server stays zero-config.
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  task text not null check (task in ('detection', 'segmentation', 'classification')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  object_key text not null,
  mime_type text not null,
  width integer,
  height integer,
  annotation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists training_runs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  model text not null,
  status text not null default 'queued',
  config jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  weights_key text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists assets_project_idx on assets(project_id);
create index if not exists training_runs_project_idx on training_runs(project_id);
