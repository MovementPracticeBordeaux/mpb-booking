-- Outil "objectifs" (remplace l'outil FAIA jugé inutile) : bibliothèque
-- consultable des objectifs de progression, construite à partir de la
-- bibliothèque de 334 vidéos classées de Sylvain, avec une toile de
-- relations "sert à" entre objectifs (ex. Traction progression -> sert à
-- -> Chin up ring), définie par Sylvain lui-même exercice par exercice.

create table if not exists objectifs_mentorship (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  branche text not null,
  sous_groupe text,
  video_url text,
  mots_cles text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists objectifs_relations (
  id uuid primary key default gen_random_uuid(),
  objectif_source_id uuid not null references objectifs_mentorship(id) on delete cascade,
  objectif_cible_id uuid not null references objectifs_mentorship(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (objectif_source_id, objectif_cible_id)
);

create index if not exists objectifs_mentorship_branche_idx on objectifs_mentorship(branche);
create index if not exists objectifs_relations_source_idx on objectifs_relations(objectif_source_id);
create index if not exists objectifs_relations_cible_idx on objectifs_relations(objectif_cible_id);

alter table objectifs_mentorship enable row level security;
alter table objectifs_relations enable row level security;

grant all on objectifs_mentorship to service_role;
grant all on objectifs_relations to service_role;
-- Lecture ouverte à tout élève connecté (consultatif) ; écriture réservée
-- au service_role (actions admin uniquement).
grant select on objectifs_mentorship to authenticated;
grant select on objectifs_relations to authenticated;

drop policy if exists "Lecture ouverte des objectifs" on objectifs_mentorship;
create policy "Lecture ouverte des objectifs" on objectifs_mentorship for select using (true);
drop policy if exists "Lecture ouverte des relations" on objectifs_relations;
create policy "Lecture ouverte des relations" on objectifs_relations for select using (true);

-- Import initial des 333 objectifs (331 depuis la bibliothèque vidéo
-- classée + 2 trous identifiés par Sylvain : Traction faux-grip et Dips
-- bar, pas encore filmés à l'origine), déjà exécuté en production.
-- Voir insert.sql généré pour l'import complet (non reproduit ici pour ne
-- pas alourdir le fichier de migration -- se référer à l'historique
-- d'exécution Supabase si besoin de rejouer).

-- Deux objectifs supplémentaires ajoutés lors de l'entretien avec Sylvain
-- (également des trous, pas encore filmés) :
insert into objectifs_mentorship (titre, branche, sous_groupe, video_url)
values
  ('Rowing', 'Force', 'Tirer', NULL),
  ('Traction faux-grip', 'Force', 'Tirer', NULL)
on conflict do nothing;

-- Relations "sert à" validées avec Sylvain (chaînes Tirage, Poussée,
-- Elbow lever, Frog/air baby).
with paires(source_titre, cible_titre) as (
  values
    ('Rowing', 'Rowing circle - inside'),
    ('Rowing circle - inside', 'ROWING UNILATÉRAL ASSISTÉ'),
    ('ROWING UNILATÉRAL ASSISTÉ', 'Traction progression'),
    ('Traction progression', 'Traction excentrique'),
    ('Traction excentrique', 'CHIN UP RING'),
    ('CHIN UP RING', 'Traction faux-grip'),
    ('Traction faux-grip', 'TYPEWRITER CHIN UP PROGRESSION'),
    ('TYPEWRITER CHIN UP PROGRESSION', 'ARCHER CHIN UP ELASTIQUE'),
    ('ARCHER CHIN UP ELASTIQUE', 'One arm Chin up - progression 1'),
    ('FORCE - PUSH UP', 'PUSH UP CLEAN'),
    ('PUSH UP CLEAN', 'Dips progression'),
    ('Dips progression', 'Dips scap à la barre'),
    ('Dips scap à la barre', 'Dips bar'),
    ('Dips bar', 'RING DIPS'),
    ('RING DIPS', 'RING PUSH UPS UNILATÉRALES ASSISTEES'),
    ('ELBOW LEVER DIAMANT', 'FIGURE   ELBOW LEVER STRADDLE'),
    ('FIGURE   ELBOW LEVER STRADDLE', 'FIGURE   ELBOW LEVER'),
    ('FIGURE - FROG HANDSTAND', 'FIGURE - FROG TRANSITION 1'),
    ('FIGURE - FROG TRANSITION 1', 'FIGURE - FROG TRANSITION 3'),
    ('FIGURE - FROG TRANSITION 3', 'LATERAL FROG')
)
insert into objectifs_relations (objectif_source_id, objectif_cible_id)
select s.id, c.id
from paires p
join objectifs_mentorship s on s.titre = p.source_titre
join objectifs_mentorship c on c.titre = p.cible_titre
on conflict do nothing;
