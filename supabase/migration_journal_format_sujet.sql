-- Journal d'entraînement : notes en texte libre OU en liste de points,
-- et regroupement des notes par sujet (sur un ou plusieurs jours).
--   format : 'texte' (défaut, comportement d'avant) ou 'liste' (un point par ligne)
--   sujet  : intitulé libre facultatif (ex. "Progression muscle up") qui relie
--            plusieurs notes entre elles, quel que soit leur jour
-- + droit de modifier ses propres notes (pour changer le sujet après coup).

alter table public.journal_entrainement
  add column if not exists format text not null default 'texte'
    check (format in ('texte', 'liste')),
  add column if not exists sujet text;

drop policy if exists journal_modification_propre on public.journal_entrainement;
create policy journal_modification_propre on public.journal_entrainement
  for update using (auth.uid() = eleve_id) with check (auth.uid() = eleve_id);
