-- Annulation ponctuelle d'une séance (un cours à une date précise), sans toucher aux autres semaines.
create table if not exists public.seances_annulees (
  id uuid primary key default gen_random_uuid(),
  cours_id uuid not null references public.cours(id) on delete cascade,
  date_seance date not null,
  created_at timestamptz not null default now(),
  unique (cours_id, date_seance)
);

alter table public.seances_annulees enable row level security;

-- Lecture publique (le planning affiche "Annulé"), écriture réservée au serveur (service_role).
drop policy if exists "seances_annulees lecture" on public.seances_annulees;
create policy "seances_annulees lecture" on public.seances_annulees for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.seances_annulees from anon, authenticated;
grant select on public.seances_annulees to anon, authenticated;
-- IMPORTANT sur ce projet : depuis l'audit de sécurité, les nouvelles tables ne reçoivent plus
-- automatiquement de droits. Sans cette ligne, le site (service_role) ne peut pas écrire.
grant select, insert, update, delete on public.seances_annulees to service_role;

-- Garde-fou : aucune réservation possible sur une séance annulée, quel que soit le chemin d'insertion.
create or replace function public.bloquer_reservation_seance_annulee()
returns trigger language plpgsql as $$
begin
  if new.statut = 'confirmee' and exists (
    select 1 from public.seances_annulees s where s.cours_id = new.cours_id and s.date_seance = new.date_seance
  ) then
    raise exception 'seance_annulee' using hint = 'Cette séance est annulée.';
  end if;
  return new;
end $$;

drop trigger if exists trg_bloquer_reservation_seance_annulee on public.reservations;
create trigger trg_bloquer_reservation_seance_annulee
  before insert on public.reservations
  for each row execute function public.bloquer_reservation_seance_annulee();

-- Même règle dans la réservation atomique, avec un code de retour lisible ('annulee').
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

-- reserver_creneau reste exécutable uniquement côté serveur (audit sécurité d'octobre 2026).
revoke execute on function public.reserver_creneau(uuid, uuid, date, boolean) from public, anon, authenticated;
grant execute on function public.reserver_creneau(uuid, uuid, date, boolean) to service_role;
