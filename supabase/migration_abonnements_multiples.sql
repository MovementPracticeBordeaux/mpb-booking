-- Refonte du modèle d'abonnement : un élève peut désormais avoir PLUSIEURS
-- formules actives simultanément (une par catégorie : planning / coaching /
-- mentorat), plutôt qu'une seule formule au total stockée sur profiles.
-- Ex. un élève peut avoir un pass collectif ET un accès mentorat en même
-- temps, ce qui était impossible avec l'ancien modèle (une seule colonne
-- formule_nom sur profiles, qui aurait été écrasée).
create table if not exists abonnements (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  categorie text not null check (categorie in ('planning', 'coaching', 'mentorat')),
  formule_nom text not null,
  quota_total integer,
  quota_restant integer,
  date_debut_formule date,
  date_expiration date,
  origine text,
  paye boolean not null default true,
  abonnement_actif boolean not null default true,
  gele boolean not null default false,
  date_gel_debut date,
  date_fin_gel_prevue date,
  created_at timestamptz not null default now()
);

-- Un seul abonnement ACTIF par élève et par catégorie à la fois (mais rien
-- n'empêche plusieurs lignes inactives/historiques pour le même couple,
-- ex. un ancien pass expiré puis un nouveau).
create unique index if not exists abonnements_actif_unique
  on abonnements (eleve_id, categorie)
  where abonnement_actif;

create index if not exists abonnements_eleve_id_idx on abonnements(eleve_id);

alter table abonnements enable row level security;
grant all on abonnements to service_role;
grant select on abonnements to authenticated;

drop policy if exists "Élèves voient leurs propres abonnements" on abonnements;
create policy "Élèves voient leurs propres abonnements"
  on abonnements for select
  using (auth.uid() = eleve_id);

-- Migration ponctuelle des données existantes (profiles -> abonnements),
-- déjà exécutée en production le 17/08/2026. Conservée ici pour la
-- traçabilité — sans effet si rejouée (les lignes profiles.formule_nom
-- restent en place jusqu'au nettoyage final une fois le nouveau modèle
-- validé en usage réel).
insert into abonnements (eleve_id, categorie, formule_nom, quota_total, quota_restant, date_debut_formule, date_expiration, origine, paye, abonnement_actif, gele, date_gel_debut, date_fin_gel_prevue)
select
  id,
  case
    when formule_nom in ('illimite','mensuel_8','mensuel_4','carnet_10','carnet_5','cours_decouverte') then 'planning'
    when formule_nom in ('coaching_online','coaching_unite','coaching_carnet_3h','coaching_carnet_4h') then 'coaching'
    else 'mentorat'
  end,
  formule_nom,
  quota_total,
  quota_restant,
  date_debut_formule,
  date_expiration,
  origine,
  coalesce(paye, true),
  coalesce(abonnement_actif, true),
  coalesce(gele, false),
  date_gel_debut,
  date_fin_gel_prevue
from profiles
where formule_nom is not null
on conflict do nothing;
