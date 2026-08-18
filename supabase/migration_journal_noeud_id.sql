-- Permet de rattacher une entrée de journal à un nœud précis (pas juste à
-- une branche), pour l'afficher directement dans l'accordéon "Mon journal
-- d'entraînement" du nœud sélectionné, dans la vue chemin par branche.
-- Reste optionnel : les entrées créées depuis /mentorship/journal (sans
-- contexte de nœud précis) gardent noeud_id à null, ce qui est normal.
--
-- Sans danger : ajoute une colonne nullable, ne touche à rien d'existant.
-- Déjà appliquée en base par Claude (Supabase MCP) le 18/08/2026.

alter table journal_entrainement add column if not exists noeud_id text;
