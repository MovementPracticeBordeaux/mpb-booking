-- Table d'idempotence pour la route /api/cron/rappel-admin (rappel push à
-- l'admin ~1h30 avant chaque séance). Une ligne = une notif déjà envoyée
-- pour ce cours à cette date de séance, pour éviter les doublons si la
-- route est appelée plusieurs fois dans la fenêtre de 20 min.
--
-- Cette table était référencée par le code (route.ts) depuis sa création
-- mais la migration avait été oubliée : l'insert échouait systématiquement
-- (table inexistante), ce qui faisait sauter l'envoi du push à chaque fois
-- sans jamais faire remonter d'erreur.
create table if not exists admin_rappels_envoyes (
  cours_id uuid not null references cours(id) on delete cascade,
  date_seance date not null,
  created_at timestamptz not null default now(),
  primary key (cours_id, date_seance)
);

alter table admin_rappels_envoyes enable row level security;

grant all on admin_rappels_envoyes to service_role;
