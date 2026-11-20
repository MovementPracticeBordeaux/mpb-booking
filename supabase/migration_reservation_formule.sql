-- Audit du 20/11/2026 : chaque réservation retient la formule qui l'a payée.
-- 1. reservations.abonnement_id : à l'annulation, la séance est rendue à la
--    formule qui l'a payée (et pas à la formule active du moment, ce qui
--    permettait de faire passer des séances d'une formule à l'autre).
-- 2. Une formule dont la date de début est dans le futur ne permet pas de
--    réserver avant cette date (avant : on pouvait acheter avec un départ dans
--    3 mois et réserver tout de suite, donc profiter de 4 mois).
-- 3. Une séance réservée au-delà de la fin de la formule actuelle est payée
--    par la formule en attente qui couvre cette date (sans faire perdre les
--    séances encore valables de l'actuelle).

alter table public.reservations add column if not exists abonnement_id uuid references public.abonnements(id) on delete set null;

create or replace function public.reserver_creneau(p_eleve_id uuid, p_cours_id uuid, p_date_seance date, p_ignorer_delai boolean default false)
 returns text
 language plpgsql
as $function$
declare
  v_abo abonnements%rowtype;
  v_suiv abonnements%rowtype;
  v_cours cours%rowtype;
  v_expiration_effective date;
begin
  if exists (select 1 from seances_annulees where cours_id = p_cours_id and date_seance = p_date_seance) then
    return 'annulee';
  end if;

  perform public.activer_formule_suivante(p_eleve_id, 'planning', null);

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

  -- Séance après la fin de la formule actuelle : formule en attente qui couvre cette date ?
  if v_expiration_effective is not null and p_date_seance > v_expiration_effective then
    select * into v_suiv from abonnements
      where eleve_id = p_eleve_id and categorie = 'planning' and en_attente
        and date_debut_formule <= p_date_seance and (date_expiration is null or date_expiration >= p_date_seance)
      order by date_debut_formule limit 1 for update;
    if not found then
      return 'expire';
    end if;
    v_abo := v_suiv;
  end if;

  if v_abo.date_debut_formule is not null and p_date_seance < v_abo.date_debut_formule and not v_abo.en_attente then
    return 'pas_commence';
  end if;

  if v_abo.formule_nom <> 'illimite' and coalesce(v_abo.quota_restant, 0) <= 0 then
    return 'quota_epuise';
  end if;

  select * into v_cours from cours where id = p_cours_id;
  if not p_ignorer_delai and found and (p_date_seance + v_cours.heure_debut)::timestamp - (now() at time zone 'Europe/Paris') < interval '90 minutes' then
    return 'trop_tard';
  end if;

  begin
    insert into reservations (eleve_id, cours_id, date_seance, abonnement_id)
    values (p_eleve_id, p_cours_id, p_date_seance, v_abo.id);
  exception when unique_violation then
    return 'deja_reserve';
  end;

  if v_abo.formule_nom <> 'illimite' then
    update abonnements set quota_restant = quota_restant - 1 where id = v_abo.id;
  end if;

  return 'ok';
end;
$function$;

revoke execute on function public.reserver_creneau(uuid, uuid, date, boolean) from public, anon, authenticated;
grant execute on function public.reserver_creneau(uuid, uuid, date, boolean) to service_role;
