-- Mentorat et défi du mois : les élèves n'écrivent plus eux-mêmes dans leur
-- progression ni dans leur participation (QCM, vidéo, niveau, validation).
-- Tout passe par le serveur, qui vérifie avant d'écrire (app/mentorship/actions.ts,
-- app/defi/actions.ts). Lecture inchangée.
revoke insert, update on public.mentorship_progression from authenticated, anon;
revoke insert, update on public.defi_participations from authenticated, anon;
grant select, insert, update, delete on public.mentorship_progression to service_role;
grant select, insert, update, delete on public.defi_participations to service_role;
