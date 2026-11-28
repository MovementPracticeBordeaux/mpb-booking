'use client';

// Bilan d'entrée : quelques questions à la première ouverture du Mentorat
// (modifiable ensuite). Il oriente les priorités proposées et informe Sylvain.

import { useState } from 'react';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';
import { enregistrerBilan } from './actions';
import {
  LIBELLES_EXPERIENCE, LIBELLES_SEANCES, LIBELLES_QUALITES,
  type BilanEntree, type Qualite,
} from '@/lib/mentorship-bilan-entree';

const QUALITES = Object.keys(LIBELLES_QUALITES) as Qualite[];

export default function BilanEntreeForm({ initial, onAnnuler }: { initial?: BilanEntree | null; onAnnuler?: () => void }) {
  const [forts, setForts] = useState<Qualite[]>(initial?.points_forts ?? []);
  const [faibles, setFaibles] = useState<Qualite[]>(initial?.points_faibles ?? []);
  const basculer = (liste: Qualite[], set: (l: Qualite[]) => void, q: Qualite) => set(liste.includes(q) ? liste.filter((x) => x !== q) : [...liste, q]);

  const question: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: COULEURS.texte, margin: '18px 0 8px' };
  const aide: React.CSSProperties = { fontSize: 12, color: COULEURS.texteFaible, margin: '-4px 0 8px' };
  const puce = (actif: boolean): React.CSSProperties => ({ fontSize: 13, padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${actif ? '#ff00aa' : COULEURS.bordure}`, background: actif ? 'rgba(255,0,170,0.12)' : 'transparent', color: actif ? COULEURS.texte : COULEURS.texteAtt });
  const radio = (name: string, valeur: string, libelle: string, defaut?: string) => (
    <label key={valeur} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: COULEURS.texteAtt, padding: '5px 0', cursor: 'pointer' }}>
      <input type="radio" name={name} value={valeur} required defaultChecked={defaut === valeur} style={{ accentColor: '#ff00aa', width: 18, height: 18 }} />
      {libelle}
    </label>
  );

  return (
    <form action={enregistrerBilan} style={{ background: '#0C2040', border: '1px solid #029FD6', borderRadius: 16, padding: '18px 18px 20px' }}>
      <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.3, margin: '0 0 4px', color: COULEURS.texte }}>{initial ? 'Mon bilan' : 'Faisons connaissance'}</p>
      <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.55, margin: 0 }}>
        Quelques questions, une minute. Tes réponses servent à te proposer le travail adapté à ton niveau, et Sylvain les lit pour mieux t'accompagner. Tu pourras les modifier plus tard.
      </p>

      <p style={question}>1. Ton expérience de pratique (mouvement, gym, sport au poids du corps…)</p>
      {Object.entries(LIBELLES_EXPERIENCE).map(([v, l]) => radio('experience', v, l, initial?.experience))}

      <p style={question}>2. Tes points forts</p>
      <p style={aide}>Plusieurs choix possibles, ou aucun.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {QUALITES.map((q) => (
          <button key={q} type="button" aria-pressed={forts.includes(q)} onClick={() => basculer(forts, setForts, q)} style={puce(forts.includes(q))}>{LIBELLES_QUALITES[q]}</button>
        ))}
      </div>
      {forts.map((q) => <input key={q} type="hidden" name="points_forts" value={q} />)}

      <p style={question}>3. Ce que tu veux améliorer en priorité</p>
      <p style={aide}>Plusieurs choix possibles.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {QUALITES.map((q) => (
          <button key={q} type="button" aria-pressed={faibles.includes(q)} onClick={() => basculer(faibles, setFaibles, q)} style={puce(faibles.includes(q))}>{LIBELLES_QUALITES[q]}</button>
        ))}
      </div>
      {faibles.map((q) => <input key={q} type="hidden" name="points_faibles" value={q} />)}

      <p style={question}>4. Ce qui te fait le plus envie</p>
      {QUALITES.map((q) => radio('objectif', q, LIBELLES_QUALITES[q], initial?.objectif ?? undefined))}
      {radio('objectif', 'aucun', "Je ne sais pas encore, je veux tout découvrir", initial && !initial.objectif ? 'aucun' : undefined)}

      <p style={question}>5. Le temps que tu peux y consacrer</p>
      {Object.entries(LIBELLES_SEANCES).map(([v, l]) => radio('seances_semaine', v, l, initial?.seances_semaine))}

      <p style={question}>6. Douleurs ou anciennes blessures à connaître (facultatif)</p>
      <p style={aide}>Par exemple une épaule, un genou, le dos. Visible seulement par toi et par Sylvain.</p>
      <textarea name="blessures" defaultValue={initial?.blessures ?? ''} rows={3} maxLength={1000} placeholder="Rien à signaler, ou décris en quelques mots…"
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte, fontFamily: 'inherit', resize: 'vertical' }} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' }}>
        <button type="submit" style={{ background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '11px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          {initial ? 'Enregistrer' : "C'est parti"}
        </button>
        {onAnnuler && <button type="button" onClick={onAnnuler} style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 13, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>}
      </div>
    </form>
  );
}
