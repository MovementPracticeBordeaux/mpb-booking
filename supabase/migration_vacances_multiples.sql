-- Remplace le systeme a une seule periode de vacances (2 colonnes sur
-- semaine_reference) par une vraie table permettant plusieurs periodes
-- distinctes dans l'annee (Toussaint, Noel, ete...), chacune ajoutable et
-- supprimable individuellement depuis l'admin.
--
-- Sans danger : cree une nouvelle table et reprend automatiquement la
-- periode actuellement definie (si il y en a une) comme premiere ligne, ne
-- supprime aucune donnee existante. A executer une seule fois dans le SQL
-- Editor de Supabase.

create table if not exists vacances (
  id uuid primary key default gen_random_uuid(),
  date_debut date not null,
  date_fin date not null,
  created_at timestamptz not null default now()
);

alter table vacances enable row level security;

-- Lecture publique (le planning doit pouvoir afficher les vacances sans
-- que l'utilisateur soit connecte), ecriture reservee a l'admin via le
-- client admin (service role, qui contourne RLS de toute facon).
drop policy if exists vacances_lecture_publique on vacances;
create policy vacances_lecture_publique on vacances for select using (true);

-- Reprend la periode actuelle (si definie) dans la nouvelle table, pour ne
-- rien perdre lors de la bascule.
insert into vacances (date_debut, date_fin)
select vacances_debut, vacances_fin
from semaine_reference
where id = 1 and vacances_debut is not null and vacances_fin is not null;
