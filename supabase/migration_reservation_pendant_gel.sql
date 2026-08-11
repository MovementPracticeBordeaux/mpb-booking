-- Corrige un vrai bug : un pass gele bloquait TOUTES les reservations sans
-- regarder la date demandee - meme pour une date situee APRES la date de
-- reprise prevue (date_fin_gel_prevue), deja connue. Un eleve ne pouvait
-- donc jamais reserver a l'avance pour sa periode de reactivation, meme si
-- l'admin avait deja indique quand elle aurait lieu.
--
-- Nouveau comportement : si le pass est gele mais qu'une date de reprise
-- est definie et que la date demandee tombe CE JOUR-LA OU APRES, la
-- reservation est autorisee normalement (quota, expiration, delai de 1h30
-- verifies comme d'habitude). Si aucune date de reprise n'est definie, ou
-- que la date demandee tombe pendant la periode de gel, la reservation
-- reste bloquee comme avant.
--
-- Sans danger : remplace juste la fonction, ne touche a aucune donnee.
-- A executer une seule fois dans le SQL Editor de Supabase.

create or replace function public.reserver_creneau(
  p_eleve_id uuid,
  p_cours_id uuid,
  p_date_seance date
) returns text
language plpgsql
as $$
declare
  v_profil profiles%rowtype;
  v_cours cours%rowtype;
begin
  select * into v_profil from profiles where id = p_eleve_id for update;

  if not found or not v_profil.abonnement_actif or v_profil.formule_nom is null then
    return 'pas_abonne';
  end if;

  -- Bloque seulement si : gelé ET (pas de date de reprise connue OU la
  -- date demandée tombe avant cette date de reprise). Permet donc de
  -- réserver dès maintenant sur la période de réactivation future.
  if v_profil.gele and (v_profil.date_fin_gel_prevue is null or p_date_seance < v_profil.date_fin_gel_prevue) then
    return 'gele';
  end if;

  if v_profil.date_expiration is not null and v_profil.date_expiration < current_date then
    return 'expire';
  end if;

  if v_profil.formule_nom <> 'illimite' and coalesce(v_profil.quota_restant, 0) <= 0 then
    return 'quota_epuise';
  end if;

  -- Pas de réservation de dernière minute : il faut au moins 1h30 avant le
  -- début du cours (même délai que pour l'annulation, pour la symétrie).
  select * into v_cours from cours where id = p_cours_id;
  if found and (p_date_seance + v_cours.heure_debut)::timestamp - (now() at time zone 'utc') < interval '90 minutes' then
    return 'trop_tard';
  end if;

  begin
    insert into reservations (eleve_id, cours_id, date_seance)
    values (p_eleve_id, p_cours_id, p_date_seance);
  exception when unique_violation then
    return 'deja_reserve';
  end;

  if v_profil.formule_nom <> 'illimite' then
    update profiles set quota_restant = quota_restant - 1 where id = p_eleve_id;
  end if;

  return 'ok';
end;
$$;
