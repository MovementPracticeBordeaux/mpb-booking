-- Ajoute la ou les branches couvertes par un abonnement Mentorat. Manquait
-- dans la refonte multi-abonnements : le modèle capturait la durée et le
-- nombre de branches (via formule_nom, ex. 'mentorship_2branches_6') mais
-- pas QUELLES branches précisément — nécessaire pour attribuer un accès
-- réel et, plus tard, pour filtrer l'arbre de compétences en conséquence.
--
-- Sans danger : ajoute une colonne nullable, ne touche à rien d'existant.
-- Déjà appliquée en base par Claude (Supabase MCP) le 18/08/2026.

alter table abonnements add column if not exists branches text;
-- ex. 'force' ou 'force,figures' — utilisé uniquement pour categorie='mentorat'
