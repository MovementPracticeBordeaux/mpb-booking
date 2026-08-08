-- Suivi de progression du programme Mentorship : une ligne par élève et par
-- module vu (coche "vu", sans verrouillage - l'élève peut cocher/décocher
-- librement, ça ne bloque jamais l'accès aux autres modules).
--
-- Sans danger : cree une nouvelle table, ne touche a aucune donnee
-- existante. A executer une seule fois dans le SQL Editor de Supabase.

create table if not exists mentorship_progression (
  eleve_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  vu boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (eleve_id, module_id)
);

alter table mentorship_progression enable row level security;

-- Chaque élève ne voit et ne modifie que sa propre progression.
drop policy if exists progression_propre_lecture on mentorship_progression;
create policy progression_propre_lecture on mentorship_progression
  for select using (auth.uid() = eleve_id);

drop policy if exists progression_propre_ecriture on mentorship_progression;
create policy progression_propre_ecriture on mentorship_progression
  for all using (auth.uid() = eleve_id) with check (auth.uid() = eleve_id);

-- GRANT Postgres (distinct des policies RLS ci-dessus, nécessaire même pour
-- un accès qui respecte RLS — voir le bug du 08/08/2026 sur la table vacances).
grant select, insert, update, delete on table mentorship_progression to authenticated;
