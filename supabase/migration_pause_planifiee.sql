-- Ajoute la possibilité de planifier la date de reprise d'un pass gelé
-- (au lieu de devoir dégeler manuellement au bon moment). Un cron quotidien
-- (voir app/api/cron/rappels/route.ts) dégèle automatiquement tout pass dont
-- la date de reprise prévue est atteinte.
--
-- Sans danger : ajoute juste une colonne, ne touche à aucune donnée existante.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

alter table profiles add column if not exists date_fin_gel_prevue date;
