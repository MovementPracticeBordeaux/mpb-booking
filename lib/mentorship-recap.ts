// Récap hebdomadaire du Mentorat : un email par élève actif, le dimanche soir,
// avec sa semaine (séances notées, validations, retours) et son étape en cours.
// Un élève qui n'a rien fait de la semaine ne reçoit rien : pas de relance.
import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { libelleModule } from '@/lib/mentorship-notifs';
import { bilanDepuis, etapeEnCours, type LigneProgression } from '@/lib/mentorship-bilan';

const URL_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.movementpracticebordeaux.com';

function echapper(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function estDimancheAParis(maintenant: Date): boolean {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Paris' }).format(maintenant) === 'Sun';
}

export function composerRecap(nom: string | null, lignes: LigneProgression[], perfs: { cree_le: string }[], maintenant: Date): { sujet: string; html: string } | null {
  const depuis = new Date(maintenant.getTime() - 7 * 24 * 3600 * 1000);
  const b = bilanDepuis(lignes, perfs, depuis);
  const envoisRecents = lignes.filter((l) => l.submitted_at && new Date(l.submitted_at) >= depuis).length;
  if (b.seances === 0 && b.validees.length === 0 && b.aRetravailler.length === 0 && envoisRecents === 0) return null;

  const noms = (ids: string[]) => ids.map((id) => echapper(libelleModule(id).exercice)).join(', ');
  const points: string[] = [];
  points.push(`<strong>${b.seances} séance${b.seances > 1 ? 's' : ''}</strong> notée${b.seances > 1 ? 's' : ''} cette semaine (repère : 3 à 5), ${b.perfsNotees} exercice${b.perfsNotees > 1 ? 's' : ''} suivi${b.perfsNotees > 1 ? 's' : ''}.`);
  if (b.validees.length > 0) points.push(`<strong>Validé${b.validees.length > 1 ? 's' : ''} :</strong> ${noms(b.validees)}.`);
  if (b.aRetravailler.length > 0) points.push(`<strong>À retravailler</strong> (le retour de Sylvain t'attend) : ${noms(b.aRetravailler)}.`);
  if (b.enAttente.length > 0) points.push(`<strong>En attente de validation :</strong> ${noms(b.enAttente)}.`);
  points.push(`<strong>Ton étape :</strong> ${echapper(etapeEnCours(lignes))}.`);

  const html = `
    <p>Bonjour${nom ? ` ${echapper(nom)}` : ''},</p>
    <p>Voici ta semaine de Mentorat :</p>
    <ul>${points.map((p) => `<li style="margin-bottom:6px">${p}</li>`).join('')}</ul>
    <p><a href="${URL_SITE}/mentorship">Ouvrir ma séance du jour</a></p>
    <p>— Movement Practice Bordeaux</p>`;
  return { sujet: 'Mentorat — ta semaine', html };
}

export async function envoyerRecapsHebdo(maintenant: Date): Promise<{ envoyes: number; echecs: number }> {
  const admin = supabaseAdmin();
  const { data: abos } = await admin.from('abonnements').select('eleve_id').eq('categorie', 'mentorat').eq('abonnement_actif', true).eq('gele', false);
  const ids = [...new Set((abos ?? []).map((a) => a.eleve_id as string))];
  if (ids.length === 0) return { envoyes: 0, echecs: 0 };

  const [{ data: profils }, { data: progression }, { data: perfs }] = await Promise.all([
    admin.from('profiles').select('id, email, nom').in('id', ids),
    admin.from('mentorship_progression').select('eleve_id, module_id, statut, submitted_at, reviewed_at').in('eleve_id', ids),
    admin.from('mentorship_perf').select('eleve_id, cree_le').in('eleve_id', ids).gte('cree_le', new Date(maintenant.getTime() - 8 * 24 * 3600 * 1000).toISOString()),
  ]);

  let envoyes = 0;
  let echecs = 0;
  for (const profil of profils ?? []) {
    if (!profil.email) continue;
    const recap = composerRecap(
      profil.nom,
      (progression ?? []).filter((l) => l.eleve_id === profil.id),
      (perfs ?? []).filter((p) => p.eleve_id === profil.id),
      maintenant,
    );
    if (!recap) continue;
    try {
      await envoyerEmail(profil.email, recap.sujet, recap.html);
      envoyes++;
    } catch {
      echecs++;
    }
  }
  return { envoyes, echecs };
}
