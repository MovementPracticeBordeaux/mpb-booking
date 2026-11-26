// Petites phrases du Mentorat : déculpabiliser, rappeler que l'essentiel
// suffit, que la régularité compte plus que le volume, et que pratiquer pour
// le plaisir est légitime. Rédaction de Claude, à relire et remplacer
// librement par Sylvain. Une phrase par jour et par endroit (pas de hasard :
// la même phrase reste affichée toute la journée).

export const PHRASES = [
  "L'essentiel fait, ta séance est réussie. Le reste est du bonus.",
  'Une séance courte faite vaut mieux qu’une séance parfaite remise à demain.',
  'Tu ne feras jamais tout. Choisis, et fais-le bien.',
  "Ce n'est pas l'intensité d'un jour qui te fait progresser, c'est le retour, semaine après semaine.",
  "Ta durée de séance est fixée : quand elle est écoulée, c'est fini. Le reste attendra, sans culpabilité.",
  'Le progrès se voit en mois, pas en jours. Note ce que tu fais, ton carnet s’en souviendra.',
  "Tu as le droit d'être moyen dans ce que tu aimes. Le plaisir est une raison suffisante.",
  'Venir, même fatigué, même pour 20 minutes, c’est déjà gagner.',
  "Une semaine à 3 séances tenue vaut mieux qu'une semaine à 6 abandonnée.",
  "Aujourd'hui compte pour lui-même, pas seulement pour le prochain palier.",
  'Récupérer fait partie de l’entraînement.',
  "Tu n'es pas en retard : tu avances à ton rythme, et c'est le seul qui tient.",
] as const;

// Indice stable pour la journée (heure de Paris) et un emplacement donné :
// deux endroits de la page n'affichent pas la même phrase le même jour.
export function phraseDuJour(emplacement: number, maintenant = new Date()): string {
  const jour = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(maintenant); // AAAA-MM-JJ
  const n = Math.floor(Date.parse(`${jour}T00:00:00Z`) / 86400000);
  return PHRASES[(n * 5 + emplacement * 7) % PHRASES.length];
}
