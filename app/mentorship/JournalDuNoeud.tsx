'use client';

import { useState, useEffect } from 'react';
import { COULEURS, GRADIENT } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { EditeurNote, RenduNote, contenuAEnregistrer, encoderNote, decoderNote, type FormatNote } from './NoteJournal';

type Entree = { id: string; contenu: string; cree_le: string; format: FormatNote };

function versEntree(l: { id: string; contenu: string; cree_le: string }): Entree {
  const d = decoderNote(l.contenu);
  return { id: l.id, cree_le: l.cree_le, contenu: d.contenu, format: d.format };
}

export default function JournalDuNoeud({ noeudId, branche }: { noeudId: string; branche: string }) {
  const [entrees, setEntrees] = useState<Entree[] | null>(null);
  const [texte, setTexte] = useState('');
  const [format, setFormat] = useState<FormatNote>('texte');
  const [points, setPoints] = useState<string[]>(['']);
  const supabase = supabaseBrowser();

  useEffect(() => {
    let annule = false;
    supabase
      .from('journal_entrainement')
      .select('id, contenu, cree_le')
      .eq('noeud_id', noeudId)
      .order('cree_le', { ascending: false })
      .then(({ data }) => { if (!annule) setEntrees(((data as { id: string; contenu: string; cree_le: string }[]) ?? []).map(versEntree)); });
    return () => { annule = true; };
  }, [noeudId]);

  async function ajouter() {
    const contenu = contenuAEnregistrer(format, texte, points);
    if (!contenu) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('journal_entrainement')
      .insert({ eleve_id: user.id, branche, noeud_id: noeudId, contenu: encoderNote(contenu, format, null) })
      .select('id, contenu, cree_le')
      .single();
    if (data) setEntrees((prev) => [versEntree(data as { id: string; contenu: string; cree_le: string }), ...(prev ?? [])]);
    setTexte('');
    setPoints(['']);
  }

  if (entrees === null) return null;

  return (
    <div>
      <EditeurNote format={format} setFormat={setFormat} texte={texte} setTexte={setTexte} points={points} setPoints={setPoints} lignesTexte={3} placeholder="Ex. : 3 tractions strictes aujourd'hui, ressenti correct." />
      <div style={{ height: 8 }} />
      <button
        type="button"
        onClick={ajouter}
        disabled={!contenuAEnregistrer(format, texte, points)}
        style={{ fontSize: 12, padding: '7px 16px', borderRadius: 999, border: 'none', background: contenuAEnregistrer(format, texte, points) ? GRADIENT : COULEURS.surfaceForte, color: contenuAEnregistrer(format, texte, points) ? 'white' : COULEURS.texteFaible, fontWeight: 600, cursor: contenuAEnregistrer(format, texte, points) ? 'pointer' : 'not-allowed' }}
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
              <RenduNote contenu={e.contenu} format={e.format} taille={13} couleur={COULEURS.texteAtt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
