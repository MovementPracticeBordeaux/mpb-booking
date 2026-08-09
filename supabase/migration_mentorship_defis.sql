-- Suivi des "défis quotidiens" cochés par l'élève (la programmation de ses
-- compétences en cours, affichée comme pratique du jour). Un défi coché
-- donne un petit bonus d'XP, une fois par jour et par compétence — ça ne
-- fait PAS progresser la compétence elle-même (ça reste QCM + vidéo).
--
-- Sans danger : ajoute une nouvelle table, ne touche à rien d'existant.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

create table if not exists mentorship_defi_valide (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references profiles(id) on delete cascade,
  noeud_id text not null,
  jour date not null default current_date,
  cree_le timestamptz not null default now(),
  unique (eleve_id, noeud_id, jour)
);

alter table mentorship_defi_valide enable row level security;

create policy defi_propre_lecture on mentorship_defi_valide
  for select using (auth.uid() = eleve_id);

create policy defi_propre_creation on mentorship_defi_valide
  for insert with check (auth.uid() = eleve_id);

grant select, insert on table mentorship_defi_valide to authenticated;
