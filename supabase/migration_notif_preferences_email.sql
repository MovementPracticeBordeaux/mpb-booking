-- Préférences d'emails de notification, même principe que les préférences
-- push (migration_notif_preferences.sql) : granulaires par type, activées
-- par défaut.
alter table profiles
  add column if not exists notif_email_rappel boolean not null default true,
  add column if not exists notif_email_confirmation boolean not null default true;
