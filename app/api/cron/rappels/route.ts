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

    // Suppression automatique des comptes créés il y a plus de 7 jours et
    // n'ayant JAMAIS eu ni abonnement ni paiement (spam, curieux jamais
    // revenus...) — sans ça, la liste des élèves devient interminable avec
    // le temps. Un compte ayant déjà eu un abonnement ou un paiement, même
    // expiré/inactif aujourd'hui, n'est JAMAIS supprimé automatiquement
    // (garde l'historique commercial/comptable, archivable/filtrable
    // depuis /admin/eleves plutôt que supprimé).
    const NB_JOURS_AVANT_SUPPRESSION = 7;
    let comptesSupprimes = 0;
    try {
      const seuil = new Date();
      seuil.setDate(seuil.getDate() - NB_JOURS_AVANT_SUPPRESSION);

      const { data: profilsAnciens } = await admin
        .from('profiles')
        .select('id, created_at')
        .lt('created_at', seuil.toISOString());

      if (profilsAnciens && profilsAnciens.length > 0) {
        const ids = profilsAnciens.map((p) => p.id);
        const { data: abosExistants } = await admin.from('abonnements').select('eleve_id').in('eleve_id', ids);
        const { data: paiementsExistants } = await admin.from('paiements').select('eleve_id').in('eleve_id', ids);
        // Un contact qui a reçu une facture manuelle (intervention à
        // l'extérieur, prestation ponctuelle...) doit être épargné même
        // s'il n'a jamais pris de formule classique — découvert le
        // 30/08/2026 : Anne Laudoyer (Le Bivouac) supprimée par erreur
        // lors d'un nettoyage manuel avant ce correctif, sans impact réel
        // car sa facture ne dépend pas de son compte (page publique par
        // id), mais son compte de connexion avait bien été perdu.
        const { data: emailsAncienProfils } = await admin.from('profiles').select('id, email').in('id', ids);
        const { data: emailsFactures } = await admin.from('factures_manuelles').select('email_client');
        const emailsFacturesSet = new Set((emailsFactures ?? []).map((f) => f.email_client?.toLowerCase()).filter(Boolean));
        const idsAvecFacture = new Set(
          (emailsAncienProfils ?? []).filter((p) => p.email && emailsFacturesSet.has(p.email.toLowerCase())).map((p) => p.id)
        );
        const idsAvecHistorique = new Set([
          ...(abosExistants ?? []).map((a) => a.eleve_id),
          ...(paiementsExistants ?? []).map((p) => p.eleve_id),
          ...idsAvecFacture,
        ]);

        for (const profil of profilsAnciens) {
          if (idsAvecHistorique.has(profil.id)) continue;
          // Supprime le compte auth (cascade automatiquement vers profiles
          // et toute donnée liée par clé étrangère) plutôt qu'un simple
          // delete sur profiles, pour ne laisser aucun compte orphelin.
          const { error: erreurSuppression } = await admin.auth.admin.deleteUser(profil.id);
          if (!erreurSuppression) comptesSupprimes++;
        }
      }
    } catch (e: any) {
      await alerterAdmin(
        'Le nettoyage des comptes fantômes a échoué',
        `Erreur : ${e?.message ?? 'inconnue'}. Aucun compte n'a été supprimé cette fois, à vérifier.`
      );
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

    return NextResponse.json({ envoyes, echecs, eleves: parEleve.size, reservations: (reservations ?? []).length, degeles, comptesSupprimes });
  } catch (e: any) {
    await alerterAdmin(
      'Le cron des rappels a planté',
      `Erreur inattendue : ${e?.message ?? 'inconnue'}. Vérifie les logs Vercel pour ce cron.`
    );
    return NextResponse.json({ error: e?.message ?? 'Erreur inconnue' }, { status: 500 });
  }
}
