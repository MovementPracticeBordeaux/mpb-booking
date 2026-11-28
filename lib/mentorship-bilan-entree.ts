// Bilan d'entrée du Mentorat : libellés partagés (élève, coach) et types.
export type Experience = 'debut' | 'moins_1_an' | '1_3_ans' | 'plus_3_ans';
export type SeancesSemaine = '1_2' | '3' | '4_5';
export type Qualite = 'force' | 'figures' | 'locomotion' | 'connexion' | 'flexibilite';

export type BilanEntree = {
  experience: Experience;
  points_forts: Qualite[];
  points_faibles: Qualite[];
  objectif: Qualite | null;
  seances_semaine: SeancesSemaine;
  blessures: string | null;
};

export const LIBELLES_EXPERIENCE: Record<Experience, string> = {
  debut: 'Je débute',
  moins_1_an: "Moins d'un an de pratique",
  '1_3_ans': '1 à 3 ans de pratique',
  plus_3_ans: 'Plus de 3 ans de pratique',
};

export const LIBELLES_SEANCES: Record<SeancesSemaine, string> = {
  '1_2': '1 à 2 séances par semaine',
  '3': '3 séances par semaine',
  '4_5': '4 à 5 séances par semaine',
};

// Formulées pour quelqu'un qui ne connaît pas encore les noms des branches.
export const LIBELLES_QUALITES: Record<Qualite, string> = {
  force: 'La force (tractions, dips, pompes…)',
  figures: 'Les équilibres (sur les mains, sur les coudes)',
  locomotion: 'Les déplacements au sol',
  connexion: 'La coordination, l’adresse',
  flexibilite: 'La souplesse, la mobilité',
};

export const NOMS_COURTS_QUALITES: Record<Qualite, string> = {
  force: 'Force', figures: 'Figures', locomotion: 'Locomotion', connexion: 'Connexion', flexibilite: 'Flexibilité',
};

// Profil « déjà solide » : de l'expérience et une base en force ET en souplesse.
// Sert à lui proposer d'emblée le mode accéléré de l'Armure.
export function profilSolide(b: BilanEntree | null): boolean {
  if (!b) return false;
  return (b.experience === '1_3_ans' || b.experience === 'plus_3_ans')
    && b.points_forts.includes('force') && b.points_forts.includes('flexibilite');
}
