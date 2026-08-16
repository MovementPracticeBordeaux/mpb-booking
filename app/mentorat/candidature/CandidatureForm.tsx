'use client';

import { useState } from 'react';
import { COULEURS, GRADIENT } from '@/lib/theme';
import { BRANCHES_MENTORAT, DUOS_RECOMMANDES } from '@/lib/formules';
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

function nomBranche(cle: string) {
  return BRANCHES_MENTORAT.find((b) => b.cle === cle)?.nom ?? cle;
}

export default function CandidatureForm() {
  const [nombreBranches, setNombreBranches] = useState<1 | 2>(1);
  const [duoChoisi, setDuoChoisi] = useState<string>(''); // "cle1,cle2" ou 'autre'
  const [brancheUnique, setBrancheUnique] = useState('');
  const [brancheLibre1, setBrancheLibre1] = useState('');
  const [brancheLibre2, setBrancheLibre2] = useState('');

  const utiliseDuoRecommande = duoChoisi !== '' && duoChoisi !== 'autre';
  const [branche1Duo, branche2Duo] = utiliseDuoRecommande ? duoChoisi.split(',') : ['', ''];

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
        <span style={labelStyle}>Combien de branches ?</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setNombreBranches(n);
                setDuoChoisi('');
                setBrancheUnique('');
                setBrancheLibre1('');
                setBrancheLibre2('');
              }}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                border: nombreBranches === n ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
                background: nombreBranches === n ? 'rgba(255,45,120,0.12)' : COULEURS.surfaceForte,
                color: COULEURS.texte,
              }}
            >
              {n} branche{n > 1 ? 's' : ''}
            </button>
          ))}
        </div>
        <input type="hidden" name="nombre_branches" value={nombreBranches} />
      </div>

      {nombreBranches === 1 ? (
        <div>
          <label htmlFor="branche_1" style={labelStyle}>Quelle branche ?</label>
          <select
            id="branche_1"
            name="branche_1"
            required
            style={champStyle}
            value={brancheUnique}
            onChange={(e) => setBrancheUnique(e.target.value)}
          >
            <option value="" disabled>Choisis une branche</option>
            {BRANCHES_MENTORAT.map((b) => (
              <option key={b.cle} value={b.cle}>{b.nom}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <span style={labelStyle}>Quelle association de branches ?</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {DUOS_RECOMMANDES.map(([a, b]) => {
              const valeur = `${a},${b}`;
              return (
                <label
                  key={valeur}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer',
                    padding: '8px 10px', borderRadius: 8,
                    border: duoChoisi === valeur ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
                    background: duoChoisi === valeur ? 'rgba(255,45,120,0.12)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="duo_radio"
                    checked={duoChoisi === valeur}
                    onChange={() => setDuoChoisi(valeur)}
                  />
                  {nomBranche(a)} + {nomBranche(b)} <span style={{ color: COULEURS.texteFaible }}>(recommandé)</span>
                </label>
              );
            })}
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer',
                padding: '8px 10px', borderRadius: 8,
                border: duoChoisi === 'autre' ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
                background: duoChoisi === 'autre' ? 'rgba(255,45,120,0.12)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="duo_radio"
                checked={duoChoisi === 'autre'}
                onChange={() => setDuoChoisi('autre')}
              />
              Autre combinaison de mon choix
            </label>
          </div>

          {duoChoisi === 'autre' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                name="branche_1"
                required
                style={champStyle}
                value={brancheLibre1}
                onChange={(e) => setBrancheLibre1(e.target.value)}
              >
                <option value="" disabled>1ère branche</option>
                {BRANCHES_MENTORAT.map((b) => (
                  <option key={b.cle} value={b.cle} disabled={b.cle === brancheLibre2}>{b.nom}</option>
                ))}
              </select>
              <select
                name="branche_2"
                required
                style={champStyle}
                value={brancheLibre2}
                onChange={(e) => setBrancheLibre2(e.target.value)}
              >
                <option value="" disabled>2e branche</option>
                {BRANCHES_MENTORAT.map((b) => (
                  <option key={b.cle} value={b.cle} disabled={b.cle === brancheLibre1}>{b.nom}</option>
                ))}
              </select>
            </div>
          )}

          {utiliseDuoRecommande && (
            <>
              <input type="hidden" name="branche_1" value={branche1Duo} />
              <input type="hidden" name="branche_2" value={branche2Duo} />
            </>
          )}
        </div>
      )}

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
