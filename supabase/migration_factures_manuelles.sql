-- Factures "manuelles" : pour les prestations hors catalogue de formules
-- (interventions a l'exterieur, prestations ponctuelles...) - nom du
-- client en texte libre (pas forcement un eleve inscrit sur le site),
-- lignes de prestation libres (description + prix), envoi par email ou
-- lien WhatsApp genere a la volee. Accessible publiquement via son id
-- (comme un lien de partage) sans necessiter de compte.
--
-- Sans danger : cree une nouvelle table, ne touche a aucune donnee
-- existante. A executer une seule fois dans le SQL Editor de Supabase.

create table if not exists factures_manuelles (
  id uuid primary key default gen_random_uuid(),
  nom_client text not null,
  email_client text,
  telephone_client text,
  lignes jsonb not null default '[]'::jsonb, -- [{ "description": "...", "prix": 120 }, ...]
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  envoyee_le timestamptz
);

alter table factures_manuelles enable row level security;

-- Lecture publique par id (le lien lui-meme fait office de secret, comme
-- un lien de partage classique) - necessaire pour qu'un client externe
-- sans compte puisse consulter sa facture.
drop policy if exists factures_manuelles_lecture_publique on factures_manuelles;
create policy factures_manuelles_lecture_publique on factures_manuelles for select using (true);

-- Ecriture reservee a l'admin (passe par le service_role, qui contourne
-- RLS de toute facon, mais GRANT reste necessaire - voir le bug du
-- 08/08/2026 sur la table vacances).
grant select on table factures_manuelles to anon, authenticated;
grant select, insert, update, delete on table factures_manuelles to service_role;
