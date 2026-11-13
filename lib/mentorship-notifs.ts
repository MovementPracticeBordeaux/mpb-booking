// Notifications du Mentorat : prévenir Sylvain quand une vidéo arrive, et
// l'élève quand son retour est disponible (push + email). Tout échoue en
// silence : une notification qui plante ne doit jamais faire échouer la
// soumission ou la validation elle-même.
import { TOUS_LES_NOEUDS } from '@/lib/mentorship-modules';
import { envoyerPushAEleve } from '@/lib/push';
import { envoyerEmail } from '@/lib/resend';
import { alerterAdminPush } from '@/lib/alerte-admin';
import { supabaseAdmin } from '@/lib/supabase-server';

const URL_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.movementpracticebordeaux.com';

// "force-2::dips-anneaux" -> { exercice: "Dips aux anneaux…", niveau: "Force · niveau 2" }
export function libelleModule(moduleId: string): { exercice: string; niveau: string } {
  const [noeudId, exerciceId] = moduleId.split('::');
  const noeud = TOUS_LES_NOEUDS.find((n) => n.id === noeudId);
  if (!noeud) return { exercice: moduleId, niveau: 'Mentorat' };
  const branche = noeud.domaine === 'tronc' ? 'Armure Organique' : noeud.domaine.charAt(0).toUpperCase() + noeud.domaine.slice(1);
  const niveau = `${branche} · niveau ${noeud.niveau}`;
  if (!exerciceId) return { exercice: noeud.titre, niveau };
  const ex = [...(noeud.exercices ?? []), ...(noeud.progressionBonus ?? [])].find((e) => e.id === exerciceId);
  return { exercice: ex?.nom ?? exerciceId, niveau };
}

function echapper(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Une vidéo vient d'être soumise : push à Sylvain (lien direct vers la file de validation).
export async function notifierVideoSoumise(eleveId: string, moduleId: string) {
  try {
    const { data: profil } = await supabaseAdmin().from('profiles').select('nom, email').eq('id', eleveId).maybeSingle();
    const qui = profil?.nom || profil?.email || 'Un élève';
    const { exercice, niveau } = libelleModule(moduleId);
    await alerterAdminPush('Mentorat — vidéo à valider', `${qui} : ${exercice} (${niveau})`, '/admin/mentorship');
  } catch {
    // non bloquant
  }
}

// Sylvain a validé ou demandé de retravailler : push + email à l'élève.
export async function notifierRetourVideo(eleveId: string, moduleId: string, resultat: 'acquis' | 'refuse', commentaire?: string | null) {
  const { exercice, niveau } = libelleModule(moduleId);
  const valide = resultat === 'acquis';
  const titre = valide ? `✅ Validé : ${exercice}` : `Retour de Sylvain : ${exercice}`;
  const corps = valide
    ? `${niveau} — objectif acquis, bravo.`
    : (commentaire ? commentaire.slice(0, 140) : `${niveau} — à retravailler, le détail t'attend.`);
  try {
    await envoyerPushAEleve(eleveId, titre, corps, '/mentorship');
  } catch {
    // non bloquant
  }
  try {
    const { data: profil } = await supabaseAdmin().from('profiles').select('email, nom').eq('id', eleveId).maybeSingle();
    if (!profil?.email) return;
    const html = `
      <p>Bonjour${profil.nom ? ` ${echapper(profil.nom)}` : ''},</p>
      <p>${valide
        ? `Ta vidéo <strong>${echapper(exercice)}</strong> (${echapper(niveau)}) est <strong>validée</strong>. Bravo !`
        : `Sylvain a regardé ta vidéo <strong>${echapper(exercice)}</strong> (${echapper(niveau)}) : il y a encore un point à retravailler.`}</p>
      ${!valide && commentaire ? `<p style="border-left:3px solid #ff00aa;padding-left:12px;color:#333">${echapper(commentaire).replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${URL_SITE}/mentorship">${valide ? 'Voir ma prochaine étape' : 'Voir le retour et renvoyer une vidéo'}</a></p>
      <p>— Movement Practice Bordeaux</p>`;
    await envoyerEmail(profil.email, valide ? `Mentorat — validé : ${exercice}` : `Mentorat — retour sur ta vidéo : ${exercice}`, html);
  } catch {
    // non bloquant
  }
}
