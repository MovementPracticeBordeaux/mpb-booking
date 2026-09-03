-- Nomenclature de progression pour objectifs_mentorship, en complément des
-- relations "sert à" / "repose sur" définies une par une (objectifs_relations).
-- Plutôt que de relier des centaines de vidéos une à une, on classe chaque
-- vidéo par famille de mouvement (ex. Tirer, Pousser, Pont, QDR...) et par
-- niveau numérique au sein de cette famille : la progression au sein d'une
-- même famille devient alors implicite (niveau 1 -> niveau 2 -> ...), sans
-- avoir besoin d'une relation explicite pour chaque maillon.
--
-- Les liens ENTRE branches différentes (ex. push-up en Force qui débloque
-- l'elbow lever en Figures) ne sont volontairement PAS automatisés : ils
-- restent du contenu théorique écrit, transmis à l'élève dans le texte
-- d'accompagnement plutôt que dans la base de données.
--
-- 'famille' peut représenter soit une vraie famille de mouvement
-- fondamentale (Tirer, Pousser, Floor work, Bipédie, Quadrupédie,
-- Brachiation, Reptation...), soit un "chunk" -- un trick qui mélange
-- plusieurs mouvements entre eux (Pont, QDR, Assis en rotation, Cosaque,
-- Roll + Frog one leg...). Les deux utilisent le même mécanisme
-- famille + niveau, la distinction est purement conceptuelle (portée par
-- le nom de la famille et les notes), pas structurelle.
--
-- 'ordre_famille' permet d'ordonner les familles ENTRE elles (utile
-- surtout pour les 5 familles de mouvement fondamentales de Locomotion :
-- Floor work < Bipédie < Quadrupédie < Brachiation < Reptation, ordonnées
-- de la plus simple à la plus complexe) -- indépendant du niveau interne à
-- chaque famille.
--
-- La fonctionnalité "complémentaire à" (relation symétrique) a été
-- retirée : jugée non indispensable et source de complexité inutile pour
-- le classement. Les 23 relations existantes ont été supprimées.
alter table objectifs_mentorship
  add column if not exists famille text,
  add column if not exists niveau integer,
  add column if not exists bras_tendu boolean,
  add column if not exists ordre_famille integer;

-- Le classement complet des 333 objectifs (familles, niveaux, notes) a été
-- fait en conversation avec Sylvain plutôt que via l'interface admin --
-- voir l'historique Supabase pour le détail des valeurs. Ce fichier documente
-- uniquement la structure, pas les données (trop volumineuses et évolutives
-- pour être répétées ici).
