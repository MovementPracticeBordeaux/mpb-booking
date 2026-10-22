import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { envoyerPushAEleve } from '@/lib/push';

// Annulation ponctuelle d'une séance par Sylvain : seuls les inscrits sont
// prévenus, et leur séance ne leur est pas décomptée.

import { casPourInscrit, texteCas, expirationPourNouvelleReservation } from '@/lib/annulation-seance-regles';

export async function annulerSeanceEtPrevenir(coursId: string, dateSeance: string): Promise<{ ok: boolean; erreur?: string; prevenus: number }> {
  const admin = supabaseAdmin();

  const { data: cours } = await admin.from('cours').select('discipline, heure_debut, heure_fin, lieu').eq('id', coursId).maybeSingle();
  if (!cours) return { ok: false, erreur: 'Cours introuvable.', prevenus: 0 };

  // D'abord bloquer la séance : plus personne ne peut la réserver pendant qu'on traite les inscrits.
  const { error: errAnnul } = await admin.from('seances_annulees').insert({ cours_id: coursId, date_seance: dateSeance });
  if (errAnnul) {
    if (errAnnul.code === '23505') return { ok: false, erreur: 'Cette séance est déjà annulée.', prevenus: 0 };
    return { ok: false, erreur: errAnnul.message, prevenus: 0 };
  }

  const { data: reservations } = await admin
    .from('reservations')
    .select('id, eleve_id, a_regler')
    .eq('cours_id', coursId)
    .eq('date_seance', dateSeance)
    .eq('statut', 'confirmee');

  const dateAffichee = new Date(dateSeance + 'T12:00:00Z').toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long',
  });
  const horaire = `${cours.heure_debut.slice(0, 5)}–${cours.heure_fin.slice(0, 5)}`;
  const aujourdhuiISO = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const lienPlanning = `${process.env.NEXT_PUBLIC_SITE_URL}/planning`;

  let prevenus = 0;
  for (const r of reservations ?? []) {
    const { error: errResa } = await admin
      .from('reservations')
      .update({ statut: 'annulee', a_regler: false })
      .eq('id', r.id)
      .eq('statut', 'confirmee');
    if (errResa) continue;

    let abo: { id: string; formule_nom: string; quota_restant: number | null; date_expiration: string | null } | null = null;
    if (!r.a_regler) {
      const { data } = await admin
        .from('abonnements')
        .select('id, formule_nom, quota_restant, date_expiration')
        .eq('eleve_id', r.eleve_id)
        .eq('categorie', 'planning')
        .eq('abonnement_actif', true)
        .maybeSingle();
      abo = data;
    }
    const cas = casPourInscrit(!!r.a_regler, abo);

    if (abo && (cas === 'recredite' || cas === 'une_seance')) {
      const maj: Record<string, unknown> = { quota_restant: (abo.quota_restant ?? 0) + 1 };
      if (cas === 'une_seance') {
        const exp = expirationPourNouvelleReservation(abo.date_expiration, aujourdhuiISO);
        if (exp && exp !== abo.date_expiration) maj.date_expiration = exp;
      }
      await admin.from('abonnements').update(maj).eq('id', abo.id);
    }

    const complement = texteCas(cas);
    const { data: profil } = await admin.from('profiles').select('email, nom').eq('id', r.eleve_id).maybeSingle();
    if (profil?.email) {
      try {
        await envoyerEmail(
          profil.email,
          `Cours annulé : ${cours.discipline} du ${dateAffichee}`,
          `<p>Salut ${profil.nom ?? ''},</p>
           <p>Le cours de <strong>${cours.discipline}</strong> du <strong>${dateAffichee}</strong> (${horaire}${cours.lieu ? `, ${cours.lieu}` : ''}) est annulé.</p>
           ${complement ? `<p>${complement}</p>` : ''}
           ${cas === 'une_seance' ? `<p><a href="${lienPlanning}">Voir le planning</a></p>` : ''}
           <p>À bientôt !</p>`
        );
      } catch {}
    }
    try {
      await envoyerPushAEleve(
        r.eleve_id,
        'Cours annulé',
        `${cours.discipline} du ${dateAffichee} (${horaire}) est annulé.${complement ? ' ' + complement : ''}`,
        '/planning'
      );
    } catch {}
    prevenus++;
  }

  return { ok: true, prevenus };
}
