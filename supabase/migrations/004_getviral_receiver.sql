create table if not exists public.getviral_delivery_nonces (
  key_id text not null,
  nonce text not null check (nonce ~ '^[a-f0-9]{48}$'),
  created_at timestamptz not null default now(),
  primary key (key_id, nonce)
);

create index if not exists getviral_delivery_nonces_created_at_idx
  on public.getviral_delivery_nonces (created_at);

alter table public.getviral_delivery_nonces enable row level security;
revoke all on table public.getviral_delivery_nonces from anon, authenticated;
grant all on table public.getviral_delivery_nonces to service_role;
