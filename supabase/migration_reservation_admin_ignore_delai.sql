-- Permet à l'admin de réserver manuellement un élève même à moins de 1h30
-- du début du cours (ou après le début) — un élève lui-même ne peut
-- toujours pas le faire (app/booking/actions.ts n'active jamais ce
-- contournement, seul app/admin/actions.ts -> reserverCoursPourEleve le
-- fait). Utile pour un élève qui arrive en dernière minute au studio.
--
-- Remplace complètement l'ancienne version à 3 paramètres (supprimée
-- explicitement pour éviter toute ambiguïté de surcharge côté PostgREST).
DROP FUNCTION IF EXISTS public.reserver_creneau(uuid, uuid, date);

CREATE OR REPLACE FUNCTION public.reserver_creneau(p_eleve_id uuid, p_cours_id uuid, p_date_seance date, p_ignorer_delai boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  v_abo abonnements%rowtype;
  v_cours cours%rowtype;
  v_expiration_effective date;
begin
  select * into v_abo from abonnements
    where eleve_id = p_eleve_id and categorie = 'planning' and abonnement_actif
    for update;

  if not found then
    return 'pas_abonne';
  end if;

  if v_abo.gele and (v_abo.date_fin_gel_prevue is null or p_date_seance < v_abo.date_fin_gel_prevue) then
    return 'gele';
  end if;

  if v_abo.gele and v_abo.date_gel_debut is not null and v_abo.date_fin_gel_prevue is not null then
    v_expiration_effective := v_abo.date_expiration + (v_abo.date_fin_gel_prevue - v_abo.date_gel_debut);
  else
    v_expiration_effective := v_abo.date_expiration;
  end if;

  if v_expiration_effective is not null and p_date_seance > v_expiration_effective then
    return 'expire';
  end if;

  if v_abo.formule_nom <> 'illimite' and coalesce(v_abo.quota_restant, 0) <= 0 then
    return 'quota_epuise';
  end if;

  select * into v_cours from cours where id = p_cours_id;
  -- p_ignorer_delai permet à l'admin de réserver manuellement même à
  -- moins de 90 minutes du début (ou après) -- un élève lui-même ne peut
  -- toujours pas le faire (reserverCours ne passe jamais true).
  if not p_ignorer_delai and found and (p_date_seance + v_cours.heure_debut)::timestamp - (now() at time zone 'Europe/Paris') < interval '90 minutes' then
    return 'trop_tard';
  end if;

  begin
    insert into reservations (eleve_id, cours_id, date_seance)
    values (p_eleve_id, p_cours_id, p_date_seance);
  exception when unique_violation then
    return 'deja_reserve';
  end;

  if v_abo.formule_nom <> 'illimite' then
    update abonnements set quota_restant = quota_restant - 1 where id = v_abo.id;
  end if;

  return 'ok';
end;
$function$;
