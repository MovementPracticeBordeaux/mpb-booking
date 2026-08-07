-- Corrige une condition de course (race condition) : un double-clic sur
-- "Réserver", ou le site ouvert dans deux onglets, pouvait dans de rares cas
-- créer 2 réservations identiques tout en ne décomptant qu'1 seul crédit du
-- quota de l'élève (lecture puis écriture du quota en deux étapes séparées,
-- non protégées d'un accès concurrent).
--
-- Deux protections complémentaires :
--
-- 1) Un index unique empêche d'avoir 2 réservations confirmées identiques
--    (même élève, même cours, même date) au niveau base de données — même
--    si le code applicatif était rejoué deux fois en parallèle.
--
-- 2) Toute la logique de réservation (vérifs + insert + décompte du quota)
--    est déplacée dans une fonction SQL unique, exécutée par Postgres comme
--    une seule opération atomique avec verrouillage de la ligne du profil
--    (SELECT ... FOR UPDATE) : deux requêtes concurrentes pour le même
--    élève sont automatiquement mises en file, la seconde ne voit le quota
--    à jour qu'une fois la première terminée. Plus possible de "lire 3,
--    écrire 2" deux fois en même temps.
--
-- Sans danger pour les données existantes (n'ajoute qu'un index et une
-- fonction). À exécuter une seule fois dans le SQL Editor de Supabase.

create unique index if not exists reservations_unique_confirmee
  on reservations (eleve_id, cours_id, date_seance)
  where statut = 'confirmee';

create or replace function public.reserver_creneau(
  p_eleve_id uuid,
  p_cours_id uuid,
  p_date_seance date
) returns text
language plpgsql
as $$
declare
  v_profil profiles%rowtype;
begin
  -- Verrouille la ligne du profil le temps de la transaction : une
  -- deuxième réservation simultanée pour le même élève attend que
  -- celle-ci soit terminée avant de lire le quota à son tour.
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
