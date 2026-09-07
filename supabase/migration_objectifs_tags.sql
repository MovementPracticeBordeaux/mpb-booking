-- Champ additionnel pour la branche Armure Organique, qui fonctionne
-- différemment des autres (famille + niveau = chaîne de progression
-- linéaire) : une même vidéo peut y servir plusieurs objectifs à la fois
-- (ex. une vidéo de mobilité d'épaule peut être à la fois "Santé",
-- "Préparation Handstand" et "Préparation Locomotion").
--
-- Pour cette branche : `famille` redevient une simple région du corps
-- (Épaules, Bas du corps, Scapula...), et `tags` (texte libre, plusieurs
-- valeurs séparées par des virgules) porte les objectifs transversaux.
alter table objectifs_mentorship add column if not exists tags text;
