import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { envoyerPushAEleve } from '@/lib/push';
import { degelerAbonnement } from '@/app/admin/actions';
import { alerterAdmin } from '@/lib/alerte-admin';

// Appelée automatiquement une fois par jour par Vercel Cron (voir vercel.json).
// Envoie un email de rappel à chaque élève ayant un cours réservé le lendemain.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const admin = supabaseAdmin();

    // Dégel automatique des abonnements dont la date de reprise prévue est
    // atteinte (planifiée depuis l'admin lors du gel). Fait en premier,
    // avant les rappels, pour rester indépendant en cas d'échec des
    // rappels eux-mêmes. Un élève peut avoir plusieurs abonnements gelés
    // en parallèle (ex. planning ET coaching) — chacun est dégelé
    // indépendamment.
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const { data: aDegeler } = await admin
      .from('abonnements')
      .select('id')
      .eq('gele', true)
      .not('date_fin_gel_prevue', 'is', null)
      .lte('date_fin_gel_prevue', aujourdhui);

    let degeles = 0;
    for (const abo of aDegeler ?? []) {
      const resultat = await degelerAbonnement(abo.id);
      if (resultat.ok) degeles++;
    }

    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    const demainStr = demain.toISOString().slice(0, 10);

    const { data: reservations, error } = await admin
      .from('reservations')
      .select('*, cours(discipline, heure_debut, heure_fin, lieu), profiles(email, notif_email_rappel)')
      .eq('date_seance', demainStr)
      .eq('statut', 'confirmee');

    if (error) {
      await alerterAdmin(
        'Les rappels de cours n\'ont pas pu être envoyés',
        `Impossible de récupérer les réservations de demain : ${error.message}`
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Regroupe par élève : s'il a plusieurs cours demain, un seul email et
    // une seule notification push, listant tous les créneaux — plutôt
    // qu'un rappel séparé par cours, redondant et un peu spammy.
    type CoursDuLendemain = { discipline: string; heureDebut: string; heureFin: string; lieu: string | null };
    const parEleve = new Map<string, { email: string | null; notifEmailActive: boolean; cours: CoursDuLendemain[] }>();

    for (const r of reservations ?? []) {
      const eleveId = (r as any).eleve_id as string;
      const cours = (r as any).cours;
      if (!cours) continue;
      const entree = parEleve.get(eleveId) ?? {
        email: (r as any).profiles?.email ?? null,
        notifEmailActive: (r as any).profiles?.notif_email_rappel !== false,
        cours: [] as CoursDuLendemain[],
      };
      entree.cours.push({
        discipline: cours.discipline,
        heureDebut: cours.heure_debut.slice(0, 5),
        heureFin: cours.heure_fin.slice(0, 5),
        lieu: cours.lieu ?? null,
      });
      parEleve.set(eleveId, entree);
    }

    let envoyes = 0;
    let echecs = 0;

    for (const [eleveId, { email, notifEmailActive, cours }] of parEleve) {
      // Ordre chronologique, au cas où la requête ne les aurait pas rendus
      // triés (aucune garantie sans ORDER BY explicite sur la jointure).
      cours.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

      const listeHtml = cours
        .map((c) => `<li><strong>${c.discipline}</strong>, ${c.heureDebut} à ${c.heureFin}${c.lieu ? ` (${c.lieu})` : ''}</li>`)
        .join('');
      const sujet = cours.length > 1
        ? `Rappel : tes ${cours.length} cours demain`
        : `Rappel : ton cours de ${cours[0].discipline} demain`;

      if (email && notifEmailActive) {
        try {
          await envoyerEmail(
            email,
            sujet,
            `<p>Bonjour,</p>
             <p>Petit rappel, tu es inscrit·e ${cours.length > 1 ? 'aux cours suivants' : 'au cours suivant'} demain :</p>
             <ul>${listeHtml}</ul>
             <p>À demain !</p>`
          );
          envoyes++;
        } catch {
          echecs++;
        }
      }
      // La notification push est un bonus best-effort : un échec ici (élève
      // non abonné, endpoint expiré...) ne doit jamais faire échouer le
      // rappel email, qui reste le canal principal.
      try {
        const corps = cours.length > 1
          ? cours.map((c) => `${c.discipline} ${c.heureDebut}-${c.heureFin}`).join(' · ')
          : `${cours[0].heureDebut} - ${cours[0].heureFin}${cours[0].lieu ? ` · ${cours[0].lieu}` : ''}`;
        await envoyerPushAEleve(
          eleveId,
          cours.length > 1 ? `${cours.length} cours demain` : `Cours de ${cours[0].discipline} demain`,
          corps,
          '/planning',
          'rappel'
        );
      } catch {}
    }

    if (echecs > 0) {
      await alerterAdmin(
        `${echecs} email(s) de rappel non envoyé(s)`,
        `Sur ${parEleve.size} élève(s) à prévenir aujourd'hui, ${echecs} envoi(s) ont échoué et ${envoyes} sont bien partis. Vérifie la configuration Resend si ça se reproduit.`
      );
    }

    return NextResponse.json({ envoyes, echecs, eleves: parEleve.size, reservations: (reservations ?? []).length, degeles });
  } catch (e: any) {
    await alerterAdmin(
      'Le cron des rappels a planté',
      `Erreur inattendue : ${e?.message ?? 'inconnue'}. Vérifie les logs Vercel pour ce cron.`
    );
    return NextResponse.json({ error: e?.message ?? 'Erreur inconnue' }, { status: 500 });
  }
}
