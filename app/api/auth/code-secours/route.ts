import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';

// Envoi de code de connexion de secours, utilisé uniquement quand la
// vérification anti-robot Cloudflare ne peut pas se charger chez l'élève
// (DNS privé / bloqueur de pub sur Android, Relais privé iCloud...).
//
// Pourquoi c'est sûr sans captcha : réservé aux comptes DÉJÀ existants (le
// captcha servait surtout à empêcher les bots de créer des faux comptes),
// et limité en fréquence par adresse et globalement.
const MAX_PAR_EMAIL_HEURE = 5;
const DELAI_MIN_ENTRE_ENVOIS_MS = 60_000;
const MAX_GLOBAL_HEURE = 40;

const REPONSE_GENERIQUE = {
  ok: true,
  message: 'Si un compte existe pour cette adresse, un code vient de lui être envoyé.',
};

export async function POST(req: NextRequest) {
  const { email: brut } = await req.json().catch(() => ({ email: '' }));
  const email = String(brut ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, message: 'Adresse email invalide.' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const ilYAUneHeure = new Date(Date.now() - 3600_000).toISOString();

  const { count: totalHeure } = await admin
    .from('login_code_secours')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', ilYAUneHeure);
  if ((totalHeure ?? 0) >= MAX_GLOBAL_HEURE) {
    return NextResponse.json({ ok: false, message: 'Service momentanément saturé, réessaie dans quelques minutes ou écris à Sylvain.' }, { status: 429 });
  }

  const { data: envoisRecents } = await admin
    .from('login_code_secours')
    .select('created_at')
    .eq('email', email)
    .gte('created_at', ilYAUneHeure)
    .order('created_at', { ascending: false });
  if ((envoisRecents?.length ?? 0) >= MAX_PAR_EMAIL_HEURE) {
    return NextResponse.json({ ok: false, message: 'Trop de demandes pour cette adresse, réessaie dans une heure.' }, { status: 429 });
  }
  if (envoisRecents?.[0] && Date.now() - new Date(envoisRecents[0].created_at).getTime() < DELAI_MIN_ENTRE_ENVOIS_MS) {
    return NextResponse.json({ ok: false, message: 'Un code vient déjà d’être envoyé, attends une minute avant d’en redemander un.' }, { status: 429 });
  }

  await admin.from('login_code_secours').insert({ email });

  const { data: profil } = await admin.from('profiles').select('id').ilike('email', email).maybeSingle();
  // Réponse identique que le compte existe ou non (ne révèle pas qui est inscrit).
  if (!profil) return NextResponse.json(REPONSE_GENERIQUE);

  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const code = lien?.properties?.email_otp;
  if (error || !code) {
    console.error('Code de secours : generateLink a échoué', error?.message);
    return NextResponse.json({ ok: false, message: 'Envoi impossible pour le moment, écris à Sylvain sur WhatsApp.' }, { status: 500 });
  }

  try {
    await envoyerEmail(
      email,
      `Ton code de connexion : ${code}`,
      `<p>Voici ton code de connexion à Movement Practice Bordeaux :</p>
       <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
       <p>Saisis-le sur la page de connexion. Il est valable une heure.</p>
       <p style="opacity:0.6">Tu n'as rien demandé ? Ignore simplement cet email.</p>`
    );
  } catch (e: any) {
    console.error('Code de secours : envoi email échoué', e?.message);
    return NextResponse.json({ ok: false, message: 'Envoi impossible pour le moment, écris à Sylvain sur WhatsApp.' }, { status: 500 });
  }

  return NextResponse.json(REPONSE_GENERIQUE);
}
