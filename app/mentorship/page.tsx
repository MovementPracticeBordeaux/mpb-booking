import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { TRONC, BRANCHES, STRUCTURE_SEANCE, noeudSansReponses } from '@/lib/mentorship-modules';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import ArbreCompetences from './ArbreCompetences';

export const dynamic = 'force-dynamic';

type Progression = {
  module_id: string;
  statut: 'en_attente' | 'acquis' | 'refuse' | null;
  quiz_reussi: boolean;
  quiz_score: number | null;
  video_url: string | null;
  commentaire_coach: string | null;
};

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

  const [{ data: progressionData }, { data: suiviData }] = await Promise.all([
    supabase
      .from('mentorship_progression')
      .select('module_id, statut, quiz_reussi, quiz_score, video_url, commentaire_coach')
      .eq('eleve_id', user.id),
    supabase
      .from('mentorship_suivi_competence')
      .select('domaine, exercice_ou_theme, statut, commentaire, updated_at')
      .eq('eleve_id', user.id),
  ]);

  const progression = new Map<string, Progression>((progressionData ?? []).map((p: Progression) => [p.module_id, p]));

  // Les nœuds envoyés au client n'ont jamais les bonnes réponses du QCM.
  const troncPublic = TRONC.map(noeudSansReponses);
  const branchesPublic = BRANCHES.map(noeudSansReponses);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        PROGRAMME <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 20 }}>
        Le tronc — l'Armure Organique — se gravit seul, niveau après niveau. Une fois validé en entier,
        les cinq branches s'ouvrent et progressent chacune à son rythme.
      </p>

      {searchParams.erreur && (
        <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{searchParams.erreur}</p>
      )}

      <ArbreCompetences
        tronc={troncPublic}
        branches={branchesPublic}
        progression={progression}
        bilan={suiviData ?? []}
      />

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
