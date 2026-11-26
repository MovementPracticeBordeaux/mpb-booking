-- Mentorat : options de parcours propres à chaque élève.
-- armure_acceleree : l'élève qui a déjà une bonne base ouvre les trois niveaux
-- de l'Armure Organique d'un coup (QCM et vidéos dans l'ordre qu'il veut).
-- L'Armure doit toujours être validée en entier avant les branches.
create table if not exists public.mentorship_options (
  eleve_id uuid primary key references auth.users(id) on delete cascade,
  armure_acceleree boolean not null default false,
  modifie_le timestamptz not null default now()
);

alter table public.mentorship_options enable row level security;

drop policy if exists "options_select_own" on public.mentorship_options;
create policy "options_select_own" on public.mentorship_options
  for select to authenticated using (auth.uid() = eleve_id);

drop policy if exists "options_insert_own" on public.mentorship_options;
create policy "options_insert_own" on public.mentorship_options
  for insert to authenticated with check (auth.uid() = eleve_id);

drop policy if exists "options_update_own" on public.mentorship_options;
create policy "options_update_own" on public.mentorship_options
  for update to authenticated using (auth.uid() = eleve_id) with check (auth.uid() = eleve_id);

grant select, insert, update on public.mentorship_options to authenticated;
grant select, insert, update, delete on public.mentorship_options to service_role;
