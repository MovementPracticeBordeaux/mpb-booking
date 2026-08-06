-- Correctif complet et définitif des permissions manquantes.
-- Contrairement à une table créée depuis l'interface Supabase, une table
-- créée en SQL brut ne reçoit AUCUN droit automatique pour AUCUN rôle
-- (ni les visiteurs "anon", ni les utilisateurs connectés "authenticated",
-- ni la clé secrète admin "service_role"). On corrige les trois d'un coup,
-- pour toutes les tables, afin qu'il n'y ait plus aucun trou.

grant usage on schema public to anon, authenticated, service_role;

-- Planning consultable par tout le monde, connecté ou non
grant select on public.cours to anon, authenticated;
grant select on public.semaine_reference to anon, authenticated;

-- Réservé aux utilisateurs connectés
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.reservations to authenticated;
grant select on public.paiements to authenticated;

-- La clé admin (service_role) doit avoir TOUS les droits sur TOUTES les
-- tables : c'est elle qui gère le planning, les formules, les élèves.
grant all privileges on all tables in schema public to service_role;
