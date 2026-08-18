'use client';

import { useState, useEffect } from 'react';
import { COULEURS } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Item = { id: string; texte: string; coche: boolean; ordre: number };

// Checklist personnelle de sous-étapes à l'intérieur d'un nœud. Autonome :
// charge et écrit directement dans Supabase (RLS limite chaque élève à ses
// propres lignes), pour ne pas avoir à faire remonter cet état à travers
// tout ArbreCompetences.tsx. Purement informel — ne débloque rien, ne
// remplace pas la validation vidéo de Sylvain.
export default function ChecklistNoeud({ noeudId }: { noeudId: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [nouveauTexte, setNouveauTexte] = useState('');
  const supabase = supabaseBrowser();

  useEffect(() => {
    let annule = false;
    supabase
      .from('checklist_noeud')
      .select('id, texte, coche, ordre')
      .eq('noeud_id', noeudId)
      .order('ordre', { ascending: true })
      .then(({ data }) => {
        if (!annule) setItems((data as Item[]) ?? []);
      });
    return () => { annule = true; };
  }, [noeudId]);

  async function ajouter() {
    const texte = nouveauTexte.trim();
    if (!texte) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ordre = (items?.length ?? 0);
    const { data } = await supabase
      .from('checklist_noeud')
      .insert({ eleve_id: user.id, noeud_id: noeudId, texte, ordre })
      .select('id, texte, coche, ordre')
      .single();
    if (data) setItems((prev) => [...(prev ?? []), data as Item]);
    setNouveauTexte('');
  }

  async function basculer(item: Item) {
    setItems((prev) => (prev ?? []).map((i) => (i.id === item.id ? { ...i, coche: !i.coche } : i)));
    await supabase.from('checklist_noeud').update({ coche: !item.coche }).eq('id', item.id);
  }

  async function supprimer(id: string) {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
    await supabase.from('checklist_noeud').delete().eq('id', id);
  }

  if (items === null) return null; // chargement silencieux, pas de flash

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COULEURS.bordure}` }}>
      <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Mes petits paliers (perso, pas transmis à Sylvain)
      </p>

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', flexGrow: 1, color: item.coche ? COULEURS.texteFaible : COULEURS.texte, textDecoration: item.coche ? 'line-through' : 'none' }}>
                <input type="checkbox" checked={item.coche} onChange={() => basculer(item)} />
                {item.texte}
              </label>
              <button
                type="button"
                onClick={() => supprimer(item.id)}
                aria-label="Supprimer ce palier"
                style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 13, cursor: 'pointer', padding: 2 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={nouveauTexte}
          onChange={(e) => setNouveauTexte(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouter(); } }}
          placeholder="Ex. : 3 répétitions propres"
          style={{ flexGrow: 1, fontSize: 13, padding: '8px 10px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte }}
        />
        <button
          type="button"
          onClick={ajouter}
          style={{ fontSize: 13, padding: '8px 14px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
