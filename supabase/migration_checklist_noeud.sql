-- Checklist personnelle de sous-étapes à l'intérieur d'un nœud : l'élève
-- découpe librement son objectif en petits paliers (ex. "1 répétition" ->
-- "3 répétitions" -> "5 répétitions") et les coche au fur et à mesure.
-- Purement informel et personnel — ça ne débloque rien, ne remplace pas la
-- validation vidéo de Sylvain, sert juste à voir une progression *dans* un
-- nœud qui peut prendre plusieurs mois, plutôt que de n'avoir que
-- "verrouillé / débloqué / acquis".
--
-- Sans danger : ajoute une nouvelle table, ne touche à rien d'existant.
-- Déjà appliquée en base par Claude (Supabase MCP) le 18/08/2026.

create table if not exists checklist_noeud (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  noeud_id text not null,     -- correspond à NoeudMentorship.id (lib/mentorship-modules.ts)
  texte text not null,
  coche boolean not null default false,
  ordre int not null default 0,
  cree_le timestamptz not null default now()
);

alter table checklist_noeud enable row level security;

create policy checklist_lecture_propre on checklist_noeud
  for select using (auth.uid() = eleve_id);

create policy checklist_ecriture_propre on checklist_noeud
  for insert with check (auth.uid() = eleve_id);

create policy checklist_maj_propre on checklist_noeud
  for update using (auth.uid() = eleve_id);

create policy checklist_suppression_propre on checklist_noeud
  for delete using (auth.uid() = eleve_id);

grant select, insert, update, delete on table checklist_noeud to authenticated;
