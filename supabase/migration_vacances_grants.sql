-- Correctif : la migration precedente (migration_vacances_multiples.sql) a
-- bien cree la table et la policy RLS, mais a oublie les GRANT Postgres --
-- une etape distincte des policies RLS, necessaire meme pour le role admin
-- (service_role) qui contourne RLS mais a quand meme besoin du droit
-- d'acces de base sur la table.
--
-- Sans danger : ne touche a aucune donnee, ajuste juste les permissions.
-- A executer une seule fois dans le SQL Editor de Supabase.

grant select, insert, update, delete on table vacances to anon, authenticated, service_role;
