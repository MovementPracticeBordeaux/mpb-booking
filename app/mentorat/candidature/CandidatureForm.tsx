'use client';

import { useState } from 'react';
import { COULEURS, GRADIENT } from '@/lib/theme';
import { PALIERS_MENTORAT } from '@/lib/formules';
import { envoyerCandidature } from './actions';

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

export default function CandidatureForm() {
  const [palier, setPalier] = useState('');

  return (
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
        <label htmlFor="duree" style={labelStyle}>Durée souhaitée</label>
        <select id="duree" name="duree" required style={champStyle} defaultValue="">
          <option value="" disabled>Choisis une option</option>
          <option value="3">3 mois</option>
          <option value="6">6 mois</option>
          <option value="12">12 mois</option>
        </select>
      </div>

      <div>
        <span style={labelStyle}>Jusqu'où veux-tu aller ?</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PALIERS_MENTORAT.map((p) => (
            <label
              key={p.cle}
              style={{
                display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13, cursor: 'pointer',
                padding: '10px 12px', borderRadius: 8,
                border: palier === p.cle ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
                background: palier === p.cle ? 'rgba(255,45,120,0.12)' : 'transparent',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="palier" value={p.cle} required checked={palier === p.cle} onChange={() => setPalier(p.cle)} />
                <strong>{p.nom}</strong>
              </span>
              <span style={{ color: COULEURS.texteFaible, fontSize: 12, marginLeft: 22 }}>{p.description}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="objectifs" style={labelStyle}>Tes objectifs</label>
        <textarea
          id="objectifs"
          name="objectifs"
          required
          rows={5}
          style={{ ...champStyle, resize: 'vertical' }}
          placeholder="Où en es-tu dans ta pratique, et qu'est-ce que tu cherches à travailler ?"
        />
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
  );
}
