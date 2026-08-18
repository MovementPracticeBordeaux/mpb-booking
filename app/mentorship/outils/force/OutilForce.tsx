'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';
import CourbeSimple from '../CourbeSimple';

type EntreeHistorique = {
  id: string;
  exercice: string;
  reps_par_set: string;
  lieu: string | null;
  ressenti: string | null;
  cree_le: string;
};

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
// COMPTEUR REPS / SETS + HISTORIQUE
// ------------------------------------------------------------------------
function CompteurRepsSets({ historiqueInitial }: { historiqueInitial: EntreeHistorique[] }) {
  const supabase = supabaseBrowser();
  const [exercice, setExercice] = useState('');
  const [setsRealises, setSetsRealises] = useState<number[]>([]);
  const [repsCourant, setRepsCourant] = useState(0);
  const [saisieFinale, setSaisieFinale] = useState(false);
  const [lieu, setLieu] = useState('');
  const [ressenti, setRessenti] = useState('');
  const [historique, setHistorique] = useState(historiqueInitial);
  const [enregistrement, setEnregistrement] = useState(false);

  function validerSet() {
    if (repsCourant === 0) return;
    setSetsRealises((prev) => [...prev, repsCourant]);
    setRepsCourant(0);
  }

  function annulerTout() {
    setSetsRealises([]);
    setRepsCourant(0);
    setSaisieFinale(false);
    setLieu('');
    setRessenti('');
  }

  async function enregistrer() {
    if (!exercice.trim() || setsRealises.length === 0) return;
    setEnregistrement(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEnregistrement(false); return; }

    const { data, error } = await supabase
      .from('historique_reps_sets')
      .insert({
        eleve_id: user.id,
        exercice: exercice.trim(),
        reps_par_set: setsRealises.join(','),
        lieu: lieu.trim() || null,
        ressenti: ressenti.trim() || null,
      })
      .select('id, exercice, reps_par_set, lieu, ressenti, cree_le')
      .single();

    setEnregistrement(false);
    if (!error && data) {
      setHistorique((prev) => [data as EntreeHistorique, ...prev]);
      setExercice('');
      annulerTout();
    }
  }

  async function supprimerEntree(id: string) {
    setHistorique((prev) => prev.filter((h) => h.id !== id));
    await supabase.from('historique_reps_sets').delete().eq('id', id);
  }

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Compteur reps / sets</h2>

      <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 14, padding: 20, background: COULEURS.surface, marginBottom: 20 }}>
        <input
          type="text"
          value={exercice}
          onChange={(e) => setExercice(e.target.value)}
          placeholder="Nom de l'exercice (ex. Tractions strictes)"
          style={{ ...champStyle, width: '100%', marginBottom: 16, boxSizing: 'border-box' }}
        />

        {setsRealises.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {setsRealises.map((reps, i) => (
              <span key={i} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 999, background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}` }}>
                Set {i + 1} : <strong style={{ color: '#f0a' }}>{reps}</strong>
              </span>
            ))}
          </div>
        )}

        {!saisieFinale ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 1, color: COULEURS.texteFaible, margin: '0 0 8px' }}>RÉPÉTITIONS — SET {setsRealises.length + 1}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <button type="button" onClick={() => setRepsCourant((r) => Math.max(0, r - 1))} style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte, fontSize: 22, cursor: 'pointer' }}>−</button>
                <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 48, minWidth: 70, textAlign: 'center' }}>{repsCourant}</span>
                <button type="button" onClick={() => setRepsCourant((r) => r + 1)} style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte, fontSize: 22, cursor: 'pointer' }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={validerSet} disabled={repsCourant === 0} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 999, border: 'none', background: repsCourant === 0 ? COULEURS.surfaceForte : GRADIENT, color: repsCourant === 0 ? COULEURS.texteFaible : 'white', fontWeight: 600, cursor: repsCourant === 0 ? 'not-allowed' : 'pointer' }}>
                Valider ce set
              </button>
              {setsRealises.length > 0 && (
                <button type="button" onClick={() => setSaisieFinale(true)} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}>
                  Terminer →
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="text" value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Lieu (optionnel)" style={champStyle} />
            <textarea value={ressenti} onChange={(e) => setRessenti(e.target.value)} placeholder="Ressenti (optionnel)" rows={2} style={{ ...champStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={enregistrer} disabled={enregistrement || !exercice.trim()} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 999, border: 'none', background: GRADIENT, color: 'white', fontWeight: 600, cursor: 'pointer', opacity: enregistrement ? 0.6 : 1 }}>
                {enregistrement ? 'Enregistrement…' : 'Enregistrer dans mon historique'}
              </button>
              <button type="button" onClick={() => setSaisieFinale(false)} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteFaible, cursor: 'pointer' }}>
                ← Retour
              </button>
            </div>
          </div>
        )}

        {setsRealises.length > 0 && !saisieFinale && (
          <button type="button" onClick={annulerTout} style={{ display: 'block', margin: '12px auto 0', fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer' }}>
            Tout annuler
          </button>
        )}
      </div>

      {historique.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Progression</p>
          <CourbeExercice historique={historique} />

          <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: '20px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Historique</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {historique.map((h) => (
              <div key={h.id} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{h.exercice}</strong>
                  <span style={{ fontSize: 11, color: COULEURS.texteFaible }}>
                    {new Date(h.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(h.cree_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '4px 0 0' }}>
                  Sets : {h.reps_par_set.split(',').join(' · ')}
                  {h.lieu && ` · ${h.lieu}`}
                </p>
                {h.ressenti && <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: '4px 0 0', fontStyle: 'italic' }}>{h.ressenti}</p>}
                <button type="button" onClick={() => supprimerEntree(h.id)} style={{ fontSize: 11, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 6 }}>
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------------
// COURBE DE PROGRESSION — volume total (somme des reps) par séance, pour un exercice choisi
// ------------------------------------------------------------------------
function CourbeExercice({ historique }: { historique: EntreeHistorique[] }) {
  const exercicesDisponibles = useMemo(
    () => Array.from(new Set(historique.map((h) => h.exercice))),
    [historique]
  );
  const [exerciceChoisi, setExerciceChoisi] = useState(exercicesDisponibles[0] ?? '');

  useEffect(() => {
    if (!exercicesDisponibles.includes(exerciceChoisi)) setExerciceChoisi(exercicesDisponibles[0] ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historique]);

  const points = useMemo(() => {
    return historique
      .filter((h) => h.exercice === exerciceChoisi)
      .slice()
      .reverse() // du plus ancien au plus récent, pour lire la courbe chronologiquement
      .map((h) => ({
        date: h.cree_le,
        valeur: h.reps_par_set.split(',').map(Number).reduce((a, b) => a + b, 0),
      }));
  }, [historique, exerciceChoisi]);

  if (exercicesDisponibles.length === 0) return null;

  return (
    <div>
      {exercicesDisponibles.length > 1 && (
        <select
          value={exerciceChoisi}
          onChange={(e) => setExerciceChoisi(e.target.value)}
          style={{ ...champStyle, width: '100%', boxSizing: 'border-box', marginBottom: 12 }}
        >
          {exercicesDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      )}
      <p style={{ fontSize: 11, color: COULEURS.texteFaible, marginBottom: 8 }}>
        Volume total (reps, tous sets confondus) par séance — {exerciceChoisi}
      </p>
      <CourbeSimple points={points} unite={(v) => `${v} reps`} couleur="#f0a" />
    </div>
  );
}

// ------------------------------------------------------------------------
export default function OutilForce({ historiqueInitial }: { historiqueInitial: EntreeHistorique[] }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        OUTIL <span style={GRADIENT_TEXTE}>FORCE</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        Un minuteur pour tes EMOM et intervalles, et un compteur pour suivre tes reps et sets — avec un
        historique daté que tu retrouves à chaque visite.
      </p>

      <MinuteurEMOM />
      <CompteurRepsSets historiqueInitial={historiqueInitial} />
    </main>
  );
}
