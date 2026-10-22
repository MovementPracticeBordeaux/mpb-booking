// Règles pures (testables) de l'annulation ponctuelle d'une séance.

const FORMULES_UNE_SEANCE = ['cours_decouverte', 'cours_unite'];

export type CasInscrit = 'recredite' | 'une_seance' | 'illimite' | 'a_regler' | 'sans_formule';

// Ce qu'on dit à l'élève selon sa situation.
export function texteCas(cas: CasInscrit): string {
  switch (cas) {
    case 'recredite':
      return "Ta séance t'a été recréditée sur ta formule.";
    case 'une_seance':
      return "Ta séance ne t'est pas décomptée : réserve un autre cours quand tu veux sur le planning.";
    case 'a_regler':
      return "Tu n'as rien à régler pour cette séance.";
    default:
      return '';
  }
}

export function casPourInscrit(
  aRegler: boolean,
  abo: { formule_nom: string; quota_restant: number | null } | null,
): CasInscrit {
  if (aRegler) return 'a_regler';
  if (!abo) return 'sans_formule';
  if (abo.formule_nom === 'illimite' || abo.quota_restant == null) return 'illimite';
  if (FORMULES_UNE_SEANCE.includes(abo.formule_nom)) return 'une_seance';
  return 'recredite';
}

// Garantit au moins un mois pour réserver un autre cours avec une formule
// d'une seule séance (cours découverte / à l'unité) dont la séance a été annulée.
export function expirationPourNouvelleReservation(expirationActuelle: string | null, aujourdhuiISO: string): string | null {
  if (!expirationActuelle) return null;
  const d = new Date(aujourdhuiISO + 'T12:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + 1);
  const minimum = d.toISOString().slice(0, 10);
  return expirationActuelle >= minimum ? expirationActuelle : minimum;
}
