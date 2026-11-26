-- Mentorat : « coups de cœur ». L'élève met un cœur sur un exercice qu'il aime
-- pratiquer pour le plaisir, sans objectif de validation. Une ligne par
-- élève et par exercice (module_id = `${noeudId}::${exerciceId}`).
create table if not exists public.mentorship_coeur (
  eleve_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  cree_le timestamptz not null default now(),
  primary key (eleve_id, module_id)
);

alter table public.mentorship_coeur enable row level security;

drop policy if exists "coeur_select_own" on public.mentorship_coeur;
create policy "coeur_select_own" on public.mentorship_coeur
  for select to authenticated using (auth.uid() = eleve_id);

drop policy if exists "coeur_insert_own" on public.mentorship_coeur;
create policy "coeur_insert_own" on public.mentorship_coeur
  for insert to authenticated with check (auth.uid() = eleve_id);

drop policy if exists "coeur_delete_own" on public.mentorship_coeur;
create policy "coeur_delete_own" on public.mentorship_coeur
  for delete to authenticated using (auth.uid() = eleve_id);

grant select, insert, delete on public.mentorship_coeur to authenticated;
grant select, insert, update, delete on public.mentorship_coeur to service_role;
