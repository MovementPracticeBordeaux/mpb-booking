'use client';

import { useState, useEffect, useRef } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

type Mouvement = { chiffre: string; nom: string };

const CLE_STOCKAGE = 'mpb_locomotion_mouvements';

function chargerMouvements(): Mouvement[] {
  if (typeof window === 'undefined') return [];
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

export default function OutilLocomotion() {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [chiffre, setChiffre] = useState('');
  const [nom, setNom] = useState('');
  const [longueur, setLongueur] = useState(6);
  const [sequence, setSequence] = useState<Mouvement[]>([]);

  const [bpm, setBpm] = useState(90);
  const [metronomeActif, setMetronomeActif] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMouvements(chargerMouvements());
  }, []);

  function sauvegarder(liste: Mouvement[]) {
    setMouvements(liste);
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(liste));
  }

  function ajouterMouvement() {
    if (!chiffre.trim() || !nom.trim()) return;
    if (mouvements.some((m) => m.chiffre === chiffre.trim())) return;
    sauvegarder([...mouvements, { chiffre: chiffre.trim(), nom: nom.trim() }]);
    setChiffre('');
    setNom('');
  }

  function supprimerMouvement(c: string) {
    sauvegarder(mouvements.filter((m) => m.chiffre !== c));
  }

  function tirerSequence() {
    if (mouvements.length === 0) return;
    const tirage: Mouvement[] = [];
    for (let i = 0; i < longueur; i++) {
      tirage.push(mouvements[Math.floor(Math.random() * mouvements.length)]);
    }
    setSequence(tirage);
  }

  function jouerClic() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  function basculerMetronome() {
    if (metronomeActif) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setMetronomeActif(false);
    } else {
      jouerClic();
      intervalRef.current = setInterval(jouerClic, (60 / bpm) * 1000);
      setMetronomeActif(true);
    }
  }

  useEffect(() => {
    if (metronomeActif) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(jouerClic, (60 / bpm) * 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const champStyle: React.CSSProperties = {
    background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8,
    padding: '9px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit',
  };

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        OUTIL <span style={GRADIENT_TEXTE}>LOCOMOTION</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        Associe librement tes mouvements à des chiffres, tire des combinaisons aléatoires, garde le rythme
        au métronome. Tes mouvements sont sauvegardés sur cet appareil.
      </p>

      {/* MOUVEMENTS */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Mes mouvements</h2>

        {mouvements.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {mouvements.map((m) => (
              <span key={m.chiffre} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 10px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface }}>
                <strong style={{ color: '#f0a' }}>{m.chiffre}</strong> {m.nom}
                <button type="button" onClick={() => supprimerMouvement(m.chiffre)} style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', padding: 0, fontSize: 12 }}>✕</button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={chiffre} onChange={(e) => setChiffre(e.target.value)} placeholder="N°" style={{ ...champStyle, width: 60 }} />
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du mouvement" style={{ ...champStyle, flexGrow: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterMouvement(); } }} />
          <button type="button" onClick={ajouterMouvement} style={{ fontSize: 13, padding: '9px 16px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}>
            Ajouter
          </button>
        </div>
      </section>

      {/* TIRAGE */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Combinaison aléatoire</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: COULEURS.texteAtt }}>Longueur :</label>
          <input type="number" min={2} max={20} value={longueur} onChange={(e) => setLongueur(Number(e.target.value))} style={{ ...champStyle, width: 60 }} />
          <button
            type="button"
            onClick={tirerSequence}
            disabled={mouvements.length === 0}
            style={{ fontSize: 13, padding: '9px 18px', borderRadius: 999, border: 'none', background: mouvements.length === 0 ? COULEURS.surfaceForte : GRADIENT, color: mouvements.length === 0 ? COULEURS.texteFaible : 'white', fontWeight: 600, cursor: mouvements.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Tirer une combinaison
          </button>
        </div>

        {mouvements.length === 0 && (
          <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>Ajoute au moins un mouvement pour lancer un tirage.</p>
        )}

        {sequence.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sequence.map((m, i) => (
              <span key={i} style={{ fontSize: 15, fontFamily: POLICE_DISPLAY, padding: '10px 16px', borderRadius: 10, background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}` }}>
                <span style={{ color: '#f0a' }}>{m.chiffre}</span> · {m.nom}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* MÉTRONOME */}
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Métronome</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input type="range" min={40} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} style={{ flexGrow: 1 }} />
          <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, minWidth: 70, textAlign: 'right' }}>{bpm} bpm</span>
        </div>
        <button
          type="button"
          onClick={basculerMetronome}
          style={{ marginTop: 12, fontSize: 14, padding: '11px 22px', borderRadius: 999, border: 'none', background: metronomeActif ? '#ff6b6b' : GRADIENT, color: 'white', fontWeight: 600, cursor: 'pointer' }}
        >
          {metronomeActif ? '⏸ Arrêter' : '▶ Démarrer'}
        </button>
      </section>
    </main>
  );
}
