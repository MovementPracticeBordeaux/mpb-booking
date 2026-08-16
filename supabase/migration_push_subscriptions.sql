-- Abonnements aux notifications push (une ligne par appareil/navigateur
-- abonné). Un élève peut avoir plusieurs abonnements (plusieurs appareils).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

grant all on push_subscriptions to service_role;
grant select, insert, update, delete on push_subscriptions to authenticated;

drop policy if exists "Élèves gèrent leurs propres abonnements push" on push_subscriptions;
create policy "Élèves gèrent leurs propres abonnements push"
  on push_subscriptions for all
  using (auth.uid() = eleve_id)
  with check (auth.uid() = eleve_id);

create index if not exists push_subscriptions_eleve_id_idx on push_subscriptions(eleve_id);
