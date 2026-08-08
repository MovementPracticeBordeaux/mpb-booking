'use client';

import { useState } from 'react';
import { FORMULES } from '@/lib/formules';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

type Erreur = { message: string; connexionRequise: boolean };

async function acheter(
  priceId: string,
  formuleNom: string,
  dateDebut: string,
  setErreur: (e: Erreur | null) => void
) {
  setErreur(null);
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_id: priceId, formule_nom: formuleNom, date_debut: dateDebut }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else if (res.status === 401) {
      setErreur({ message: "Connecte-toi pour pouvoir acheter cette formule.", connexionRequise: true });
    } else {
      setErreur({ message: data.error ?? 'Une erreur est survenue, réessaie.', connexionRequise: false });
    }
  } catch (e: any) {
    setErreur({ message: 'Erreur réseau, vérifie ta connexion et réessaie.', connexionRequise: false });
  }
}

// ⚠️ Remplace ces price_id par les tiens, créés dans le Dashboard Stripe (Produits > Prix).
// Tous en "Achat ponctuel" (aucun n'est récurrent).
const PRICE_IDS: Record<string, string> = {
  cours_decouverte: 'price_1U0elPA7uUFwYAcPMLZhjc6x',
  mensuel_4: 'price_1U0fdzA7uUFwYAcPnpkuSxMV',
  mensuel_8: 'price_1U0fegA7uUFwYAcPHADTfVBr',
  illimite: 'price_1U0ffOA7uUFwYAcP4TyQfjQO',
  carnet_5: 'price_1U0fo1A7uUFwYAcP2F2YkcDL',
  carnet_10: 'price_1U0fp7A7uUFwYAcPt5947mOo',
  coaching_unite: 'price_1U0fhDA7uUFwYAcPgbsvDXyA',
  coaching_carnet_3h: 'price_1U0fjMA7uUFwYAcPJ1bm09Wq',
  coaching_carnet_4h: 'price_1U0fkNA7uUFwYAcPPB0ftT8Q',
  coaching_online: 'price_1U0frAA7uUFwYAcPc2PhR6B3',
  mentorship: 'price_1U0fs2A7uUFwYAcPtoCTfOc3',
  post_mentorship: 'price_1U0ftFA7uUFwYAcPwzVQnERa',
};

const GROUPES = [
  { titre: 'Cours collectifs', cles: ['cours_decouverte', 'mensuel_4', 'mensuel_8', 'illimite', 'carnet_5', 'carnet_10'] },
  { titre: 'Coaching individuel', cles: ['coaching_unite', 'coaching_carnet_3h', 'coaching_carnet_4h', 'coaching_online'] },
  { titre: 'Mentorship', cles: ['mentorship', 'post_mentorship'] },
];

// Formules mises en avant (badge). Clé -> libellé du badge.
const MIS_EN_AVANT: Record<string, string> = {
  illimite: 'Le + populaire',
  coaching_online: 'Le + demandé',
  mentorship: 'Programme phare',
};

function ligneQuota(f: (typeof FORMULES)[string]): string {
  return f.quota ? `${f.quota} ${f.unite}${f.quota > 1 ? 's' : ''}` : 'Accès illimité';
}

function CarteFormule({ cle, onAcheter }: { cle: string; onAcheter: () => void }) {
  const f = FORMULES[cle];
  const badge = MIS_EN_AVANT[cle];

  return (
    <div
      id={cle}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        border: badge ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
        boxShadow: badge ? '0 0 0 1px rgba(255,45,120,0.35)' : undefined,
        background: badge ? COULEURS.surfaceForte : COULEURS.surface,
        borderRadius: 14,
        padding: 20,
        scrollMarginTop: 20,
      }}
    >
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: -11,
            left: 16,
            background: GRADIENT,
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: 999,
          }}
        >
          {badge}
        </span>
      )}

      <h3 style={{ fontFamily: POLICE_DISPLAY, letterSpacing: 0.3, fontSize: 21, margin: '0 0 10px' }}>{f.nom}</h3>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
        <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 38, lineHeight: 1, ...GRADIENT_TEXTE }}>{f.prixIndicatif} €</span>
        {cle === 'illimite' && <span style={{ fontSize: 13, color: COULEURS.texteFaible }}>/mois</span>}
      </div>

      <div style={{ height: 1, background: COULEURS.bordure, margin: '14px 0' }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: 13, color: COULEURS.texteAtt, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <li>✓ {ligneQuota(f)}</li>
        <li>✓ Valable {f.validiteMois} mois</li>
        {f.categorie === 'coaching' && <li>✓ Mise en relation après achat</li>}
      </ul>

      <button
        onClick={onAcheter}
        style={{
          marginTop: 'auto',
          background: badge ? GRADIENT : 'transparent',
          color: 'white',
          border: badge ? 'none' : `1px solid ${COULEURS.bordure}`,
          borderRadius: 999,
          padding: '11px 20px',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Acheter
      </button>
    </div>
  );
}

export default function TarifsPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const [erreur, setErreur] = useState<Erreur | null>(null);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [dateDebut, setDateDebut] = useState(aujourdhui);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 8vw, 36px)', letterSpacing: 0.5, margin: '0 0 8px' }}>
        TARIFS &amp; <span style={GRADIENT_TEXTE}>FORMULES</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 16px' }}>
        Paiement sécurisé par Stripe. Sans engagement, sans abonnement caché.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '5px 6px 5px 14px', marginBottom: 24, width: 'fit-content' }}>
        <label htmlFor="date-debut" style={{ fontSize: 12, color: COULEURS.texteFaible }}>Faire démarrer ma formule le :</label>
        <input
          id="date-debut"
          type="date"
          min={aujourdhui}
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          style={{ background: COULEURS.surfaceForte, border: 'none', borderRadius: 999, padding: '5px 10px', color: COULEURS.texte, fontSize: 13, fontFamily: 'inherit', colorScheme: 'dark' }}
        />
      </div>

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}
      {erreur && (
        <div style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ margin: 0 }}>⚠️ {erreur.message}</p>
          {erreur.connexionRequise && (
            <a href="/login" style={{ display: 'inline-block', marginTop: 8, color: '#FF2D78', fontWeight: 600 }}>
              Se connecter →
            </a>
          )}
        </div>
      )}
      {GROUPES.map((groupe) => (
        <section key={groupe.titre} style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 1, margin: '0 0 16px', ...GRADIENT_TEXTE }}>
            {groupe.titre.toUpperCase()}
          </h2>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {groupe.cles.map((cle) => (
              <CarteFormule key={cle} cle={cle} onAcheter={() => acheter(PRICE_IDS[cle], cle, dateDebut, setErreur)} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
