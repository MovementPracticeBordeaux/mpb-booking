-- Ajoute le parcours QCM avant la vidéo, et une table de suivi fin des
-- compétences par élève (le "bilan de compétences" affiché derrière
-- chaque jauge : ce qui est acquis, ce qui coince, par exercice/thème).
--
-- Sans danger : ajoute des colonnes et une nouvelle table, ne supprime
-- rien. À exécuter une seule fois dans le SQL Editor de Supabase.

alter table mentorship_progression
  add column if not exists quiz_reussi boolean not null default false,
  add column if not exists quiz_score integer,
  add column if not exists quiz_valide_le timestamptz;

-- L'élève peut mettre à jour uniquement les colonnes du quiz sur sa propre
-- ligne (même quand elle n'existe pas encore, cf. policy d'insert existante
-- qui autorise déjà un insert avec statut='en_attente' — ici on autorise en
-- plus un insert "quiz seul", sans vidéo, donc statut doit pouvoir être nul).
alter table mentorship_progression alter column statut drop not null;
alter table mentorship_progression alter column statut drop default;

drop policy if exists progression_soumission on mentorship_progression;
create policy progression_soumission on mentorship_progression
  for insert with check (auth.uid() = eleve_id and (statut is null or statut = 'en_attente'));

-- Après un quiz réussi (statut encore nul), l'élève doit pouvoir passer à
-- 'en_attente' en soumettant sa vidéo — on élargit la policy de
-- resoumission existante pour couvrir aussi ce cas (statut nul -> en_attente),
-- en plus du cas déjà prévu (refuse -> en_attente).
drop policy if exists progression_resoumission on mentorship_progression;
create policy progression_resoumission on mentorship_progression
  for update
  using (auth.uid() = eleve_id and (statut = 'refuse' or statut is null))
  with check (auth.uid() = eleve_id and statut = 'en_attente');

-- Table de suivi fin par compétence : le "bilan personnel" d'un élève sur
-- une branche donnée, alimenté par Sylvain au fil des validations vidéo.
create table if not exists mentorship_suivi_competence (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  domaine text not null, -- 'tronc' | 'force' | 'flexibilite' | 'locomotion' | 'connexion' | 'figures'
  exercice_ou_theme text not null, -- ex: "gainage frontal", "poussée scapulaire"
  statut text not null check (statut in ('acquis', 'en_cours', 'difficulte_recurrente')),
  commentaire text,
  updated_at timestamptz not null default now()
);

alter table mentorship_suivi_competence enable row level security;

-- L'élève ne peut que LIRE son propre bilan — c'est Sylvain qui l'alimente
-- (via le client service_role, qui contourne RLS comme pour le reste de
-- l'admin).
create policy suivi_propre_lecture on mentorship_suivi_competence
  for select using (auth.uid() = eleve_id);

grant select on table mentorship_suivi_competence to authenticated;
