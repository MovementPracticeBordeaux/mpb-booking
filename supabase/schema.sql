-- ============================================================
-- Schéma MPB Booking - à exécuter dans Supabase (SQL Editor)
-- Ce script peut être relancé sans risque (il repart de zéro).
-- ============================================================

drop table if exists paiements cascade;
drop table if exists reservations cascade;
drop table if exists cours cascade;
drop table if exists semaine_reference cascade;
drop table if exists profiles cascade;

-- Profils élèves (lié à auth.users de Supabase)
-- Toutes les formules sont des PASS À DURÉE FIXE, payés une seule fois
-- (pas d'abonnement récurrent). La liste des formules possibles et leurs
-- quotas/durées de validité sont définis dans lib/formules.ts (catalogue
-- central), pas ici en dur, pour rester facile à faire évoluer.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nom text,
  role text not null default 'eleve' check (role in ('eleve', 'admin')),

  formule_nom text,       -- clé du catalogue FORMULES (ex: 'illimite', 'mentorship'...)
  quota_total int,        -- null si formule illimitée (pas de décompte)
  quota_restant int,      -- null si formule illimitée
  date_expiration date,   -- date à laquelle le pass n'est plus valable

  -- traçabilité de l'origine de la formule
  origine text not null default 'stripe' check (origine in ('stripe', 'manuel')),
  paye boolean not null default true,

  stripe_customer_id text,
  abonnement_actif boolean not null default false,

  -- gel temporaire du pass (blessure, vacances...) : le pass reste attribué
  -- mais n'est pas utilisable tant que gele = true. Au dégel, sa date
  -- d'expiration est prolongée du nombre de jours de gel.
  gele boolean not null default false,
  date_gel_debut date,

  created_at timestamptz not null default now()
);

-- Modèle des créneaux récurrents (semaine A ou semaine B)
create table cours (
  id uuid primary key default gen_random_uuid(),
  discipline text not null, -- ex: 'Handstand', 'Calisthenics', 'Mobilité'...
  semaine text not null check (semaine in ('A', 'B')),
  jour_semaine int not null check (jour_semaine between 0 and 6), -- 0 = dimanche ... 6 = samedi
  heure_debut time not null,
  heure_fin time not null,
  lieu text,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Référence pour calculer quelle semaine (A/B) s'applique à une date donnée
create table semaine_reference (
  id int primary key default 1,
  date_lundi_reference date not null, -- un lundi connu
  semaine_ce_lundi text not null check (semaine_ce_lundi in ('A', 'B')),
  constraint one_row check (id = 1)
);

-- Réservations des élèves sur une occurrence précise (date + cours)
create table reservations (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  cours_id uuid not null references cours(id) on delete cascade,
  date_seance date not null,
  statut text not null default 'confirmee' check (statut in ('confirmee', 'annulee')),
  created_at timestamptz not null default now(),
  unique (eleve_id, cours_id, date_seance)
);

-- Historique des paiements (chaque achat, Stripe ou manuel), pour permettre
-- à l'élève de générer sa facture. On ne modifie jamais une ligne existante :
-- une nouvelle formule = une nouvelle ligne.
create table paiements (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  formule_nom text not null,
  montant numeric(10,2) not null default 0,
  origine text not null default 'stripe' check (origine in ('stripe', 'manuel')),
  paye boolean not null default true,
  rembourse boolean not null default false,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

alter table paiements enable row level security;
create policy "paiements_select_own" on paiements for select using (auth.uid() = eleve_id);
-- Pas de policy insert/update pour les élèves : seule la clé service_role
-- (webhook Stripe, actions admin) peut créer une ligne de paiement.

-- Crée automatiquement une ligne dans "profiles" à chaque nouvelle inscription
create or replace function public.gerer_nouvel_utilisateur()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gerer_nouvel_utilisateur();

-- Droits d'accès de base (distincts des policies RLS ci-dessus : sans ces
-- lignes, Postgres refuse l'accès même si les policies RLS sont correctes)
grant usage on schema public to anon, authenticated, service_role;
grant select on public.cours to anon, authenticated;
grant select on public.semaine_reference to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.reservations to authenticated;
grant select on public.paiements to authenticated;
grant all privileges on all tables in schema public to service_role;

alter table profiles enable row level security;
alter table cours enable row level security;
alter table reservations enable row level security;
alter table semaine_reference enable row level security;

-- Un élève voit seulement son propre profil. Aucune policy d'update côté
-- élève : toute écriture dans 'profiles' (abonnement, quota, formule...)
-- passe volontairement par le client admin (service role), jamais par la
-- session de l'élève elle-même — voir supabase/migration_verrouille_profils.sql
-- pour le détail du raisonnement de sécurité.
create policy "profil_select_own" on profiles for select using (auth.uid() = id);

-- Tout le monde connecté peut lire le planning
create policy "cours_select_all" on cours for select using (true);
create policy "semaine_ref_select_all" on semaine_reference for select using (true);

-- Un élève voit ses réservations, en crée, les annule
create policy "reservations_select_own" on reservations for select using (auth.uid() = eleve_id);
create policy "reservations_insert_own" on reservations for insert with check (auth.uid() = eleve_id);
create policy "reservations_update_own" on reservations for update using (auth.uid() = eleve_id);

-- Note: les policies admin (modifier cours, voir tous les profils) sont gérées
-- côté serveur avec la clé service_role de Supabase (jamais exposée au client),
-- donc pas besoin de policy "admin" côté RLS pour la V1.
