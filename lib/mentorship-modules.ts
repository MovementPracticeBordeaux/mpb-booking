// Contenu du programme Mentorship, affiché sur /mentorship aux élèves qui
// ont la formule active. À compléter avec le vrai contenu une fois extrait
// de l'ancien site Wix (voir échange du 08/08/2026 sur comment l'extraire :
// texte copié depuis l'éditeur Wix, vidéos récupérées via le Gestionnaire
// de médias Wix — l'accès propriétaire permet le téléchargement contrairement
// à l'accès participant — puis ré-uploadées en "non répertorié" sur YouTube).
//
// Pour ajouter/modifier un module, donne-moi simplement :
// - le titre
// - le texte (description, consignes...)
// - l'ID de la vidéo YouTube si il y en a une (juste les ~11 caractères
//   après "watch?v=" dans l'URL, pas l'URL complète)
// - les liens des fichiers à télécharger si il y en a (PDF...), par exemple
//   un lien de partage Google Drive

export type ModuleMentorship = {
  id: string; // slug stable, sert de clé pour le suivi de progression — ne pas changer une fois publié
  titre: string;
  description: string;
  videoYoutubeId?: string;
  fichiers?: { nom: string; url: string }[];
};

export const MODULES_MENTORSHIP: ModuleMentorship[] = [
  // Exemple de structure, à remplacer par le vrai contenu :
  // {
  //   id: 'module-1-fondations',
  //   titre: 'Module 1 — Les fondations',
  //   description: "Texte du module, consignes, explications...",
  //   videoYoutubeId: 'dQw4w9WgXcQ',
  //   fichiers: [{ nom: 'Programme PDF', url: 'https://drive.google.com/...' }],
  // },
];
