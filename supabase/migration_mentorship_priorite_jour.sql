-- Mentorat : priorité choisie par l'élève pour sa séance du jour (Force,
-- Flexibilité, Figures ou Locomotion). Une ligne par élève et par jour
-- (jour à l'heure de Paris). Sert à composer la séance (l'essentiel = la
-- priorité) et à récompenser la priorité tenue.
create table if not exists public.mentorship_priorite_jour (
  eleve_id uuid not null references auth.users(id) on delete cascade,
  jour date not null,
  priorite text not null check (priorite in ('force', 'flexibilite', 'figures', 'locomotion')),
  cree_le timestamptz not null default now(),
  primary key (eleve_id, jour)
);

alter table public.mentorship_priorite_jour enable row level security;

drop policy if exists "priorite_select_own" on public.mentorship_priorite_jour;
create policy "priorite_select_own" on public.mentorship_priorite_jour
  for select to authenticated using (auth.uid() = eleve_id);

drop policy if exists "priorite_insert_own" on public.mentorship_priorite_jour;
create policy "priorite_insert_own" on public.mentorship_priorite_jour
  for insert to authenticated with check (auth.uid() = eleve_id);

drop policy if exists "priorite_update_own" on public.mentorship_priorite_jour;
create policy "priorite_update_own" on public.mentorship_priorite_jour
  for update to authenticated using (auth.uid() = eleve_id) with check (auth.uid() = eleve_id);

grant select, insert, update on public.mentorship_priorite_jour to authenticated;
grant select, insert, update, delete on public.mentorship_priorite_jour to service_role;
