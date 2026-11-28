-- Mentorat : bilan d'entrée rempli par l'élève à la première ouverture.
-- Sert à orienter ses priorités et à informer Sylvain (portrait de l'élève).
-- « blessures » : douleurs ou anciennes blessures déclarées, facultatif ;
-- lisible seulement par l'élève (RLS) et par le coach (service_role).
create table if not exists public.mentorship_bilan (
  eleve_id uuid primary key references auth.users(id) on delete cascade,
  experience text not null check (experience in ('debut', 'moins_1_an', '1_3_ans', 'plus_3_ans')),
  points_forts text[] not null default '{}',
  points_faibles text[] not null default '{}',
  objectif text,
  seances_semaine text not null check (seances_semaine in ('1_2', '3', '4_5')),
  blessures text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

alter table public.mentorship_bilan enable row level security;

drop policy if exists "bilan_select_own" on public.mentorship_bilan;
create policy "bilan_select_own" on public.mentorship_bilan
  for select to authenticated using (auth.uid() = eleve_id);

drop policy if exists "bilan_insert_own" on public.mentorship_bilan;
create policy "bilan_insert_own" on public.mentorship_bilan
  for insert to authenticated with check (auth.uid() = eleve_id);

drop policy if exists "bilan_update_own" on public.mentorship_bilan;
create policy "bilan_update_own" on public.mentorship_bilan
  for update to authenticated using (auth.uid() = eleve_id) with check (auth.uid() = eleve_id);

grant select, insert, update on public.mentorship_bilan to authenticated;
grant select, insert, update, delete on public.mentorship_bilan to service_role;
