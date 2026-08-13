import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { MENTORAT_OUVERT, MENTORAT_PLACES_PAR_SESSION } from '@/lib/formules';
import { envoyerCandidature } from './actions';

export const metadata = {
  title: 'Candidature Mentorat | Movement Practice Bordeaux',
  description: 'Candidater pour rejoindre le Mentorat de Movement Practice Bordeaux — accompagnement personnel et structuré en calisthenics, handstand, mobilité et locomotion.',
};

const champStyle: React.CSSProperties = {
  width: '100%',
  background: COULEURS.surfaceForte,
  border: `1px solid ${COULEURS.bordure}`,
  borderRadius: 8,
  padding: '10px 12px',
  color: COULEURS.texte,
  fontSize: 14,
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: COULEURS.texteAtt,
  marginBottom: 6,
};

export default function CandidatureMentoratPage({ searchParams }: { searchParams: { erreur?: string; envoye?: string } }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(26px, 7vw, 34px)', letterSpacing: 0.5, margin: '0 0 8px' }}>
        CANDIDATER AU <span style={GRADIENT_TEXTE}>MENTORAT</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        {MENTORAT_PLACES_PAR_SESSION} places par session, pour garantir un vrai suivi individuel. Quelques
        questions sur ton niveau et tes objectifs, pour s'assurer que le Mentorat correspond à ta démarche.
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
        <form action={envoyerCandidature} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="nom" style={labelStyle}>Nom</label>
            <input id="nom" name="nom" type="text" required style={champStyle} />
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input id="email" name="email" type="email" required style={champStyle} />
          </div>

          <div>
            <label htmlFor="telephone" style={labelStyle}>Téléphone (optionnel)</label>
            <input id="telephone" name="telephone" type="tel" style={champStyle} />
          </div>

          <div>
            <label htmlFor="niveau" style={labelStyle}>Ton niveau actuel</label>
            <select id="niveau" name="niveau" required style={champStyle} defaultValue="">
              <option value="" disabled>Choisis une option</option>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </select>
          </div>

          <div>
            <label htmlFor="formule_souhaitee" style={labelStyle}>Durée souhaitée</label>
            <select id="formule_souhaitee" name="formule_souhaitee" style={champStyle} defaultValue="">
              <option value="">Pas encore décidé</option>
              <option value="mentorship_3">3 mois</option>
              <option value="mentorship_6">6 mois</option>
              <option value="mentorship_12">12 mois</option>
            </select>
          </div>

          <div>
            <label htmlFor="objectifs" style={labelStyle}>Tes objectifs</label>
            <textarea id="objectifs" name="objectifs" required rows={5} style={{ ...champStyle, resize: 'vertical' }} placeholder="Où en es-tu dans ta pratique, et qu'est-ce que tu cherches à travailler ?" />
          </div>

          <button
            type="submit"
            style={{
              marginTop: 8,
              background: GRADIENT,
              color: 'white',
              border: 'none',
              borderRadius: 999,
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Envoyer ma candidature
          </button>
        </form>
      ) : null}
    </main>
  );
}
