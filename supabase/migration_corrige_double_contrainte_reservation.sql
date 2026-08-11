-- Corrige un vrai bug : impossible de re-reserver un creneau deja annule.
--
-- La table reservations avait DEUX contraintes d'unicite qui se marchaient
-- dessus :
-- 1) La contrainte d'origine du schema initial (schema.sql) :
--    unique (eleve_id, cours_id, date_seance) - bloque tout doublon PEU
--    IMPORTE le statut, donc aussi apres une annulation (la ligne annulee
--    reste en base, et re-inserer une ligne confirmee pour le meme
--    creneau violait cette contrainte).
-- 2) L'index partiel ajoute plus tard (migration_reservation_atomique.sql) :
--    reservations_unique_confirmee ... where statut = 'confirmee' - celui-la
--    est correct, il ne bloque que les doublons reellement confirmes.
--
-- La contrainte d'origine (1) n'avait jamais ete retiree, elle continuait
-- donc a bloquer les re-reservations meme si l'index partiel (2) suffit a
-- lui seul a empecher les vrais doublons.
--
-- Sans danger : retire une contrainte redondante, ne touche a aucune
-- donnee. A executer une seule fois dans le SQL Editor de Supabase.

alter table reservations drop constraint if exists reservations_eleve_id_cours_id_date_seance_key;

-- Si jamais cette commande ne trouve rien à supprimer (nom de contrainte
-- différent selon l'historique exact de la base), la requête suivante
-- affiche le vrai nom à utiliser à la place :
--
--   select conname from pg_constraint
--   where conrelid = 'reservations'::regclass and contype = 'u';
