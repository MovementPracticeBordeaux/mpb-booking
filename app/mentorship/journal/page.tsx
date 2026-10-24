import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import JournalComplet from '../JournalComplet';

export const dynamic = 'force-dynamic';

// Page autonome du journal : même composant que l'onglet Journal du
// Mentorat (texte ou liste, sujets, vue par jour / par sujet).
export default async function JournalPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: aboMentorat } = await supabase
    .from('abonnements')
    .select('gele')
    .eq('eleve_id', user.id)
    .eq('categorie', 'mentorat')
    .eq('abonnement_actif', true)
    .maybeSingle();
  const accesAutorise = !!aboMentorat && !aboMentorat.gele;

  if (!accesAutorise) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28 }}>JOURNAL D'ENTRAÎNEMENT</h1>
        <p style={{ color: COULEURS.texteAtt }}>Cette page est réservée aux élèves ayant le Mentorat actif.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 16px' }}>
        JOURNAL <span style={GRADIENT_TEXTE}>D'ENTRAÎNEMENT</span>
      </h1>
      <JournalComplet />
    </main>
  );
}
