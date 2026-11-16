'use client';

// Chrono intégré à l'exercice : réglé d'après l'objectif chiffré (durée de la
// tenue, récupération), il compte les séries faites et rend le résultat au
// suivi, pour que l'élève n'ait ni à quitter sa séance ni à ressaisir.
//  - 'reps'  : bouton « Série faite », puis décompte de la récupération ;
//  - 'tenue' : 5 s de mise en place, décompte de la tenue, puis récupération ;
//  - 'temps' : chrono qui monte pendant le set, puis récupération éventuelle.

import { useEffect, useRef, useState } from 'react';
import { Play, Square, SkipForward, Check, Minus, Plus, X } from 'lucide-react';
import { COULEURS } from '@/lib/theme';
import { formaterChrono, type ObjectifChiffre } from '@/lib/mentorship-chrono';
import type { ModeSuivi } from './SuiviPerf';

type Phase = 'pret' | 'prepa' | 'effort' | 'recup';
const PREPA_SEC = 5;

export type ResultatChrono = { series: number; moyenneSec: number | null };

export default function Chrono({ mode, objectif, couleur, onTerminer, onFermer }: {
  mode: ModeSuivi;
  objectif: ObjectifChiffre;
  couleur: string;
  onTerminer: (r: ResultatChrono) => void;
  onFermer: () => void;
}) {
  // Sans récupération écrite dans l'objectif : 3 min par défaut pour le travail
  // en séries, aucune quand elle est « à la demande ». Réglable dans tous les cas.
  const recupInitiale = objectif.recupSec ?? (objectif.recupLibre || mode === 'temps' ? 0 : 180);
  const [cibleSec, setCibleSec] = useState(objectif.effortSec ?? 30);
  const [recupSec, setRecupSec] = useState(recupInitiale);
  const [phase, setPhase] = useState<Phase>('pret');
  const [efforts, setEfforts] = useState<number[]>([]); // durée réelle de chaque série (0 en mode reps)
  const [affiche, setAffiche] = useState(0); // secondes restantes (décompte) ou écoulées (mode temps)

  const repere = useRef(0); // horodatage de fin (décompte) ou de début (chrono qui monte)
  const audio = useRef<AudioContext | null>(null);
  const veille = useRef<{ release: () => Promise<void> } | null>(null);

  function bip(aigu = false) {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      audio.current ??= new Ctx();
      const ctx = audio.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = aigu ? 1320 : 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* pas de son disponible : le chrono reste utilisable */ }
    try { navigator.vibrate?.(aigu ? [200, 100, 200] : 200); } catch { /* idem */ }
  }

  // Garde l'écran allumé pendant que le chrono tourne, quand le navigateur le permet.
  useEffect(() => {
    if (phase === 'pret') { veille.current?.release().catch(() => {}); veille.current = null; return; }
    if (veille.current) return;
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    wl?.request('screen').then((v) => { veille.current = v; }).catch(() => {});
  }, [phase]);
  useEffect(() => () => { veille.current?.release().catch(() => {}); audio.current?.close().catch(() => {}); }, []);

  function lancerDecompte(p: Phase, duree: number) {
    repere.current = Date.now() + duree * 1000;
    setAffiche(duree);
    setPhase(p);
  }

  function finEffort(dureeReelle: number) {
    setEfforts((e) => [...e, dureeReelle]);
    if (recupSec > 0) lancerDecompte('recup', recupSec);
    else setPhase('pret');
  }

  // Le temps est recalculé à partir de l'horloge à chaque tic : un onglet mis
  // en arrière-plan ou un écran verrouillé ne décale pas le chrono.
  useEffect(() => {
    if (phase === 'pret') return;
    const monte = phase === 'effort' && mode === 'temps';
    const id = setInterval(() => {
      if (monte) { setAffiche((Date.now() - repere.current) / 1000); return; }
      const reste = (repere.current - Date.now()) / 1000;
      if (reste > 0) { setAffiche(reste); return; }
      if (phase === 'prepa') {
        bip(true);
        if (mode === 'temps') { repere.current = Date.now(); setAffiche(0); setPhase('effort'); }
        else lancerDecompte('effort', cibleSec);
      } else if (phase === 'effort') {
        bip();
        finEffort(cibleSec);
      } else {
        bip(true);
        setPhase('pret');
      }
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, cibleSec, recupSec]);

  function demarrer() {
    bip(true); // débloque aussi le son sur mobile (il faut un geste de l'utilisateur)
    if (mode === 'reps') { finEffort(0); return; }
    lancerDecompte('prepa', PREPA_SEC);
  }

  function arreterEffort() {
    if (phase === 'prepa') { setPhase('pret'); return; }
    const ecoule = mode === 'temps' ? (Date.now() - repere.current) / 1000 : cibleSec - (repere.current - Date.now()) / 1000;
    if (ecoule >= 1) finEffort(Math.round(ecoule)); else setPhase('pret');
  }

  function terminer() {
    const n = efforts.length;
    if (n === 0) { onFermer(); return; }
    const total = efforts.reduce((a, b) => a + b, 0);
    onTerminer({ series: n, moyenneSec: mode === 'reps' ? null : Math.max(1, Math.round(total / n)) });
  }

  const faites = efforts.length;
  const numero = faites + (phase === 'effort' || phase === 'prepa' ? 1 : 0);
  const nom = mode === 'temps' ? 'Set' : mode === 'tenue' ? 'Tenue' : 'Série';
  const titrePhase = phase === 'prepa' ? 'Mets-toi en place' : phase === 'effort' ? (mode === 'temps' ? 'Au travail' : 'Tiens') : phase === 'recup' ? 'Récupération' : 'Prêt';
  const couleurPhase = phase === 'recup' ? '#029FD6' : phase === 'prepa' ? COULEURS.texteAtt : couleur;

  const rond: React.CSSProperties = { width: 34, height: 34, borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
  const principal: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '12px 22px', borderRadius: 999, border: `1px solid ${couleur}`, background: `${couleur}26`, color: couleur, cursor: 'pointer', fontFamily: 'inherit' };
  const secondaire: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '9px 14px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer', fontFamily: 'inherit' };

  function Reglage({ libelle, valeur, pas, min, onChange }: { libelle: string; valeur: number; pas: number; min: number; onChange: (v: number) => void }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, minWidth: 78 }}>{libelle}</span>
        <button type="button" aria-label={`Moins de ${libelle.toLowerCase()}`} onClick={() => onChange(Math.max(min, valeur - pas))} style={rond}><Minus size={15} /></button>
        <span style={{ fontSize: 14, fontWeight: 700, color: COULEURS.texte, minWidth: 44, textAlign: 'center' }}>{valeur === 0 ? 'Aucune' : formaterChrono(valeur)}</span>
        <button type="button" aria-label={`Plus de ${libelle.toLowerCase()}`} onClick={() => onChange(valeur + pas)} style={rond}><Plus size={15} /></button>
      </div>
    );
  }

  return (
    <div style={{ margin: '10px 0', padding: '14px 14px 12px', borderRadius: 12, border: `1px solid ${couleurPhase}66`, background: COULEURS.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, color: couleurPhase }}>
          {titrePhase}{numero > 0 ? ` · ${nom} ${numero}${objectif.series ? ` / ${objectif.series}` : ''}` : ''}
        </p>
        <button type="button" onClick={onFermer} aria-label="Fermer le chrono" style={{ ...rond, width: 28, height: 28, border: 'none' }}><X size={16} /></button>
      </div>

      {phase === 'pret' ? (
        <>
          <p style={{ margin: '6px 0 10px', fontSize: 12, color: COULEURS.texteAtt }}>
            {faites === 0 ? 'Règle si besoin, puis lance.' : `${faites} ${faites > 1 ? 'faites' : 'faite'}${objectif.series ? ` sur ${objectif.series}` : ''}.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {mode === 'tenue' && <Reglage libelle="Tenue" valeur={cibleSec} pas={5} min={5} onChange={setCibleSec} />}
            <Reglage libelle="Récupération" valeur={recupSec} pas={30} min={0} onChange={setRecupSec} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={demarrer} style={principal}>
              {mode === 'reps' ? <Check size={17} /> : <Play size={17} />}
              {mode === 'reps' ? 'Série faite' : faites === 0 ? 'Démarrer' : `${nom} suivant${mode === 'tenue' ? 'e' : ''}`}
            </button>
            {faites > 0 && (
              <button type="button" onClick={terminer} style={secondaire}>
                <Check size={15} /> {mode === 'reps' ? 'Terminer' : 'Terminer et noter'}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p aria-live="off" style={{ margin: '4px 0 10px', fontSize: 'clamp(54px, 18vw, 84px)', lineHeight: 1, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: couleurPhase, textAlign: 'center' }}>
            {formaterChrono(phase === 'effort' && mode === 'temps' ? Math.floor(affiche) : Math.ceil(affiche))}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {phase === 'recup' ? (
              <>
                <button type="button" onClick={() => { repere.current += 30000; setAffiche((a) => a + 30); }} style={secondaire}><Plus size={15} /> 30 s</button>
                <button type="button" onClick={() => setPhase('pret')} style={secondaire}><SkipForward size={15} /> Passer</button>
              </>
            ) : (
              <button type="button" onClick={arreterEffort} style={phase === 'effort' && mode === 'temps' ? principal : secondaire}>
                <Square size={15} /> {phase === 'prepa' ? 'Annuler' : mode === 'temps' ? 'Set terminé' : 'Arrêter là'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
