-- Outil FAIA : permet à chaque élève de planifier n'importe quelle
-- compétence personnelle selon le cycle d'apprentissage enseigné au nœud
-- Armure Organique niveau 2 (Fragmenter / Assembler / Injecter / Amplifier).
-- Contrairement aux exercices prédéfinis de la bibliothèque, l'élève
-- choisit librement la compétence (ex. "Traction complète") et remplit
-- lui-même le contenu de chaque étape.
create table if not exists competences_faia (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  etape_actuelle text not null default 'fragmenter' check (etape_actuelle in ('fragmenter', 'assembler', 'injecter', 'amplifier')),
  fragments text not null default '',
  assemblage text not null default '',
  injection text not null default '',
  amplification text not null default '',
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

alter table competences_faia enable row level security;

drop policy if exists "Élèves gèrent leurs propres compétences FAIA" on competences_faia;
create policy "Élèves gèrent leurs propres compétences FAIA"
  on competences_faia for all
  using (auth.uid() = eleve_id)
  with check (auth.uid() = eleve_id);

grant select, insert, update, delete on competences_faia to authenticated;
