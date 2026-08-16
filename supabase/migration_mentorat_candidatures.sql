-- Table des candidatures au Mentorat (nouveau parcours d'accès, en
-- remplacement de l'achat direct sur /tarifs). Un visiteur remplit un
-- formulaire public (pas forcément connecté) sur /mentorat/candidature ;
-- Sylvain consulte et traite les candidatures manuellement pour l'instant
-- (attribution de la formule depuis /admin/eleves une fois accepté).
--
-- Insertion faite côté serveur avec la clé service_role (bypass RLS,
-- formulaire public) : on garde quand même RLS activé + une policy de
-- lecture réservée à Sylvain (admin), par précaution/défense en profondeur.
--
-- Sans danger : ajoute une nouvelle table, ne touche à rien d'existant.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

create table if not exists mentorat_candidatures (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  telephone text,
  niveau text not null,          -- 'debutant' | 'intermediaire' | 'avance'
  duree text,                    -- '3' | '6' | '12'
  nombre_branches int,           -- 1 ou 2
  branches text,                 -- ex. 'force' ou 'force,figures'
  objectifs text not null,
  statut text not null default 'nouvelle',  -- 'nouvelle' | 'acceptee' | 'refusee'
  cree_le timestamptz not null default now()
);

alter table mentorat_candidatures enable row level security;

-- Lecture réservée aux admins (Sylvain), via son profil. L'insertion se
-- fait uniquement via supabaseAdmin() côté serveur (clé service_role),
-- donc aucune policy d'insert n'est nécessaire ici.
create policy candidature_lecture_admin on mentorat_candidatures
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

grant select on table mentorat_candidatures to authenticated;
