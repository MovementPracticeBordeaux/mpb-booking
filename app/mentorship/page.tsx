import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { STRUCTURE_SEANCE } from '@/lib/mentorship-modules';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import ArbreCompetences from './ArbreCompetences';

export const dynamic = 'force-dynamic';

type StatutSoumission = 'en_attente' | 'acquis' | 'refuse';
type Progression = { module_id: string; statut: StatutSoumission; video_url: string | null; commentaire_coach: string | null };

export default async function MentorshipPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const accesAutorise = ['mentorship', 'post_mentorship'].includes(profil?.formule_nom ?? '')
    && profil?.abonnement_actif && !profil?.gele;

  if (!accesAutorise) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, letterSpacing: 0.5 }}>MENTORSHIP</h1>
        <p style={{ color: COULEURS.texteAtt }}>
          Cette page est réservée aux élèves ayant le programme Mentorship actif.
          {' '}Rends-toi sur <a href="/tarifs" style={{ color: '#f0a' }}>la page tarifs</a> pour y accéder,
          ou contacte Sylvain si tu penses qu'il y a une erreur.
        </p>
      </main>
    );
  }

  const { data: progressionData } = await supabase
    .from('mentorship_progression')
    .select('module_id, statut, video_url, commentaire_coach')
    .eq('eleve_id', user.id);
  const progression = new Map<string, Progression>((progressionData ?? []).map((p: Progression) => [p.module_id, p]));

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        PROGRAMME <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 20 }}>
        Le tronc — l'Armure Organique — se gravit en 3 niveaux, et porte les cinq branches qui progressent
        en parallèle. Un niveau de branche ne se débloque que si le niveau correspondant du tronc est acquis,
        et certaines compétences croisent plusieurs branches : un niveau de force donné correspond à un
        niveau de figure donné, par exemple.
      </p>

      {searchParams.erreur && (
        <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{searchParams.erreur}</p>
      )}

      <ArbreCompetences progression={progression} />

      <details style={{ marginTop: 32, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 20 }}>
        <summary style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, cursor: 'pointer' }}>
          Comment structurer une séance
        </summary>
        {STRUCTURE_SEANCE.map((etape, i) => (
          <div key={etape.etape} style={{ marginTop: 12 }}>
            <p style={{ fontSize: 14, margin: 0 }}>{i + 1}. {etape.etape}</p>
            <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '2px 0 0' }}>{etape.detail}</p>
          </div>
        ))}
      </details>
    </main>
  );
}
