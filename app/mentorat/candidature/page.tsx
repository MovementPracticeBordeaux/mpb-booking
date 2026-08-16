import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { MENTORAT_OUVERT, MENTORAT_PLACES_PAR_SESSION } from '@/lib/formules';
import CandidatureForm from './CandidatureForm';

export const metadata = {
  title: 'Candidature Mentorat | Movement Practice Bordeaux',
  description: 'Candidater pour rejoindre le Mentorat de Movement Practice Bordeaux — accompagnement personnel et structuré en calisthenics, handstand, mobilité et locomotion.',
};

export default function CandidatureMentoratPage({ searchParams }: { searchParams: { erreur?: string; envoye?: string } }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(26px, 7vw, 34px)', letterSpacing: 0.5, margin: '0 0 8px' }}>
        CANDIDATER AU <span style={GRADIENT_TEXTE}>MENTORAT</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        {MENTORAT_PLACES_PAR_SESSION} places par session, pour garantir un vrai suivi individuel. Quelques
        questions sur ton niveau, la ou les branches qui t'intéressent, et tes objectifs.
      </p>

      {searchParams.envoye && (
        <div style={{ background: '#1a3a1f', color: '#b6f0c2', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Candidature envoyée !</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Je reviens vers toi dès que possible pour te dire si une place est disponible.</p>
        </div>
      )}

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}

      {!MENTORAT_OUVERT ? (
        <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 14, padding: 24, background: COULEURS.surface }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Le Mentorat est temporairement fermé aux nouvelles candidatures.</p>
          <p style={{ margin: '8px 0 0', color: COULEURS.texteFaible, fontSize: 13 }}>
            Une refonte du programme est en cours. Reviens prochainement, ou contacte-moi directement si tu
            veux être prévenu·e à la réouverture.
          </p>
        </div>
      ) : !searchParams.envoye ? (
        <CandidatureForm />
      ) : null}
    </main>
  );
}
