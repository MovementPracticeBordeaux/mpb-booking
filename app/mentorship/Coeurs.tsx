'use client';

// « Coups de cœur » : l'élève marque d'un cœur les exercices qu'il aime
// pratiquer pour le plaisir, sans objectif de validation. Partagés à toute la
// page du Mentorat (table mentorship_coeur, une ligne par exercice aimé).

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { COULEURS } from '@/lib/theme';

type Ctx = { coeurs: Set<string>; basculer: (moduleId: string) => Promise<void> };
const CoeursContext = createContext<Ctx>({ coeurs: new Set(), basculer: async () => {} });

export function CoeursProvider({ initiaux, children }: { initiaux: string[]; children: ReactNode }) {
  const [coeurs, setCoeurs] = useState(() => new Set(initiaux));
  const supabase = supabaseBrowser();

  async function basculer(moduleId: string) {
    const aime = coeurs.has(moduleId);
    // Affichage immédiat, annulé si l'écriture échoue.
    setCoeurs((c) => { const n = new Set(c); if (aime) n.delete(moduleId); else n.add(moduleId); return n; });
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = !user
      ? { error: new Error('non connecté') }
      : aime
        ? await supabase.from('mentorship_coeur').delete().eq('eleve_id', user.id).eq('module_id', moduleId)
        : await supabase.from('mentorship_coeur').insert({ eleve_id: user.id, module_id: moduleId });
    if (error) setCoeurs((c) => { const n = new Set(c); if (aime) n.add(moduleId); else n.delete(moduleId); return n; });
  }

  return <CoeursContext.Provider value={{ coeurs, basculer }}>{children}</CoeursContext.Provider>;
}

export function useCoeurs() {
  return useContext(CoeursContext);
}

export function BoutonCoeur({ moduleId, taille = 18 }: { moduleId: string; taille?: number }) {
  const { coeurs, basculer } = useCoeurs();
  const aime = coeurs.has(moduleId);
  // Un <span role="button"> plutôt qu'un <button> : le cœur se place aussi
  // dans des en-têtes déjà cliquables (un bouton ne peut pas en contenir un autre).
  const agir = (e: React.SyntheticEvent) => { e.stopPropagation(); e.preventDefault(); void basculer(moduleId); };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={agir}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') agir(e); }}
      aria-pressed={aime}
      aria-label={aime ? 'Retirer de mes coups de cœur' : "J'aime cet exercice : l'ajouter à mes coups de cœur"}
      title={aime ? 'Coup de cœur : à pratiquer pour le plaisir' : "J'aime cet exercice"}
      style={{ flexShrink: 0, padding: 6, margin: -6, cursor: 'pointer', display: 'inline-flex', lineHeight: 0 }}
    >
      <Heart size={taille} color={aime ? '#FF2D78' : COULEURS.texteFaible} fill={aime ? '#FF2D78' : 'none'} />
    </span>
  );
}
