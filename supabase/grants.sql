-- Sans ces lignes, Postgres refuse l'accès aux tables même si les policies
-- RLS sont correctes : GRANT et RLS sont deux couches de sécurité séparées.
-- Ce problème touchait toutes les tables depuis leur création.

grant usage on schema public to anon, authenticated;

-- Planning consultable par tout le monde, connecté ou non
grant select on public.cours to anon, authenticated;
grant select on public.semaine_reference to anon, authenticated;

-- Réservé aux utilisateurs connectés
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.reservations to authenticated;
grant select on public.paiements to authenticated;
