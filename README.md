# MPB Booking — V1

Application de planning et réservation pour Movement Practice Bordeaux, avec
abonnement illimité ou carnets de séances payés via Stripe.

## Ce qu'il y a dans cette V1

- Planning public (lecture seule) avec alternance semaine A / semaine B
- Connexion élève par lien magique (email, pas de mot de passe à gérer)
- Réservation d'un créneau (décompte automatique selon la formule)
- Page admin (`/admin`) pour toi seul : ajouter des créneaux, définir la semaine
  de référence, **attribuer manuellement une formule à un élève** (payé ou offert)
- Paiement Stripe pour les 12 formules réelles — **toutes en achat ponctuel**,
  aucune n'est un abonnement récurrent Stripe (ce sont des pass à durée de
  validité fixe). La liste complète et ses règles (quota, durée de validité,
  catégorie) sont centralisées dans `lib/formules.ts` :
  - **Cours collectifs** (réservés sur le planning) : Cours découverte,
    Illimité, 8 cours/mois, 4 cours/mois, Carnet 10 cours, Carnet 5 cours
  - **Coaching & Mentorship** (pas de réservation de créneau — après achat,
    l'élève est invité à contacter Sylvain via la page `/coaching` pour caler
    son créneau) : Coaching à l'unité, Carnet coaching 4h, Carnet coaching 3h,
    Coaching Online, Programme Mentorship, Suivi Post-Mentorship

Pas encore inclus (à ajouter ensuite si besoin) : annulation de réservation par
l'élève, emails de confirmation, export comptable.

## Étape 1 — Créer la base de données (Supabase)

1. Va sur https://supabase.com, crée un compte gratuit, crée un nouveau projet.
2. Une fois le projet créé, va dans **SQL Editor** > New query, colle tout le
   contenu du fichier `supabase/schema.sql`, clique sur **Run**.
3. Va dans **Project Settings > API** : note l'URL du projet et les deux clés
   (`anon public` et `service_role` — celle-ci reste secrète).
4. Dans **Authentication > Providers**, vérifie que "Email" est activé (avec
   "Confirm email" désactivé si tu veux du magic link direct sans double étape).
5. Pour te donner le rôle admin : va dans **Table Editor > profiles** une fois
   que tu t'es connecté une première fois sur le site (ça crée ta ligne), puis
   change manuellement `role` à `admin` sur ta ligne.

## Étape 2 — Créer les produits Stripe

1. Dans ton Dashboard Stripe > **Produits**, crée 12 produits, tous en
   **"Achat ponctuel"** (aucun n'est récurrent) : Cours découverte, Illimité,
   8 cours/mois, 4 cours/mois, Carnet 10 cours, Carnet 5 cours, Coaching à
   l'unité, Carnet coaching 4h, Carnet coaching 3h, Coaching Online,
   Programme Mentorship, Suivi Post-Mentorship — avec les prix indiqués sur
   ton site actuel.
2. Copie chaque `price_id` (commence par `price_...`) et remplace les valeurs
   `price_XXXX_...` dans `app/tarifs/page.tsx` (objet `PRICE_IDS`).
3. Dans **Developers > API keys**, récupère ta clé secrète (`sk_...`).
4. Dans **Developers > Webhooks**, tu créeras l'endpoint après le déploiement
   (étape 4), une fois que tu as l'URL de ton site.

## Étape 3 — Mettre le code sur GitHub

Depuis ton compte GitHub existant :

1. Crée un nouveau repo (ex: `mpb-booking`), vide, sans README.
2. En local (ou dans un terminal), dans le dossier du projet :
   ```
   git init
   git add .
   git commit -m "V1 booking app"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/mpb-booking.git
   git push -u origin main
   ```

## Étape 4 — Déployer sur Vercel

1. Va sur https://vercel.com, connecte-toi avec ton compte GitHub.
2. **New Project** > sélectionne le repo `mpb-booking`.
3. Dans **Environment Variables**, ajoute toutes les valeurs de `.env.example`
   (Supabase + Stripe + `NEXT_PUBLIC_SITE_URL` = l'URL Vercel, tu la mettras à
   jour une fois le sous-domaine branché).
4. Clique **Deploy**. Au bout de 2 minutes, ton site est en ligne sur une URL
   du type `mpb-booking.vercel.app`.

## Étape 5 — Brancher ton sous-domaine

1. Dans Vercel > ton projet > **Settings > Domains**, ajoute
   `reservation.movementpracticebordeaux.com`.
2. Vercel te donne un enregistrement DNS (type CNAME) à ajouter.
3. Va dans les paramètres DNS de ton nom de domaine (souvent chez Wix ou ton
   registrar) et ajoute cet enregistrement CNAME.
4. Une fois propagé (jusqu'à 24h, souvent moins), ton site répond sur ce
   sous-domaine.
5. Retourne dans Stripe > **Webhooks**, crée l'endpoint
   `https://reservation.movementpracticebordeaux.com/api/stripe/webhook`,
   sélectionne l'événement `checkout.session.completed`, copie le "Signing
   secret" dans la variable `STRIPE_WEBHOOK_SECRET` sur Vercel.

## Étape 6 — Sur ton site Wix

Remplace les boutons "RÉSERVER UN COURS" pour qu'ils pointent vers
`https://reservation.movementpracticebordeaux.com`.

## Utilisation au quotidien

- Toi : connecte-toi, va sur `/admin`, ajoute/modifie tes créneaux semaine A et B.
- Tes élèves : vont sur le site, se connectent par email, réservent leurs cours.
- Pour offrir un cours d'essai ou une formule sans passer par Stripe (paiement
  reçu autrement, geste commercial) : sur `/admin`, section "Attribuer une
  formule à un élève", choisis l'élève et la formule, décoche "Payé" si c'est
  offert. Le compteur (carnet ou quota mensuel) et la validité sont gérés
  automatiquement, exactement comme pour un paiement Stripe.
