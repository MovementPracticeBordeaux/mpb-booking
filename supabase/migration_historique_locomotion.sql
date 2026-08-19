-- Historique de séances pour l'outil Locomotion ("shaker de mouvement") :
-- durée de la séance chronométrée + nombre de combinaisons tirées avec le
-- shaker pendant cette séance. Même principe que historique_reps_sets
-- (Force) et historique_figures (Figures) — jusqu'ici l'outil Locomotion
-- n'enregistrait rien, empêchant toute statistique de progression sur
-- cette branche.
create table if not exists historique_locomotion (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  duree_secondes integer not null,
  nb_combinaisons integer not null default 0,
  cree_le timestamptz not null default now()
);

alter table historique_locomotion enable row level security;

drop policy if exists "Élèves gèrent leur propre historique locomotion" on historique_locomotion;
create policy "Élèves gèrent leur propre historique locomotion"
  on historique_locomotion for all
  using (auth.uid() = eleve_id)
  with check (auth.uid() = eleve_id);

grant select, insert, delete on historique_locomotion to authenticated;
