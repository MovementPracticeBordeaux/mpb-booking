-- Journal d'entraînement : log simple et rapide (texte, pas de vidéo) pour
-- que l'élève garde une trace de ses tentatives entre deux validations —
-- utile sur les nœuds longs (plusieurs mois) où il n'y a rien à soumettre
-- au quotidien. Chaque élève ne voit et ne modifie que ses propres entrées.
--
-- Sans danger : ajoute une nouvelle table, ne touche à rien d'existant.
-- Déjà appliquée en base par Claude (Supabase MCP) le 17/08/2026.

create table if not exists journal_entrainement (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  branche text not null,          -- 'force' | 'figures' | 'locomotion' | 'connexion' | 'flexibilite' | 'tronc'
  contenu text not null,
  cree_le timestamptz not null default now()
);

alter table journal_entrainement enable row level security;

create policy journal_lecture_propre on journal_entrainement
  for select using (auth.uid() = eleve_id);

create policy journal_ecriture_propre on journal_entrainement
  for insert with check (auth.uid() = eleve_id);

create policy journal_suppression_propre on journal_entrainement
  for delete using (auth.uid() = eleve_id);

grant select, insert, delete on table journal_entrainement to authenticated;
