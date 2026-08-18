-- Historique des tentatives de l'outil Figures : nom de la figure (ex.
-- handstand) + durée de chaque tentative chronométrée dans la session,
-- avec lieu/ressenti optionnels. Même logique que historique_reps_sets
-- côté Force, adaptée aux figures en équilibre (durée tenue plutôt que
-- répétitions).
--
-- Sans danger : ajoute une nouvelle table, ne touche à rien d'existant.
-- Déjà appliquée en base par Claude (Supabase MCP) le 18/08/2026.

create table if not exists historique_figures (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  figure text not null,
  tentatives text not null,   -- durées en secondes, séparées par virgule, ex. '12,8,15'
  lieu text,
  ressenti text,
  cree_le timestamptz not null default now()
);

alter table historique_figures enable row level security;

create policy figures_lecture_propre on historique_figures
  for select using (auth.uid() = eleve_id);

create policy figures_ecriture_propre on historique_figures
  for insert with check (auth.uid() = eleve_id);

create policy figures_suppression_propre on historique_figures
  for delete using (auth.uid() = eleve_id);

grant select, insert, delete on table historique_figures to authenticated;
