-- Ajoute la date de debut effective de la formule en cours, necessaire pour
-- calculer le recouvrement avec les periodes de vacances (voir
-- migration suivante / lib/vacances.ts). Sans cette date, impossible de
-- savoir si une periode de vacances tombe bien DANS la periode payee par
-- l'eleve.
--
-- Sans danger : ajoute juste une colonne, ne touche a aucune donnee
-- existante. Les profils deja crees auront cette colonne a NULL (pas de
-- prolongation automatique retroactive pour eux, seulement pour les futurs
-- achats/attributions - une valeur estimee serait trop peu fiable).
-- A executer une seule fois dans le SQL Editor de Supabase.

alter table profiles add column if not exists date_debut_formule date;
