-- Rachat d'une formule alors que l'actuelle a encore des séances : la nouvelle
-- formule est mise "en attente" et démarre quand l'actuelle est terminée
-- (séances épuisées -> démarre le jour même ; date de fin passée -> démarre à
-- la date prévue). Plus d'addition des séances (le "11" d'une formule 8).

alter table public.abonnements add column if not exists en_attente boolean not null default false;

-- Bascule de la formule active vers la formule en attente, si l'active est
-- épuisée ou terminée à la date donnée. Renvoie true si une bascule a eu lieu.
create or replace function public.activer_formule_suivante(p_eleve_id uuid, p_categorie text, p_date date default null)
 returns boolean
 language plpgsql
as $function$
declare
  v_abo abonnements%rowtype;
  v_suiv abonnements%rowtype;
  v_aujourdhui date := (now() at time zone 'Europe/Paris')::date;
  v_date date := coalesce(p_date, v_aujourdhui);
  v_fin date;
  v_epuisee boolean := false;
  v_terminee boolean := false;
begin
  select * into v_suiv from abonnements
    where eleve_id = p_eleve_id and categorie = p_categorie and en_attente
    order by date_debut_formule nulls last, created_at
    limit 1 for update;
  if not found then return false; end if;

  select * into v_abo from abonnements
    where eleve_id = p_eleve_id and categorie = p_categorie and abonnement_actif
    for update;

  if found then
    if v_abo.gele then return false; end if;
    v_fin := v_abo.date_expiration;
    v_epuisee := v_abo.quota_restant is not null and v_abo.quota_restant <= 0;
    v_terminee := v_fin is not null and v_fin < v_date;
    if not v_epuisee and not v_terminee then return false; end if;
    update abonnements set abonnement_actif = false where id = v_abo.id;
  end if;

  -- Ancienne terminée par sa date : la période prévue à l'achat est gardée.
  -- Ancienne épuisée avant sa date (ou plus de formule active) : la nouvelle
  -- démarre aujourd'hui, pour la même durée.
  if not v_terminee then
    update abonnements set
      date_expiration = case when date_expiration is not null and date_debut_formule is not null
                             then v_aujourdhui + (date_expiration - date_debut_formule) else date_expiration end,
      date_debut_formule = v_aujourdhui
      where id = v_suiv.id;
  end if;

  update abonnements set abonnement_actif = true, en_attente = false where id = v_suiv.id;
  return true;
end;
$function$;

revoke execute on function public.activer_formule_suivante(uuid, text, date) from public, anon, authenticated;
grant execute on function public.activer_formule_suivante(uuid, text, date) to service_role;

-- Réservation : bascule d'abord sur la formule en attente si besoin.
create or replace function public.reserver_creneau(p_eleve_id uuid, p_cours_id uuid, p_date_seance date, p_ignorer_delai boolean default false)
 returns text
 language plpgsql
as $function$
declare
  v_abo abonnements%rowtype;
  v_cours cours%rowtype;
  v_expiration_effective date;
begin
  if exists (select 1 from seances_annulees where cours_id = p_cours_id and date_seance = p_date_seance) then
    return 'annulee';
  end if;

  perform public.activer_formule_suivante(p_eleve_id, 'planning', p_date_seance);

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

revoke execute on function public.reserver_creneau(uuid, uuid, date, boolean) from public, anon, authenticated;
grant execute on function public.reserver_creneau(uuid, uuid, date, boolean) to service_role;
