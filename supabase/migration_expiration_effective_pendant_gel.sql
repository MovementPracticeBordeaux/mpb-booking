-- Corrige un troisieme bug lie au gel/reservation (apres celui du
-- reservation_pendant_gel.sql) : meme en autorisant la reservation sur la
-- periode de reprise connue, la fonction bloquait encore avec 'expire' car
-- date_expiration reste figee a sa valeur d'AVANT le gel tant que le degel
-- reel (manuel ou via le cron) n'a pas eu lieu.
--
-- Exemple concret (Louis Mathe) : gele le 3 aout, reprise prevue le 16
-- aout, mais date_expiration encore a 09 aout (valeur d'avant le gel,
-- dans le passe). Meme apres avoir autorise le passage de la verification
-- "gele" pour une date posterieure au 16 aout, la verification suivante
-- sur date_expiration renvoyait quand meme 'expire'.
--
-- Nouveau comportement : si le pass est gele avec une date de gel et une
-- date de reprise connues, on simule la meme prolongation que le degel
-- automatique appliquera (date_expiration + duree du gel) AVANT de
-- verifier si le pass est expire - sans attendre que le cron ait
-- reellement traite le degel.
--
-- Sans danger : remplace juste la fonction, ne touche a aucune donnee.
-- A executer une seule fois dans le SQL Editor de Supabase (deja applique
-- directement en production le 11/08/2026 via le connecteur Supabase, ce
-- fichier documente le changement dans l'historique des migrations).

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

  if v_expiration_effective is not null and v_expiration_effective < current_date then
    return 'expire';
  end if;

  if v_profil.formule_nom <> 'illimite' and coalesce(v_profil.quota_restant, 0) <= 0 then
    return 'quota_epuise';
  end if;

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
