'use client';

// Suivi chiffré par objectif : l'élève note sa perf du jour sur un exercice
// (séries × répétitions ou secondes, charge éventuelle) et voit son
// évolution. Les perfs de tous les exercices sont chargées une fois par la
// page et partagées via un contexte (table mentorship_perf).

import { createContext, useContext, useMemo, useState } from 'react';
import { COULEURS } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';

export type Perf = {
  id: string;
  module_id: string;
  series: number;
  valeur: number;
  unite: 'reps' | 'sec';
  charge_kg: number | null;
  cree_le: string;
};

const COLONNES = 'id, module_id, series, valeur, unite, charge_kg, cree_le';

type Ctx = {
  parModule: Map<string, Perf[]>; // plus récentes d'abord
  ajouter: (p: { module_id: string; series: number; valeur: number; unite: 'reps' | 'sec'; charge_kg: number | null }) => Promise<boolean>;
  supprimer: (id: string) => Promise<void>;
};
const PerfsContext = createContext<Ctx | null>(null);

export function PerfsProvider({ initial, children }: { initial: Perf[]; children: React.ReactNode }) {
  const [perfs, setPerfs] = useState<Perf[]>(initial);
  const supabase = supabaseBrowser();

  const parModule = useMemo(() => {
    const m = new Map<string, Perf[]>();
    for (const p of [...perfs].sort((a, b) => b.cree_le.localeCompare(a.cree_le))) {
      const l = m.get(p.module_id);
      if (l) l.push(p); else m.set(p.module_id, [p]);
    }
    return m;
  }, [perfs]);

  async function ajouter(p: { module_id: string; series: number; valeur: number; unite: 'reps' | 'sec'; charge_kg: number | null }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('mentorship_perf').insert({ eleve_id: user.id, ...p }).select(COLONNES).single();
    if (!data) return false;
    setPerfs((prev) => [data as Perf, ...prev]);
    return true;
  }
  async function supprimer(id: string) {
    setPerfs((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('mentorship_perf').delete().eq('id', id);
  }

  return <PerfsContext.Provider value={{ parModule, ajouter, supprimer }}>{children}</PerfsContext.Provider>;
}

export function usePerfs(): Ctx {
  const c = useContext(PerfsContext);
  if (!c) return { parModule: new Map(), ajouter: async () => false, supprimer: async () => {} };
  return c;
}

// L'unité par défaut se déduit de l'objectif de réalisation ("3 tenues de
// 20 secondes" -> secondes ; "3 séries de 8 répétitions" -> répétitions).
export function uniteDepuisCritere(critere?: string): 'reps' | 'sec' {
  const c = (critere ?? '').toLowerCase();
  if (/répétition|rebond|passage|transition|kick|reps/.test(c)) return 'reps';
  if (/seconde|minute|tenue|isométrie|maintien|\d\s?s\b/.test(c)) return 'sec';
  return 'reps';
}

export function formaterPerf(p: Pick<Perf, 'series' | 'valeur' | 'unite' | 'charge_kg'>): string {
  const v = Number(p.valeur);
  return `${p.series} × ${v % 1 === 0 ? v : v.toFixed(1)} ${p.unite === 'sec' ? 's' : 'reps'}${p.charge_kg ? ` · ${Number(p.charge_kg)} kg` : ''}`;
}

export function estAujourdhui(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function SuiviPerf({ moduleId, couleur, critere, compact }: { moduleId: string; couleur: string; critere?: string; compact?: boolean }) {
  const { parModule, ajouter, supprimer } = usePerfs();
  const perfs = parModule.get(moduleId) ?? [];
  const derniere = perfs[0];
  const [series, setSeries] = useState(derniere ? String(derniere.series) : '3');
  const [valeur, setValeur] = useState(derniere ? String(Number(derniere.valeur)) : '');
  const [unite, setUnite] = useState<'reps' | 'sec'>(derniere?.unite ?? uniteDepuisCritere(critere));
  const [charge, setCharge] = useState(derniere?.charge_kg ? String(Number(derniere.charge_kg)) : '');
  const [historique, setHistorique] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const s = parseInt(series, 10);
  const v = parseFloat(valeur.replace(',', '.'));
  const c = charge.trim() ? parseFloat(charge.replace(',', '.')) : null;
  const valide = s >= 1 && s <= 50 && v >= 0 && !Number.isNaN(v) && (c === null || (!Number.isNaN(c) && c >= 0));

  async function noter() {
    if (!valide || envoi) return;
    setEnvoi(true);
    await ajouter({ module_id: moduleId, series: s, valeur: v, unite, charge_kg: c });
    setEnvoi(false);
  }

  // Évolution : volume (séries × valeur) des 10 dernières entrées, la plus ancienne à gauche.
  const recentes = perfs.slice(0, 10).reverse();
  const volumes = recentes.map((p) => p.series * Number(p.valeur));
  const max = Math.max(1, ...volumes);

  const champ: React.CSSProperties = { width: 52, boxSizing: 'border-box', background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '7px 6px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit', textAlign: 'center' };

  return (
    <div style={{ marginTop: compact ? 8 : 12, paddingTop: compact ? 0 : 10, borderTop: compact ? 'none' : `1px dashed ${COULEURS.bordure}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <p style={{ fontSize: 10, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.6, margin: 0, fontWeight: 700 }}>Mon suivi</p>
        {derniere && (
          <p style={{ fontSize: 11, color: COULEURS.texteAtt, margin: 0 }}>
            Dernière fois : <strong style={{ color: couleur }}>{formaterPerf(derniere)}</strong> · {estAujourdhui(derniere.cree_le) ? "aujourd'hui" : new Date(derniere.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>

      {volumes.length >= 2 && (
        <div aria-hidden style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34, marginBottom: 8 }}>
          {volumes.map((vol, i) => (
            <span key={recentes[i].id} title={formaterPerf(recentes[i])} style={{ flex: '0 0 14px', height: `${Math.max(8, (vol / max) * 100)}%`, background: i === volumes.length - 1 ? couleur : `${couleur}66`, borderRadius: 3 }} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <input inputMode="numeric" aria-label="Séries" value={series} onChange={(e) => setSeries(e.target.value)} style={champ} />
        <span style={{ color: COULEURS.texteFaible, fontSize: 13 }}>×</span>
        <input inputMode="decimal" aria-label={unite === 'sec' ? 'Secondes par série' : 'Répétitions par série'} placeholder={unite === 'sec' ? 's' : 'reps'} value={valeur} onChange={(e) => setValeur(e.target.value)} style={champ} />
        <button type="button" onClick={() => setUnite(unite === 'reps' ? 'sec' : 'reps')} title="Changer d'unité" style={{ fontSize: 12, color: couleur, background: 'none', border: `1px solid ${couleur}66`, borderRadius: 8, padding: '7px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {unite === 'sec' ? 'secondes' : 'reps'}
        </button>
        <input inputMode="decimal" aria-label="Charge en kg (facultatif)" placeholder="kg" value={charge} onChange={(e) => setCharge(e.target.value)} style={{ ...champ, width: 48 }} />
        <button type="button" onClick={noter} disabled={!valide || envoi} style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 999, border: `1px solid ${valide ? couleur : COULEURS.bordure}`, background: valide ? `${couleur}1a` : 'transparent', color: valide ? couleur : COULEURS.texteFaible, cursor: valide ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          Noter
        </button>
      </div>

      {perfs.length > 0 && (
        <button type="button" onClick={() => setHistorique((h) => !h)} style={{ marginTop: 8, fontSize: 11, color: COULEURS.texteFaible, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          {historique ? "Masquer l'historique" : `Historique (${perfs.length})`}
        </button>
      )}
      {historique && (
        <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {perfs.slice(0, 30).map((p) => (
            <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: COULEURS.texteAtt }}>
              <span>{new Date(p.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {formaterPerf(p)}</span>
              <button type="button" onClick={() => supprimer(p.id)} aria-label="Supprimer cette entrée" style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
