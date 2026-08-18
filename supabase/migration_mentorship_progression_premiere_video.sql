-- Conserve la toute première vidéo soumise sur un module (nœud tronc ou
-- exercice de branche), même après resoumission — jusqu'ici, `video_url`
-- était écrasé à chaque nouvel envoi, perdant toute trace de la première
-- tentative. Permet une comparaison "avant / après" dans la vue chemin.
--
-- Ne se remplit qu'une seule fois par module (logique appliquée côté
-- application : on ne met à jour premiere_video_url que s'il est encore
-- null au moment de la soumission).
--
-- Sans danger : ajoute deux colonnes nullables, ne touche à rien
-- d'existant. Déjà appliquée en base par Claude (Supabase MCP) le 18/08/2026.

alter table mentorship_progression add column if not exists premiere_video_url text;
alter table mentorship_progression add column if not exists premiere_video_date timestamptz;
