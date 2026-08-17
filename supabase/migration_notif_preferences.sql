-- Préférences de notifications push par élève, granulaires par type
-- (un élève peut vouloir les rappels de cours mais pas les confirmations
-- de réservation, ou l'inverse). Activées par défaut pour tout le monde,
-- l'élève peut les désactiver individuellement depuis /profil.
alter table profiles
  add column if not exists notif_push_rappel boolean not null default true,
  add column if not exists notif_push_confirmation boolean not null default true;
