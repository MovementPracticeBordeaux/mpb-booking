-- Corrige un bug de sécurité RLS : les policies "cours_select_all" et
-- "semaine_ref_select_all" exigeaient d'être connecté (authenticated), alors
-- que ces deux tables sont censées être publiques (le planning doit être
-- visible sans compte). Le "grant select ... to anon" existait déjà mais
-- était bloqué par ces policies trop restrictives.
-- Sans danger : ne touche à aucune donnée, juste aux règles de lecture.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

drop policy if exists "cours_select_all" on cours;
create policy "cours_select_all" on cours for select using (true);

drop policy if exists "semaine_ref_select_all" on semaine_reference;
create policy "semaine_ref_select_all" on semaine_reference for select using (true);
