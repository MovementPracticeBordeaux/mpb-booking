-- Corrige un bug : reserver_creneau vérifiait que l'abonnement n'était pas
-- encore expiré AUJOURD'HUI (current_date), au lieu de vérifier que la
-- DATE DU COURS DEMANDÉ (p_date_seance) était bien dans la période de
-- validité de l'abonnement. Un élève dont le pass expire le 25 août
-- pouvait ainsi réserver un cours daté du 15 septembre, tant qu'il
-- réservait avant le 25 août.
CREATE OR REPLACE FUNCTION public.reserver_creneau(p_eleve_id uuid, p_cours_id uuid, p_date_seance date)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  v_profil profiles%rowtype;
  v_cours cours%rowtype;
  v_expiration_effective date;
begin
  select * into v_profil from profiles where id = p_eleve_id for update;

  if not found or not v_profil.abonnement_actif or v_profil.formule_nom is null then
    return 'pas_abonne';
  end if;

  if v_profil.gele and (v_profil.date_fin_gel_prevue is null or p_date_seance < v_profil.date_fin_gel_prevue) then
    return 'gele';
  end if;

  -- Si le pass est gele mais qu'on sait deja qu'il sera degele avant la
  -- date demandee (verification ci-dessus passee), on simule des
  -- maintenant la prolongation que le degel automatique appliquera
  -- (meme duree de gel ajoutee a la date d'expiration), sans attendre que
  -- le cron ait reellement traite le degel. Sinon la date d'expiration
  -- reste figee a sa valeur d'avant le gel et bloque a tort.
  if v_profil.gele and v_profil.date_gel_debut is not null and v_profil.date_fin_gel_prevue is not null then
    v_expiration_effective := v_profil.date_expiration + (v_profil.date_fin_gel_prevue - v_profil.date_gel_debut);
  else
    v_expiration_effective := v_profil.date_expiration;
  end if;

  -- Correction : on comparait l'expiration a AUJOURD'HUI (current_date) au
  -- lieu de la comparer a la date du cours demande (p_date_seance). Ca
  -- permettait de reserver n'importe quelle date future tant que le pass
  -- n'etait pas encore expire au moment du clic -- meme une date bien
  -- au-dela de la fin de validite reelle de l'abonnement.
  if v_expiration_effective is not null and p_date_seance > v_expiration_effective then
    return 'expire';
  end if;

  if v_profil.formule_nom <> 'illimite' and coalesce(v_profil.quota_restant, 0) <= 0 then
    return 'quota_epuise';
  end if;

  select * into v_cours from cours where id = p_cours_id;
  -- Correction : la date/heure du cours est stockee en heure LOCALE
  -- (Europe/Paris), donc 'now()' doit etre converti dans ce meme fuseau
  -- avant comparaison, pas en UTC brut -- sinon l'ecart introduit par le
  -- decalage (+1h hiver / +2h ete) fait que la barriere des 90 minutes ne
  -- se declenche quasiment jamais en heure d'ete.
  if found and (p_date_seance + v_cours.heure_debut)::timestamp - (now() at time zone 'Europe/Paris') < interval '90 minutes' then
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
$function$;
