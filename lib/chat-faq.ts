// Base de connaissances du chat FAQ. Chaque entrée a des mots-clés pour le
// matching simple (pas d'IA, juste un score de correspondance de mots).
export type ChatFAQ = { question: string; reponse: string; motsCles: string[] };

export const CHAT_FAQ: ChatFAQ[] = [
  {
    question: 'Où se trouve Movement Practice Bordeaux ?',
    reponse: "Les cours ont lieu à Darwin écosystème, 87 Quai des Queyries, 33100 Bordeaux — en extérieur sur les quais ou en intérieur selon la météo.",
    motsCles: ['où', 'adresse', 'localisation', 'lieu', 'situé', 'trouve', 'darwin', 'quai'],
  },
  {
    question: 'Quels sont les horaires ?',
    reponse: 'Lundi, mercredi et vendredi, de 9h à 21h. Le planning précis des cours est visible sur la page Planning.',
    motsCles: ['horaire', 'heure', 'ouvert', 'ouverture', 'quand'],
  },
  {
    question: 'Comment réserver une place ?',
    reponse: "Directement depuis la page Planning : choisis ta formule, ton créneau, tu réserves, c'est instantané.",
    motsCles: ['réserver', 'réservation', 'book', 'inscrire', 'inscription', 'place'],
  },
  {
    question: 'Quelles disciplines sont enseignées ?',
    reponse: 'Handstand, calisthenics, mobilité, locomotion (mouvement au sol), arm balance et altinha.',
    motsCles: ['discipline', 'cours', 'quoi', 'propose', 'calisthenics', 'handstand', 'mobilité', 'locomotion'],
  },
  {
    question: "C'est adapté aux débutants ?",
    reponse: 'Oui. Les séances sont accessibles à tous niveaux, avec des options et progressions individuelles.',
    motsCles: ['débutant', 'niveau', 'commencer', 'débuter', 'facile', 'accessible'],
  },
  {
    question: 'Quels sont les tarifs ?',
    reponse: 'Cours découverte à 10€, formules de 4 à 8 cours/mois, illimité, ou carnets de 5/10 cours. Tout le détail est sur la page Tarifs.',
    motsCles: ['tarif', 'prix', 'coût', 'combien', 'formule', 'abonnement'],
  },
  {
    question: 'Le coaching individuel, comment ça marche ?',
    reponse: "Des séances d'une heure en présentiel à Bordeaux, ou un programme mensuel en ligne où que tu sois. Plus de détails sur la page Coaching.",
    motsCles: ['coaching', 'individuel', 'privé', 'personnalisé', 'online', 'ligne'],
  },
  {
    question: "Qu'est-ce que le Mentorship ?",
    reponse: "Un mentorat (pas une formation ni un coaching personnalisé) pour comprendre et organiser sa pratique du Mouvement en profondeur. Plus d'infos sur la page Pro.",
    motsCles: ['mentorship', 'mentorat', 'pro', 'professionnel', 'formation', 'enseigner', 'transmettre'],
  },
  {
    question: 'Puis-je annuler ou reporter une réservation ?',
    reponse: "Oui, tu peux gérer tes réservations depuis ton espace, avant le début du cours. Pour un cas particulier, écris directement à Sylvain.",
    motsCles: ['annuler', 'annulation', 'reporter', 'modifier', 'changer'],
  },
];
