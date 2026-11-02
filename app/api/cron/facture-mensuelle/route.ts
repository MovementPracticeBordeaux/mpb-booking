import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { alerterAdminPush } from '@/lib/alerte-admin';
import { CLIENT_FACTURE_MENSUELLE as CLIENT, seancesTenuesDuMois, moisPrecedent, libelleMois } from '@/lib/facture-mensuelle';

export const dynamic = 'force-dynamic';

// Appelée le 1er de chaque mois par la planification Supabase (pg_cron),
// avec le même jeton que le rappel admin. Crée et envoie la facture du mois
// écoulé à Anne Laudoyer. Idempotente : une seule facture par mois.
// ?mois=YYYY-MM permet de (re)lancer un mois précis à la main.
async function appelAutorise(req: NextRequest): Promise<boolean> {
  const jeton = req.headers.get('x-jeton-cron');
  if (!jeton) return false;
  const { data } = await supabaseAdmin().from('config_interne').select('valeur').eq('cle', 'jeton_cron_rappel_admin').maybeSingle();
  return !!data?.valeur && data.valeur.length === jeton.length && data.valeur === jeton;
}

export async function GET(req: NextRequest) {
  if (!(await appelAutorise(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const admin = supabaseAdmin();
  const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const parametre = req.nextUrl.searchParams.get('mois');
  const mois = parametre && /^\d{4}-\d{2}$/.test(parametre) ? parametre : moisPrecedent(aujourdhui);
  const libelle = `${CLIENT.description} — ${libelleMois(mois)}`;

  // Déjà facturé ce mois-ci ?
  const { data: existantes } = await admin.from('factures_manuelles').select('id, lignes').eq('email_client', CLIENT.email);
  if ((existantes ?? []).some((f) => (f.lignes as { description: string }[])?.some((l) => l.description === libelle))) {
    return NextResponse.json({ ok: true, mois, raison: 'déjà facturé' });
  }

  const { data: ref } = await admin.from('semaine_reference').select('*').eq('id', 1).maybeSingle();
  if (!ref) return NextResponse.json({ ok: false, raison: 'pas de semaine de référence' }, { status: 500 });
  const { data: cours } = await admin.from('cours').select('id, jour_semaine, semaine, heure_debut, actif');
  const { data: vacances } = await admin.from('vacances').select('date_debut, date_fin');
  const { data: annulations } = await admin.from('seances_annulees').select('cours_id, date_seance')
    .gte('date_seance', `${mois}-01`).lte('date_seance', `${mois}-31`);

  const dates = seancesTenuesDuMois({
    mois,
    cours: cours ?? [],
    lundiReference: ref.date_lundi_reference,
    semaineCeLundi: ref.semaine_ce_lundi,
    vacances: vacances ?? [],
    annulations: annulations ?? [],
  });

  if (dates.length === 0) {
    await alerterAdminPush('Facture Anne Laudoyer', `Aucun cours du mardi soir en ${libelleMois(mois)} : pas de facture.`, '/admin/factures');
    return NextResponse.json({ ok: true, mois, cours: 0 });
  }

  const lignes = [{ description: libelle, prixUnitaire: CLIENT.prixUnitaire, quantite: dates.length }];
  const total = CLIENT.prixUnitaire * dates.length;
  const { data: facture, error } = await admin.from('factures_manuelles').insert({
    nom_client: CLIENT.nom, email_client: CLIENT.email, telephone_client: CLIENT.telephone, lignes, total,
  }).select('id').single();
  if (error || !facture) {
    await alerterAdminPush('Facture Anne Laudoyer', `Création impossible : ${error?.message ?? 'erreur inconnue'}`, '/admin/factures');
    return NextResponse.json({ ok: false, erreur: error?.message }, { status: 500 });
  }

  const lien = `${process.env.NEXT_PUBLIC_SITE_URL}/facture-externe/${facture.id}`;
  try {
    await envoyerEmail(
      CLIENT.email,
      `Facture Movement Practice Bordeaux — ${total.toFixed(2)} €`,
      `<p>Bonjour ${CLIENT.nom},</p>
       <p>Voici la facture pour la prestation convenue :</p>
       <ul><li>${libelle} — ${dates.length} × ${CLIENT.prixUnitaire.toFixed(2)} € — ${total.toFixed(2)} €</li></ul>
       <p><strong>Total : ${total.toFixed(2)} €</strong></p>
       <p><a href="${lien}">Voir et imprimer la facture</a></p>
       <p>Merci !</p>`
    );
    await admin.from('factures_manuelles').update({ envoyee_le: new Date().toISOString() }).eq('id', facture.id);
    await alerterAdminPush('Facture envoyée à Anne Laudoyer', `${libelleMois(mois)} : ${dates.length} cours, ${total} €.`, '/admin/factures');
  } catch (e: any) {
    await alerterAdminPush('Facture Anne Laudoyer', `Créée mais email non envoyé : ${e?.message ?? 'erreur'}. À envoyer depuis Admin → Factures.`, '/admin/factures');
  }

  return NextResponse.json({ ok: true, mois, cours: dates.length, dates, total });
}
