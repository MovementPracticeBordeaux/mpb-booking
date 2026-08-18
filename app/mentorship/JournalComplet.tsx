'use client';

import { useState, useEffect } from 'react';
import { COULEURS, GRADIENT } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { BRANCHES_MENTORAT } from '@/lib/formules';

type Entree = { id: string; branche: string; contenu: string; cree_le: string };

const OPTIONS_BRANCHE = [{ cle: 'tronc', nom: 'Armure Organique (tronc commun)' }, ...BRANCHES_MENTORAT];
const NOM_BRANCHE = Object.fromEntries(OPTIONS_BRANCHE.map((b) => [b.cle, b.nom]));

export default function JournalComplet() {
  const [entrees, setEntrees] = useState<Entree[] | null>(null);
  const [branche, setBranche] = useState('');
  const [contenu, setContenu] = useState('');
  const supabase = supabaseBrowser();

  useEffect(() => {
    let annule = false;
    supabase
      .from('journal_entrainement')
      .select('id, branche, contenu, cree_le')
      .order('cree_le', { ascending: false })
      .limit(100)
      .then(({ data }) => { if (!annule) setEntrees((data as Entree[]) ?? []); });
    return () => { annule = true; };
  }, []);

  async function ajouter() {
    if (!branche || !contenu.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('journal_entrainement')
      .insert({ eleve_id: user.id, branche, contenu: contenu.trim() })
      .select('id, branche, contenu, cree_le')
      .single();
    if (data) setEntrees((prev) => [data as Entree, ...(prev ?? [])]);
    setContenu('');
  }

  async function supprimer(id: string) {
    setEntrees((prev) => (prev ?? []).filter((e) => e.id !== id));
    await supabase.from('journal_entrainement').delete().eq('id', id);
  }

  const champStyle: React.CSSProperties = { background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit' };

  return (
    <div>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 20px' }}>
        Garde une trace rapide de tes séances, même sans vidéo à soumettre — utile sur les objectifs qui
        prennent du temps.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        <select value={branche} onChange={(e) => setBranche(e.target.value)} style={champStyle}>
          <option value="" disabled>Quelle branche ?</option>
          {OPTIONS_BRANCHE.map((b) => <option key={b.cle} value={b.cle}>{b.nom}</option>)}
        </select>
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={8}
          placeholder="Ex. : 3 tractions strictes aujourd'hui, ressenti correct, encore un peu de tremblement en fin de série."
          style={{ ...champStyle, resize: 'vertical', minHeight: 160, lineHeight: 1.5 }}
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!branche || !contenu.trim()}
          style={{ alignSelf: 'flex-start', background: (!branche || !contenu.trim()) ? COULEURS.surfaceForte : GRADIENT, color: (!branche || !contenu.trim()) ? COULEURS.texteFaible : 'white', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: (!branche || !contenu.trim()) ? 'not-allowed' : 'pointer' }}
        >
          Ajouter au journal
        </button>
      </div>

      {entrees === null ? null : entrees.length === 0 ? (
        <p style={{ color: COULEURS.texteFaible, fontSize: 13 }}>Pas encore d'entrée — note ta première séance ci-dessus.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entrees.map((e) => (
            <div key={e.id} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#f0a', fontWeight: 700 }}>{NOM_BRANCHE[e.branche] ?? e.branche}</span>
                <span style={{ fontSize: 11, color: COULEURS.texteFaible }}>{new Date(e.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <p style={{ fontSize: 14, color: COULEURS.texte, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{e.contenu}</p>
              <button type="button" onClick={() => supprimer(e.id)} style={{ fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
