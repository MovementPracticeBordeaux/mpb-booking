-- Historique reps/sets de l'outil Force : chaque série d'un exercice compté
-- (nom + reps par set) enregistrée avec date/heure automatiques, et
-- optionnellement lieu + ressenti. Distinct du journal d'entraînement
-- (texte libre) : ici la donnée est structurée, pour permettre plus tard
-- des graphiques de progression par exercice si utile.
--
-- Sans danger : ajoute une nouvelle table, ne touche à rien d'existant.
-- Déjà appliquée en base par Claude (Supabase MCP) le 18/08/2026.

create table if not exists historique_reps_sets (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  exercice text not null,
  reps_par_set text not null,   -- ex. '8,7,6,5' (une valeur par set réalisé)
  lieu text,
  ressenti text,
  cree_le timestamptz not null default now()
);

alter table historique_reps_sets enable row level security;

create policy historique_lecture_propre on historique_reps_sets
  for select using (auth.uid() = eleve_id);

create policy historique_ecriture_propre on historique_reps_sets
  for insert with check (auth.uid() = eleve_id);

create policy historique_suppression_propre on historique_reps_sets
  for delete using (auth.uid() = eleve_id);

grant select, insert, delete on table historique_reps_sets to authenticated;
