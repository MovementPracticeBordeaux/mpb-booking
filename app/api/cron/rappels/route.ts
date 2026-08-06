import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';

// Appelée automatiquement une fois par jour par Vercel Cron (voir vercel.json).
// Envoie un email de rappel à chaque élève ayant un cours réservé le lendemain.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const admin = supabaseAdmin();

  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  const demainStr = demain.toISOString().slice(0, 10);

  const { data: reservations, error } = await admin
    .from('reservations')
    .select('*, cours(discipline, heure_debut, heure_fin, lieu), profiles(email)')
    .eq('date_seance', demainStr)
    .eq('statut', 'confirmee');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let envoyes = 0;
  let echecs = 0;

  for (const r of reservations ?? []) {
    const email = (r as any).profiles?.email;
    const cours = (r as any).cours;
    if (!email || !cours) continue;
    try {
      await envoyerEmail(
        email,
        `Rappel : ton cours de ${cours.discipline} demain`,
        `<p>Bonjour,</p>
         <p>Petit rappel : tu es inscrit·e au cours de <strong>${cours.discipline}</strong> demain,
         de ${cours.heure_debut.slice(0, 5)} à ${cours.heure_fin.slice(0, 5)}${cours.lieu ? ` (${cours.lieu})` : ''}.</p>
         <p>À demain !</p>`
      );
      envoyes++;
    } catch {
      echecs++;
    }
  }

  return NextResponse.json({ envoyes, echecs, total: (reservations ?? []).length });
}
