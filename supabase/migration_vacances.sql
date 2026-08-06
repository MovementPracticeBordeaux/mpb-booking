-- Ajoute une période de vacances optionnelle à la semaine de référence.
-- Tant que la date du jour est comprise entre vacances_debut et vacances_fin
-- (inclus), le planning affiche un message "en vacances" au lieu des cours,
-- et les jours concernés sont grisés/non réservables.
-- Migration additive, sans danger pour les données existantes : à exécuter
-- une seule fois dans le SQL Editor de Supabase.

alter table semaine_reference add column if not exists vacances_debut date;
alter table semaine_reference add column if not exists vacances_fin date;
