-- Passage du suivi Mentorship de "l'élève coche lui-même" à "l'élève
-- soumet une vidéo, Sylvain valide ou refuse". Une fois acquis, ça reste
-- acquis (pas de retour en arrière possible côté élève).
--
-- Sans danger : ajoute des colonnes à une table existante, ne supprime
-- rien. À exécuter une seule fois dans le SQL Editor de Supabase.

alter table mentorship_progression
  add column if not exists statut text not null default 'en_attente'
    check (statut in ('en_attente', 'acquis', 'refuse')),
  add column if not exists video_url text,
  add column if not exists commentaire_coach text,
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists reviewed_at timestamptz;

-- L'ancienne colonne "vu" ne sert plus (remplacée par "statut = acquis").
alter table mentorship_progression drop column if exists vu;

-- On repart des anciennes policies (moins restrictives, elles permettaient
-- à l'élève de tout modifier) pour les remplacer par des policies qui
-- distinguent soumission initiale, re-soumission après refus, et lecture.
drop policy if exists progression_propre_lecture on mentorship_progression;
drop policy if exists progression_propre_ecriture on mentorship_progression;

-- Lecture : chaque élève ne voit que sa propre progression.
create policy progression_propre_lecture on mentorship_progression
  for select using (auth.uid() = eleve_id);

-- Soumission initiale : l'élève peut créer sa ligne, uniquement avec le
-- statut "en_attente" (impossible de s'auto-valider "acquis").
create policy progression_soumission on mentorship_progression
  for insert with check (auth.uid() = eleve_id and statut = 'en_attente');

-- Re-soumission après refus uniquement : l'élève peut modifier sa ligne
-- seulement si elle est actuellement "refuse", et seulement pour la
-- repasser à "en_attente". Une ligne "acquis" est ainsi verrouillée
-- définitivement côté élève (Sylvain reste libre de la modifier, lui,
-- via le client service_role qui contourne RLS).
create policy progression_resoumission on mentorship_progression
  for update
  using (auth.uid() = eleve_id and statut = 'refuse')
  with check (auth.uid() = eleve_id and statut = 'en_attente');

-- GRANT Postgres (distinct des policies RLS ci-dessus, nécessaire même pour
-- un accès qui respecte RLS — voir le bug du 08/08/2026 sur la table vacances).
grant select, insert, update on table mentorship_progression to authenticated;
