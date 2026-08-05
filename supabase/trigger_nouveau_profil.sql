-- Crée automatiquement une ligne dans "profiles" à chaque nouvelle inscription
-- (auth.users), pour que chaque élève ait immédiatement sa fiche.
create or replace function public.gerer_nouvel_utilisateur()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gerer_nouvel_utilisateur();

-- Comme ce trigger n'existait pas avant, on crée aussi manuellement ta ligne
-- (remplace l'email si besoin) pour ne pas devoir te reconnecter :
insert into public.profiles (id, email)
select id, email from auth.users
where email = 'amplitude.inside@protonmail.com'
on conflict (id) do nothing;
