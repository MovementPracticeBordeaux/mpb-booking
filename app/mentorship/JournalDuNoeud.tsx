'use client';

import { useState, useEffect } from 'react';
import { COULEURS, GRADIENT } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Entree = { id: string; contenu: string; cree_le: string };

export default function JournalDuNoeud({ noeudId, branche }: { noeudId: string; branche: string }) {
  const [entrees, setEntrees] = useState<Entree[] | null>(null);
  const [texte, setTexte] = useState('');
  const supabase = supabaseBrowser();

  useEffect(() => {
    let annule = false;
    supabase
      .from('journal_entrainement')
      .select('id, contenu, cree_le')
      .eq('noeud_id', noeudId)
      .order('cree_le', { ascending: false })
      .then(({ data }) => { if (!annule) setEntrees((data as Entree[]) ?? []); });
    return () => { annule = true; };
  }, [noeudId]);

  async function ajouter() {
    const contenu = texte.trim();
    if (!contenu) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('journal_entrainement')
      .insert({ eleve_id: user.id, branche, noeud_id: noeudId, contenu })
      .select('id, contenu, cree_le')
      .single();
    if (data) setEntrees((prev) => [data as Entree, ...(prev ?? [])]);
    setTexte('');
  }

  if (entrees === null) return null;

  return (
    <div>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        placeholder="Ex. : 3 tractions strictes aujourd'hui, ressenti correct."
        style={{ width: '100%', boxSizing: 'border-box', background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', marginBottom: 8 }}
      />
      <button
        type="button"
        onClick={ajouter}
        disabled={!texte.trim()}
        style={{ fontSize: 12, padding: '7px 16px', borderRadius: 999, border: 'none', background: texte.trim() ? GRADIENT : COULEURS.surfaceForte, color: texte.trim() ? 'white' : COULEURS.texteFaible, fontWeight: 600, cursor: texte.trim() ? 'pointer' : 'not-allowed' }}
      >
        Ajouter au journal
      </button>

      {entrees.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {entrees.map((e) => (
            <div key={e.id} style={{ borderTop: `1px solid ${COULEURS.bordure}`, paddingTop: 8 }}>
              <p style={{ fontSize: 11, color: COULEURS.texteFaible, margin: '0 0 2px' }}>
                {new Date(e.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </p>
              <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: 0, whiteSpace: 'pre-wrap' }}>{e.contenu}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
