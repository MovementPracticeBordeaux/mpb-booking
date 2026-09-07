# Nomenclature de progression — suivi du classement (objectifs_mentorship)

Voir `migration_objectifs_famille_niveau.sql` pour la structure des champs
(famille, niveau, bras_tendu, ordre_famille). Ce fichier suit l'avancement
du classement des 333 objectifs, fait en conversation directe avec Sylvain
plutôt que via l'interface admin.

## Branches entièrement classées

- **Force** — familles Tirer (10 niveaux), Pousser (10 niveaux + 4 préparations),
  Bras tendus (5 niveaux + 1 préparation). Anneaux répartis dans Tirer/Pousser.
  Plusieurs vidéos déplacées vers Armure Organique (Rowing bûcheron, Suspension
  un bras, Front squat — prérequis/préparation plutôt que maillons de chaîne).

- **Locomotion** — 14 familles/chunks : Pont (9 niv., partagé avec QDR), QDR
  (8 niv.), Assis en rotation (3 niv.), Vocabulaire de mouvement (couplé avec
  Intégration), Intégration (8 niv.), Brachiation (5 niv.), Bipédie (2 niv.),
  Quadrupédie (3 niv.), Reptation (3 niv.), Floor work, Cosaque, Improvisation,
  Roll + Frog one leg, Bipédie + Brachiation. Ordre des 5 familles fondamentales :
  Floor work < Bipédie < Quadrupédie < Brachiation < Reptation.

- **Figures** — 6 familles ordonnées : Frog (1) < Pont (2) < L-sit (3) <
  Handstand (4, 3 paliers déb./interm./avancé) < Elbow lever (5) < QDR (6).

- **Connexion** — 6 familles ordonnées : Brain work (1, 7 niv.) < Équilibre
  (2) < Saut (3) < Dribble mains (4) < Dribble pieds (5) < Manipulation (6).

- **Flexibilité** — particularité de cette branche : la progression repose
  surtout sur la RÉGULARITÉ du travail dans le temps (contrairement aux
  autres branches, les niveaux de flexibilité dépendent énormément du point
  de départ individuel, et il n'y a pas de réel intérêt à "performer" les
  figures extrêmes). Le champ niveau représente donc des variantes plus ou
  moins profondes d'un même mouvement plutôt que des verrous stricts de
  progression. 5 familles ordonnées : Stretch actif / Stretch passif (1,
  ex-æquo) < Jefferson curl / Pancake-Straddle (2, ex-æquo — contiennent
  eux-mêmes une progression déb./interm./avancé) < Squats unilatéraux (3).

## Reste à faire

- Rien ! Les 333 objectifs des 7 branches sont classés (Force, Locomotion,
  Figures, Connexion, Flexibilité, Armure Organique). "Hybride" (9 vidéos)
  n'a jamais fait partie du périmètre visé, laissé de côté volontairement.
- Champ `bras_tendu` (booléen) ajouté au schéma mais jamais renseigné —
  prévu comme étiquette secondaire pour Force/Tirer, pas encore utilisé
  en pratique.
- Plusieurs vidéos volontairement laissées hors classement dans chaque
  branche (doublons, vidéos "routine"/compilation, contenus jugés peu
  utiles) — repérables via `famille is null and note is not null`.

## Armure Organique — structure spécifique

Contrairement aux autres branches (famille + niveau = chaîne de
progression linéaire), Armure Organique utilise un système de tags
multiples par vidéo (`famille` = région du corps concernée : Épaules, Bas
du corps, Scapula, Colonne vertébrale, Avant-bras, Respiration/système
nerveux, Haut du corps ; `tags` = objectifs transversaux qu'une vidéo sert,
séparés par des virgules — ex. "Santé, Préparation Handstand, Préparation
Locomotion"). Une même vidéo peut donc servir plusieurs objectifs à la
fois, contrairement au modèle famille+niveau strict des autres branches.

Plusieurs vidéos ont été transférées entre branches au fil du classement
quand leur contenu correspondait mieux ailleurs (ex. Rowing bûcheron,
Suspension un bras, Front squat → Armure Organique depuis Force ; Fermeture
flexibilité, GM Unilatéral → Flexibilité/Jefferson curl depuis Armure
Organique ; Cossack, Dragon squat, Split squat, Sissy squat → Locomotion/
Bipédie depuis Flexibilité).
