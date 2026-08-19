-- Table d'idempotence pour la route /api/cron/rappel-admin (rappel push à
-- l'admin ~1h30 avant chaque séance). Une ligne = une notif déjà envoyée
-- pour ce cours à cette date de séance, pour éviter les doublons si la
-- route est appelée plusieurs fois dans la fenêtre de 20 min.
--
-- Cette table avait été créée directement en base au moment de la
-- construction de la fonctionnalité, mais la migration correspondante
-- n'avait jamais été versionnée dans le repo (écart repo/prod comblé ici).
-- Contrainte de clé étrangère et RLS ajoutées à cette occasion.
create table if not exists admin_rappels_envoyes (
  cours_id uuid not null references cours(id) on delete cascade,
  date_seance date not null,
  created_at timestamptz not null default now(),
  primary key (cours_id, date_seance)
);

alter table admin_rappels_envoyes enable row level security;

grant all on admin_rappels_envoyes to service_role;
