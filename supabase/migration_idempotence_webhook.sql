-- Corrige un risque de double-enregistrement : Stripe notifie parfois deux
-- fois le même événement de paiement (souci réseau, retry automatique côté
-- Stripe). Le code vérifie déjà si stripe_session_id existe avant de
-- retraiter, mais cette contrainte unique est le filet de sécurité au
-- niveau base de données : même si deux webhooks arrivaient au même
-- instant (avant que la vérification applicative n'ait le temps de voir la
-- première ligne), la deuxième tentative d'insertion échouerait proprement
-- au lieu de créer un doublon.
--
-- Sans danger pour les données existantes tant qu'il n'y a pas déjà deux
-- paiements avec le même stripe_session_id en base (peu probable, mais la
-- commande ci-dessous te préviendrait avec une erreur explicite si c'était
-- le cas plutôt que d'échouer silencieusement).
-- À exécuter une seule fois dans le SQL Editor de Supabase.

create unique index if not exists paiements_stripe_session_id_unique
  on paiements (stripe_session_id)
  where stripe_session_id is not null;
