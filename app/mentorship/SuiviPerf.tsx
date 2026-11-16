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

// Le format du suivi dépend de l'exercice, pour rester cohérent avec ce qui
// est demandé :
//  - 'reps'  : séries × répétitions (Force, Flexibilité) — charge facultative,
//              masquée par défaut puisque le travail se fait surtout au poids du corps ;
//  - 'tenue' : séries × secondes (isométries, figures tenues, étirements tenus) ;
//  - 'temps' : sets × minutes de travail (Locomotion, Connexion : on y compte
//              un temps de pratique, pas des répétitions).
export type ModeSuivi = 'reps' | 'tenue' | 'temps';

export function modeSuivi(moduleId: string, critere?: string): ModeSuivi {
  const domaine = moduleId.split('-')[0];
  if (domaine === 'locomotion' || domaine === 'connexion') return 'temps';
  const c = (critere ?? '').toLowerCase();
  if (/isométrie|temps de suspension|maintien/.test(c)) return 'tenue';
  if (/minutes cumulées|routine|séquence/.test(c)) return 'temps';
  if (/répétition|passage|transition|kick|reps/.test(c)) return 'reps';
  if (/seconde|minute|tenue|\d\s?s\b/.test(c)) return 'tenue';
  // Sans objectif chiffré : une figure se tient, le reste se compte.
  return domaine === 'figures' ? 'tenue' : 'reps';
}

const LIBELLES_MODE: Record<ModeSuivi, { series: string; valeur: string; nom: string }> = {
  reps: { series: 'Séries', valeur: 'Reps', nom: 'séries × répétitions' },
  tenue: { series: 'Séries', valeur: 'Secondes', nom: 'séries × secondes' },
  temps: { series: 'Sets', valeur: 'Minutes', nom: 'sets × minutes' },
};

function nombre(v: number): string {
  return v % 1 === 0 ? String(v) : v.toFixed(1).replace('.', ',');
}

// Les durées sont stockées en secondes ; à partir d'une minute, on affiche en minutes.
export function formaterPerf(p: Pick<Perf, 'series' | 'valeur' | 'unite' | 'charge_kg'>): string {
  const v = Number(p.valeur);
  const corps = p.unite === 'reps' ? `${nombre(v)} reps`
    : v >= 60 ? (v % 60 === 0 ? `${v / 60} min` : `${Math.floor(v / 60)} min ${Math.round(v % 60)} s`)
    : `${nombre(v)} s`;
  return `${p.series} × ${corps}${p.charge_kg ? ` · ${nombre(Number(p.charge_kg))} kg` : ''}`;
}

export function estAujourdhui(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function SuiviPerf({ moduleId, couleur, critere, compact }: { moduleId: string; couleur: string; critere?: string; compact?: boolean }) {
  const { parModule, ajouter, supprimer } = usePerfs();
  const perfs = parModule.get(moduleId) ?? [];
  const derniere = perfs[0];
  const modeExercice = modeSuivi(moduleId, critere);
  // Si l'élève a noté sa dernière perf dans un autre format, on le reprend.
  const modeInitial: ModeSuivi = !derniere ? modeExercice
    : derniere.unite === 'reps' ? 'reps'
    : modeExercice !== 'reps' ? modeExercice
    : Number(derniere.valeur) >= 60 ? 'temps' : 'tenue';
  const [mode, setMode] = useState<ModeSuivi>(modeInitial);
  const [series, setSeries] = useState(derniere ? String(derniere.series) : modeExercice === 'temps' ? '1' : '3');
  const [valeur, setValeur] = useState(derniere ? nombre(modeInitial === 'temps' ? Number(derniere.valeur) / 60 : Number(derniere.valeur)) : '');
  const [charge, setCharge] = useState(derniere?.charge_kg ? nombre(Number(derniere.charge_kg)) : '');
  const [avecCharge, setAvecCharge] = useState(!!derniere?.charge_kg);
  const [historique, setHistorique] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const lib = LIBELLES_MODE[mode];

  const s = parseInt(series, 10);
  const v = parseFloat(valeur.replace(',', '.'));
  const c = mode === 'reps' && avecCharge && charge.trim() ? parseFloat(charge.replace(',', '.')) : null;
  const valide = s >= 1 && s <= 50 && v > 0 && !Number.isNaN(v) && (c === null || (!Number.isNaN(c) && c >= 0));

  async function noter() {
    if (!valide || envoi) return;
    setEnvoi(true);
    await ajouter({
      module_id: moduleId,
      series: s,
      valeur: mode === 'temps' ? Math.round(v * 60) : v,
      unite: mode === 'reps' ? 'reps' : 'sec',
      charge_kg: c,
    });
    setEnvoi(false);
  }

  function changerMode() {
    const ordre: ModeSuivi[] = ['reps', 'tenue', 'temps'];
    setMode(ordre[(ordre.indexOf(mode) + 1) % ordre.length]);
    setValeur('');
  }

  // Évolution : volume (séries × valeur) des 10 dernières entrées, la plus ancienne à gauche.
  const recentes = perfs.slice(0, 10).reverse();
  const volumes = recentes.map((p) => p.series * Number(p.valeur));
  const max = Math.max(1, ...volumes);

  const etiquette: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 };
  const lien: React.CSSProperties = { fontSize: 11, color: COULEURS.texteFaible, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 };
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

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <label style={etiquette}>
          {lib.series}
          <input inputMode="numeric" value={series} onChange={(e) => setSeries(e.target.value)} style={champ} />
        </label>
        <span style={{ color: COULEURS.texteFaible, fontSize: 13, paddingBottom: 9 }}>×</span>
        <label style={etiquette}>
          {lib.valeur}
          <input inputMode="decimal" value={valeur} onChange={(e) => setValeur(e.target.value)} style={{ ...champ, width: 64 }} />
        </label>
        {mode === 'reps' && avecCharge && (
          <label style={etiquette}>
            Charge (kg)
            <input inputMode="decimal" value={charge} onChange={(e) => setCharge(e.target.value)} style={{ ...champ, width: 64 }} />
          </label>
        )}
        <button type="button" onClick={noter} disabled={!valide || envoi} style={{ fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 999, border: `1px solid ${valide ? couleur : COULEURS.bordure}`, background: valide ? `${couleur}1a` : 'transparent', color: valide ? couleur : COULEURS.texteFaible, cursor: valide ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          Noter
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 8 }}>
        {mode === 'reps' && (
          <button type="button" onClick={() => setAvecCharge((a) => !a)} style={lien}>
            {avecCharge ? 'Sans charge (poids du corps)' : '+ Charge additionnelle'}
          </button>
        )}
        <button type="button" onClick={changerMode} style={lien}>Autre format ({lib.nom})</button>
        {perfs.length > 0 && (
          <button type="button" onClick={() => setHistorique((h) => !h)} style={lien}>
            {historique ? "Masquer l'historique" : `Historique (${perfs.length})`}
          </button>
        )}
      </div>

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
