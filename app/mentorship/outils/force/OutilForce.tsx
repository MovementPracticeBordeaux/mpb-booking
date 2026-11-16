'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';


function mmss(totalSecondes: number): string {
  const m = Math.floor(totalSecondes / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSecondes % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const champStyle: React.CSSProperties = {
  background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8,
  padding: '9px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit',
};

// ------------------------------------------------------------------------
// MINUTEUR EMOM / INTERVALLES
// ------------------------------------------------------------------------
function MinuteurEMOM() {
  const [sets, setSets] = useState(10);
  const [travail, setTravail] = useState(60);
  const [repos, setRepos] = useState(0);

  const [enCours, setEnCours] = useState(false);
  const [phase, setPhase] = useState<'travail' | 'repos'>('travail');
  const [setActuel, setSetActuel] = useState(1);
  const [restant, setRestant] = useState(60);
  const [termine, setTermine] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Horodatage réel de démarrage — la source de vérité du temps écoulé.
  // Contrairement à un décompte par setInterval (qui dérive dès que l'écran
  // se met en veille, le navigateur ralentissant fortement les timers en
  // arrière-plan), on recalcule l'état à chaque tick à partir de l'horloge
  // système : impossible de dérailler, même après plusieurs minutes d'écran
  // éteint — au réveil, l'affichage se resynchronise instantanément.
  const debutRef = useRef<number | null>(null);
  const dernierePhaseRef = useRef<{ phase: 'travail' | 'repos'; setActuel: number } | null>(null);

  function beep(freq: number, duree: number) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duree);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duree);
  }

  function arreterInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  // Calcule l'état exact (phase, set en cours, temps restant) à partir du
  // temps réellement écoulé depuis le démarrage — jamais depuis un compteur
  // qui aurait pu dériver.
  function calculerEtat(elapsedSec: number): { phase: 'travail' | 'repos'; setActuel: number; restant: number; termine: boolean } {
    const cycleDuree = travail + repos;
    const cycleIndex = Math.floor(elapsedSec / cycleDuree);
    if (cycleIndex >= sets) return { phase: 'travail', setActuel: sets, restant: 0, termine: true };
    const posDansCycle = elapsedSec - cycleIndex * cycleDuree;
    if (posDansCycle < travail) {
      return { phase: 'travail', setActuel: cycleIndex + 1, restant: Math.ceil(travail - posDansCycle), termine: false };
    }
    return { phase: 'repos', setActuel: cycleIndex + 1, restant: Math.ceil(cycleDuree - posDansCycle), termine: false };
  }

  function demarrer() {
    debutRef.current = Date.now();
    dernierePhaseRef.current = { phase: 'travail', setActuel: 1 };
    setPhase('travail');
    setSetActuel(1);
    setRestant(travail);
    setTermine(false);
    setEnCours(true);
    beep(880, 0.1);
  }

  function arreter() {
    arreterInterval();
    setEnCours(false);
  }

  function reinitialiser() {
    arreter();
    debutRef.current = null;
    setPhase('travail');
    setSetActuel(1);
    setRestant(travail);
    setTermine(false);
  }

  useEffect(() => {
    if (!enCours) return;

    function recalculer() {
      if (!debutRef.current) return;
      const elapsedSec = (Date.now() - debutRef.current) / 1000;
      const etat = calculerEtat(elapsedSec);

      // Bip uniquement si on change réellement de phase/set (donc pas à
      // chaque tick) — même après un rattrapage suite à une mise en veille.
      const derniere = dernierePhaseRef.current;
      if (!derniere || derniere.phase !== etat.phase || derniere.setActuel !== etat.setActuel) {
        if (etat.termine) beep(440, 0.4);
        else beep(etat.phase === 'repos' ? 660 : 880, etat.phase === 'repos' ? 0.12 : 0.1);
        dernierePhaseRef.current = { phase: etat.phase, setActuel: etat.setActuel };
      }

      setPhase(etat.phase);
      setSetActuel(etat.setActuel);
      setRestant(etat.restant);
      if (etat.termine) {
        setTermine(true);
        setEnCours(false);
        arreterInterval();
      }
    }

    // Tick fréquent pour un affichage fluide ; resynchronisation immédiate
    // dès que l'onglet redevient visible (retour de veille), au cas où le
    // navigateur ait complètement suspendu le setInterval entre-temps.
    intervalRef.current = setInterval(recalculer, 250);
    document.addEventListener('visibilitychange', recalculer);
    recalculer();

    return () => {
      arreterInterval();
      document.removeEventListener('visibilitychange', recalculer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enCours]);

  const Compteur = ({ label, valeur, onMoins, onPlus, format }: { label: string; valeur: number; onMoins: () => void; onPlus: () => void; format: (v: number) => string }) => (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: COULEURS.texteFaible, margin: '0 0 8px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <button type="button" onClick={onMoins} disabled={enCours} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte, fontSize: 18, cursor: enCours ? 'not-allowed' : 'pointer' }}>−</button>
        <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, minWidth: 90 }}>{format(valeur)}</span>
        <button type="button" onClick={onPlus} disabled={enCours} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte, fontSize: 18, cursor: enCours ? 'not-allowed' : 'pointer' }}>+</button>
      </div>
    </div>
  );

  return (
    <section style={{ marginBottom: 32, border: `1px solid ${COULEURS.bordure}`, borderRadius: 14, padding: 20, background: COULEURS.surface }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Minuteur EMOM / intervalles</h2>

      {!enCours && !termine ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
          <Compteur label="SETS" valeur={sets} format={(v) => `${v}`} onMoins={() => setSets((s) => Math.max(1, s - 1))} onPlus={() => setSets((s) => s + 1)} />
          <Compteur label="TRAVAIL" valeur={travail} format={mmss} onMoins={() => setTravail((s) => Math.max(5, s - 5))} onPlus={() => setTravail((s) => s + 5)} />
          <Compteur label="REPOS" valeur={repos} format={mmss} onMoins={() => setRepos((s) => Math.max(0, s - 5))} onPlus={() => setRepos((s) => s + 5)} />
        </div>
      ) : enCours ? (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 12, letterSpacing: 1, color: phase === 'travail' ? '#f0a' : '#9ef29e', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 700 }}>
            {phase === 'travail' ? 'Travail' : 'Repos'} — set {setActuel}/{sets}
          </p>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 56 }}>{mmss(restant)}</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 24, color: '#9ef29e' }}>🎉 Terminé — {sets} sets</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {!enCours && !termine ? (
          <button type="button" onClick={demarrer} style={{ fontSize: 15, padding: '13px 32px', borderRadius: 999, border: 'none', background: GRADIENT, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            ⚡ START
          </button>
        ) : enCours ? (
          <>
            <button type="button" onClick={arreter} style={{ fontSize: 14, padding: '11px 22px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texte, cursor: 'pointer' }}>
              ⏸ Pause
            </button>
            <button type="button" onClick={reinitialiser} style={{ fontSize: 14, padding: '11px 22px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteFaible, cursor: 'pointer' }}>
              ↺ Reset
            </button>
          </>
        ) : (
          <button type="button" onClick={reinitialiser} style={{ fontSize: 14, padding: '11px 22px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texte, cursor: 'pointer' }}>
            ↺ Recommencer
          </button>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------------
export default function OutilForce() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        OUTIL <span style={GRADIENT_TEXTE}>FORCE</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        Un minuteur pour tes EMOM et intervalles. Tes séries et répétitions se notent directement sous
        chaque exercice, dans « Mon suivi ».
      </p>

      <MinuteurEMOM />
    </main>
  );
}
