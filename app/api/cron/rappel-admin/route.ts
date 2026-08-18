import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { calculerSemaine } from '@/lib/semaine';
import { envoyerPushAEleve } from '@/lib/push';

// Appelée fréquemment (toutes les ~15 min, voir le déclencheur choisi —
// Vercel Cron limité à 1x/jour sur le plan Hobby, donc probablement un
// workflow GitHub Actions programmé qui appelle cette route). Vérifie s'il
// y a une séance qui commence dans ~1h30 et prévient l'admin par push :
// discipline, horaire, nombre d'inscrits, et présence éventuelle d'un
// élève en cours découverte (débutant potentiel).
//
// Idempotent via la table admin_rappels_envoyes (clé cours_id+date_seance)
// : peu importe combien de fois cette route est appelée dans la fenêtre,
// chaque séance ne déclenche qu'UN seul envoi.
const FENETRE_MIN = 80;  // borne basse (minutes avant le début du cours)
const FENETRE_MAX = 100; // borne haute — plage de 20 min autour de 90 min,
                          // pour couvrir un appel toutes les 15 min avec marge

// Renvoie l'heure actuelle à Paris, mais encodée comme si c'était de l'UTC
// (mêmes composants année/mois/jour/heure/minute) — pour pouvoir la
// comparer directement à des horaires de cours eux aussi stockés en heure
// locale Paris "naïve". Même principe que le correctif appliqué au RPC
// reserver_creneau (now() at time zone 'Europe/Paris'), transposé en JS.
function maintenantParisNaif(): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const admin = supabaseAdmin();
    const maintenant = maintenantParisNaif();
    const dateStr = maintenant.toISOString().slice(0, 10);

    const { data: ref } = await admin.from('semaine_reference').select('*').eq('id', 1).maybeSingle();
    if (!ref) return NextResponse.json({ ok: true, notifies: 0, raison: 'pas de semaine de référence configurée' });

    const { data: vacances } = await admin.from('vacances').select('date_debut, date_fin');
    const enVacances = (vacances ?? []).some((v) => dateStr >= v.date_debut && dateStr <= v.date_fin);
    if (enVacances) return NextResponse.json({ ok: true, notifies: 0, raison: 'vacances' });

    const lundiRef = new Date(ref.date_lundi_reference);
    const semaineAujourdhui = calculerSemaine(maintenant, lundiRef, ref.semaine_ce_lundi as 'A' | 'B');
    const jourSemaine = maintenant.getUTCDay(); // le Date est "naïf Paris", getUTCDay lit ses composants tels quels

    const { data: coursListe } = await admin
      .from('cours')
      .select('id, discipline, heure_debut, heure_fin, lieu')
      .eq('actif', true)
      .eq('jour_semaine', jourSemaine)
      .eq('semaine', semaineAujourdhui);

    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
    if (!admins || admins.length === 0) return NextResponse.json({ ok: true, notifies: 0, raison: 'aucun admin' });

    let notifies = 0;

    for (const cours of coursListe ?? []) {
      const debutCours = new Date(`${dateStr}T${cours.heure_debut}Z`);
      const minutesAvant = (debutCours.getTime() - maintenant.getTime()) / 60000;
      if (minutesAvant < FENETRE_MIN || minutesAvant > FENETRE_MAX) continue;

      // Marque la séance comme notifiée AVANT d'envoyer (insert avec
      // contrainte d'unicité) : si ça échoue, c'est qu'un appel précédent
      // l'a déjà traitée, on saute sans renvoyer une seconde fois.
      const { error: erreurDedup } = await admin
        .from('admin_rappels_envoyes')
        .insert({ cours_id: cours.id, date_seance: dateStr });
      if (erreurDedup) continue; // déjà envoyé (violation de contrainte unique)

      const { data: reservations } = await admin
        .from('reservations')
        .select('eleve_id')
        .eq('cours_id', cours.id)
        .eq('date_seance', dateStr)
        .eq('statut', 'confirmee');

      const nbInscrits = reservations?.length ?? 0;

      // Présence d'un élève en cours découverte : on regarde si l'un des
      // inscrits a un abonnement 'planning' actif dont la formule est
      // justement 'cours_decouverte'.
      let aUnDecouverte = false;
      if (reservations && reservations.length > 0) {
        const idsEleves = reservations.map((r) => r.eleve_id);
        const { data: abosDecouverte } = await admin
          .from('abonnements')
          .select('eleve_id')
          .eq('categorie', 'planning')
          .eq('formule_nom', 'cours_decouverte')
          .eq('abonnement_actif', true)
          .in('eleve_id', idsEleves);
        aUnDecouverte = (abosDecouverte?.length ?? 0) > 0;
      }

      const titre = `${cours.discipline} dans 1h30`;
      const corps = `${cours.heure_debut.slice(0, 5)}-${cours.heure_fin.slice(0, 5)}${cours.lieu ? ` · ${cours.lieu}` : ''} — ${nbInscrits} inscrit${nbInscrits !== 1 ? 's' : ''}${aUnDecouverte ? ' · 🆕 dont un cours découverte' : ''}`;

      for (const a of admins) {
        try {
          await envoyerPushAEleve(a.id, titre, corps, '/admin/planning');
        } catch {}
      }
      notifies++;
    }

    return NextResponse.json({ ok: true, notifies, coursExamines: (coursListe ?? []).length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
