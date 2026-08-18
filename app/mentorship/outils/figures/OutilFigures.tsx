'use client';

import { useState, useRef, useEffect } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';

type EntreeHistorique = {
  id: string;
  figure: string;
  tentatives: string;
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

function beep(audioCtxRef: React.MutableRefObject<AudioContext | null>, freq: number, duree: number) {
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

// ------------------------------------------------------------------------
// CHRONO DE TENUE + MÉMOIRE DES TENTATIVES
// ------------------------------------------------------------------------
function ChronoTentatives({ historiqueInitial }: { historiqueInitial: EntreeHistorique[] }) {
  const supabase = supabaseBrowser();
  const [figure, setFigure] = useState('');
  const [tentatives, setTentatives] = useState<number[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [ecoule, setEcoule] = useState(0);
  const [saisieFinale, setSaisieFinale] = useState(false);
  const [lieu, setLieu] = useState('');
  const [ressenti, setRessenti] = useState('');
  const [historique, setHistorique] = useState(historiqueInitial);
  const [enregistrement, setEnregistrement] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Même principe que le minuteur EMOM : on recalcule depuis l'horodatage
  // réel de départ, pas via un compteur qui dérive en veille.
  const debutRef = useRef<number | null>(null);

  function demarrerChrono() {
    debutRef.current = Date.now();
    setEcoule(0);
    setEnCours(true);
    beep(audioCtxRef, 880, 0.08);
  }

  function arreterChrono() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setEnCours(false);
    beep(audioCtxRef, 660, 0.1);
    if (ecoule > 0) {
      setTentatives((prev) => [...prev, ecoule]);
    }
  }

  useEffect(() => {
    if (!enCours) return;
    function recalculer() {
      if (!debutRef.current) return;
      setEcoule(Math.floor((Date.now() - debutRef.current) / 1000));
    }
    intervalRef.current = setInterval(recalculer, 250);
    document.addEventListener('visibilitychange', recalculer);
    recalculer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', recalculer);
    };
  }, [enCours]);

  function annulerTout() {
    setTentatives([]);
    setEcoule(0);
    setSaisieFinale(false);
    setLieu('');
    setRessenti('');
  }

  async function enregistrer() {
    if (!figure.trim() || tentatives.length === 0) return;
    setEnregistrement(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEnregistrement(false); return; }

    const { data, error } = await supabase
      .from('historique_figures')
      .insert({
        eleve_id: user.id,
        figure: figure.trim(),
        tentatives: tentatives.join(','),
        lieu: lieu.trim() || null,
        ressenti: ressenti.trim() || null,
      })
      .select('id, figure, tentatives, lieu, ressenti, cree_le')
      .single();

    setEnregistrement(false);
    if (!error && data) {
      setHistorique((prev) => [data as EntreeHistorique, ...prev]);
      setFigure('');
      annulerTout();
    }
  }

  async function supprimerEntree(id: string) {
    setHistorique((prev) => prev.filter((h) => h.id !== id));
    await supabase.from('historique_figures').delete().eq('id', id);
  }

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Chrono de tenue &amp; tentatives</h2>

      <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 14, padding: 20, background: COULEURS.surface, marginBottom: 20 }}>
        <input
          type="text"
          value={figure}
          onChange={(e) => setFigure(e.target.value)}
          placeholder="Nom de la figure (ex. Handstand)"
          style={{ ...champStyle, width: '100%', marginBottom: 16, boxSizing: 'border-box' }}
        />

        {tentatives.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {tentatives.map((t, i) => (
              <span key={i} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 999, background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}` }}>
                Tentative {i + 1} : <strong style={{ color: '#f0a' }}>{mmss(t)}</strong>
              </span>
            ))}
          </div>
        )}

        {!saisieFinale ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 1, color: COULEURS.texteFaible, margin: '0 0 8px' }}>
                TENTATIVE {tentatives.length + 1} {enCours && '— EN COURS'}
              </p>
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 48 }}>{mmss(ecoule)}</p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {!enCours ? (
                <button type="button" onClick={demarrerChrono} style={{ fontSize: 14, padding: '11px 24px', borderRadius: 999, border: 'none', background: GRADIENT, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  ▶ Démarrer la tentative
                </button>
              ) : (
                <button type="button" onClick={arreterChrono} style={{ fontSize: 14, padding: '11px 24px', borderRadius: 999, border: 'none', background: '#ff6b6b', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  ⏹ Chute / Arrêt
                </button>
              )}
              {tentatives.length > 0 && !enCours && (
                <button type="button" onClick={() => setSaisieFinale(true)} style={{ fontSize: 13, padding: '11px 20px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}>
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
              <button type="button" onClick={enregistrer} disabled={enregistrement || !figure.trim()} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 999, border: 'none', background: GRADIENT, color: 'white', fontWeight: 600, cursor: 'pointer', opacity: enregistrement ? 0.6 : 1 }}>
                {enregistrement ? 'Enregistrement…' : 'Enregistrer dans mon historique'}
              </button>
              <button type="button" onClick={() => setSaisieFinale(false)} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteFaible, cursor: 'pointer' }}>
                ← Retour
              </button>
            </div>
          </div>
        )}

        {tentatives.length > 0 && !saisieFinale && (
          <button type="button" onClick={annulerTout} style={{ display: 'block', margin: '12px auto 0', fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer' }}>
            Tout annuler
          </button>
        )}
      </div>

      {historique.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Historique</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {historique.map((h) => (
              <div key={h.id} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{h.figure}</strong>
                  <span style={{ fontSize: 11, color: COULEURS.texteFaible }}>
                    {new Date(h.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(h.cree_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '4px 0 0' }}>
                  Tentatives : {h.tentatives.split(',').map((t) => mmss(Number(t))).join(' · ')}
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
// MINUTEUR DE RÉCUPÉRATION
// ------------------------------------------------------------------------
function MinuteurRecuperation() {
  const [duree, setDuree] = useState(90);
  const [enCours, setEnCours] = useState(false);
  const [restant, setRestant] = useState(90);
  const [termine, setTermine] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finRef = useRef<number | null>(null);

  function demarrer() {
    finRef.current = Date.now() + duree * 1000;
    setRestant(duree);
    setTermine(false);
    setEnCours(true);
  }

  function reinitialiser() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    finRef.current = null;
    setEnCours(false);
    setTermine(false);
    setRestant(duree);
  }

  useEffect(() => {
    if (!enCours) return;
    function recalculer() {
      if (!finRef.current) return;
      const restantSec = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
      setRestant(restantSec);
      if (restantSec === 0) {
        beep(audioCtxRef, 440, 0.4);
        setEnCours(false);
        setTermine(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
    intervalRef.current = setInterval(recalculer, 250);
    document.addEventListener('visibilitychange', recalculer);
    recalculer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', recalculer);
    };
  }, [enCours]);

  return (
    <section style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 14, padding: 20, background: COULEURS.surface }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Minuteur de récupération</h2>

      {!enCours && !termine ? (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 11, letterSpacing: 1, color: COULEURS.texteFaible, margin: '0 0 8px' }}>DURÉE DE RÉCUP'</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <button type="button" onClick={() => { setDuree((d) => Math.max(15, d - 15)); setRestant((d) => Math.max(15, d - 15)); }} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte, fontSize: 18, cursor: 'pointer' }}>−</button>
            <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, minWidth: 90 }}>{mmss(duree)}</span>
            <button type="button" onClick={() => { setDuree((d) => d + 15); setRestant((d) => d + 15); }} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte, fontSize: 18, cursor: 'pointer' }}>+</button>
          </div>
        </div>
      ) : enCours ? (
        <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 48, textAlign: 'center', marginBottom: 16, color: restant <= 5 ? '#ff6b6b' : COULEURS.texte }}>{mmss(restant)}</p>
      ) : (
        <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, textAlign: 'center', marginBottom: 16, color: '#9ef29e' }}>🔔 Récup' terminée — c'est reparti !</p>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {!enCours ? (
          <button type="button" onClick={demarrer} style={{ fontSize: 14, padding: '11px 24px', borderRadius: 999, border: 'none', background: GRADIENT, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            ▶ Démarrer
          </button>
        ) : (
          <button type="button" onClick={reinitialiser} style={{ fontSize: 14, padding: '11px 22px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteFaible, cursor: 'pointer' }}>
            ↺ Reset
          </button>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------------
export default function OutilFigures({ historiqueInitial }: { historiqueInitial: EntreeHistorique[] }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        OUTIL <span style={GRADIENT_TEXTE}>FIGURES</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        Chronomètre tes tentatives de tenue (handstand, appuis...), garde-en la mémoire, et gère ta
        récupération entre deux essais.
      </p>

      <ChronoTentatives historiqueInitial={historiqueInitial} />
      <MinuteurRecuperation />
    </main>
  );
}
