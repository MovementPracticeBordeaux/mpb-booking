-- Ajoute la meme regle de delai que pour l'annulation, mais cote reservation :
-- impossible de reserver un cours moins de 1h30 avant son debut. Remplace
-- entierement la fonction reserver_creneau (les autres regles restent
-- identiques, seule cette verification est ajoutee).
--
-- Sans danger : ne touche a aucune donnee, remplace juste la fonction.
-- A executer une seule fois dans le SQL Editor de Supabase (necessite d'avoir
-- deja execute supabase/migration_reservation_atomique.sql au prealable).

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

  if v_profil.gele then
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
