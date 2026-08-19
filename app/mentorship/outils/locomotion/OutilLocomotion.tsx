'use client';

import { useState, useEffect, useRef } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Mouvement = { chiffre: string; nom: string };

type EntreeHistorique = {
  id: string;
  duree_secondes: number;
  nb_combinaisons: number;
  cree_le: string;
};

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

function mmss(totalSecondes: number): string {
  const m = Math.floor(totalSecondes / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSecondes % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function OutilLocomotion({ historiqueInitial }: { historiqueInitial: EntreeHistorique[] }) {
  const supabase = supabaseBrowser();
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [nom, setNom] = useState('');
  const [longueur, setLongueur] = useState(6);
  const [sequence, setSequence] = useState<Mouvement[]>([]);

  const [bpm, setBpm] = useState(90);
  const [metronomeActif, setMetronomeActif] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chrono de séance : mesure le temps de travail réel et compte les
  // combinaisons tirées avec le shaker pendant la séance — de quoi
  // alimenter les stats de Progression (temps de travail, régularité,
  // volume de combinaisons), ce que l'outil ne permettait pas jusqu'ici.
  const [chronoActif, setChronoActif] = useState(false);
  const [ecouleSecondes, setEcouleSecondes] = useState(0);
  const [combinaisonsSession, setCombinaisonsSession] = useState(0);
  const [historique, setHistorique] = useState(historiqueInitial);
  const [enregistrement, setEnregistrement] = useState(false);
  const debutRef = useRef<number | null>(null);
  const chronoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMouvements(chargerMouvements());
  }, []);

  function sauvegarder(liste: Mouvement[]) {
    setMouvements(liste);
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(liste));
  }

  function ajouterMouvement() {
    if (!nom.trim()) return;
    const prochainChiffre = String(mouvements.length + 1);
    sauvegarder([...mouvements, { chiffre: prochainChiffre, nom: nom.trim() }]);
    setNom('');
  }

  function supprimerMouvement(c: string) {
    // Retire le mouvement puis renumérote le reste en séquence (1, 2, 3…)
    // pour ne jamais avoir de trou ni de doublon de numéro.
    const restants = mouvements.filter((m) => m.chiffre !== c);
    sauvegarder(restants.map((m, i) => ({ ...m, chiffre: String(i + 1) })));
  }

  function melanger<T>(liste: T[]): T[] {
    const copie = [...liste];
    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  function tirerSequence() {
    if (mouvements.length === 0) return;
    // Enchaîne des paquets mélangés (chacun = tous les mouvements, une
    // seule fois) : garantit qu'aucun mouvement ne revient avant que tous
    // les autres soient passés, et qu'il n'y a jamais de répétition d'un
    // paquet à l'autre non plus.
    const tirage: Mouvement[] = [];
    while (tirage.length < longueur) {
      let paquet = melanger(mouvements);
      if (tirage.length > 0 && paquet[0].chiffre === tirage[tirage.length - 1].chiffre && mouvements.length > 1) {
        // évite la jonction "dernier du paquet précédent == premier du nouveau"
        [paquet[0], paquet[1]] = [paquet[1], paquet[0]];
      }
      tirage.push(...paquet);
    }
    setSequence(tirage.slice(0, longueur));
    // Ne compte que les tirages faits PENDANT une séance chronométrée —
    // un tirage fait en dehors ne reflète pas un vrai temps de travail.
    if (chronoActif) setCombinaisonsSession((n) => n + 1);
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

  // Chrono de séance — même principe robuste que les autres outils (EMOM,
  // Figures) : recalcul depuis l'horodatage réel de départ à chaque tick,
  // jamais un simple compteur qui dérive quand l'écran se met en veille.
  function demarrerSeance() {
    debutRef.current = Date.now();
    setEcouleSecondes(0);
    setCombinaisonsSession(0);
    setChronoActif(true);
  }

  async function terminerSeance() {
    setChronoActif(false);
    if (chronoIntervalRef.current) clearInterval(chronoIntervalRef.current);
    if (ecouleSecondes < 5) return; // séance trop courte pour valoir la peine d'être enregistrée

    setEnregistrement(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEnregistrement(false); return; }

    const { data, error } = await supabase
      .from('historique_locomotion')
      .insert({ eleve_id: user.id, duree_secondes: ecouleSecondes, nb_combinaisons: combinaisonsSession })
      .select('id, duree_secondes, nb_combinaisons, cree_le')
      .single();

    setEnregistrement(false);
    if (!error && data) setHistorique((prev) => [data as EntreeHistorique, ...prev]);
  }

  useEffect(() => {
    if (!chronoActif) return;
    function recalculer() {
      if (!debutRef.current) return;
      setEcouleSecondes(Math.floor((Date.now() - debutRef.current) / 1000));
    }
    chronoIntervalRef.current = setInterval(recalculer, 1000);
    document.addEventListener('visibilitychange', recalculer);
    recalculer();
    return () => {
      if (chronoIntervalRef.current) clearInterval(chronoIntervalRef.current);
      document.removeEventListener('visibilitychange', recalculer);
    };
  }, [chronoActif]);

  async function supprimerEntreeHistorique(id: string) {
    setHistorique((prev) => prev.filter((h) => h.id !== id));
    await supabase.from('historique_locomotion').delete().eq('id', id);
  }

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
        Associe librement tes mouvements à des chiffres, tire des combinaisons aléatoires avec le shaker de
        mouvement, garde le rythme au métronome. Tes mouvements sont sauvegardés sur cet appareil.
      </p>

      {/* CHRONO DE SÉANCE */}
      <section style={{ marginBottom: 28, background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Chrono de séance</h2>
        <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: '0 0 12px' }}>
          Démarre avant de t'entraîner : ça mesure ton temps de travail et compte les combinaisons tirées avec
          le shaker, pour nourrir tes stats de Progression.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, letterSpacing: 0.5, ...(chronoActif ? GRADIENT_TEXTE : {}) }}>
            {mmss(ecouleSecondes)}
          </span>
          {chronoActif && (
            <span style={{ fontSize: 13, color: COULEURS.texteAtt }}>
              {combinaisonsSession} combinaison{combinaisonsSession !== 1 ? 's' : ''} tirée{combinaisonsSession !== 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            onClick={chronoActif ? terminerSeance : demarrerSeance}
            disabled={enregistrement}
            style={{ marginLeft: 'auto', fontSize: 14, padding: '11px 22px', borderRadius: 999, border: 'none', background: chronoActif ? '#ff6b6b' : GRADIENT, color: 'white', fontWeight: 600, cursor: enregistrement ? 'default' : 'pointer' }}
          >
            {chronoActif ? '⏹ Terminer la séance' : '▶ Démarrer la séance'}
          </button>
        </div>

        {historique.length > 0 && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${COULEURS.bordure}`, paddingTop: 12 }}>
            <p style={{ fontSize: 11, color: COULEURS.texteFaible, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Séances précédentes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {historique.slice(0, 8).map((h) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: COULEURS.texteAtt }}>
                  <span>{new Date(h.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  <span style={{ color: COULEURS.texte, fontWeight: 600 }}>{mmss(h.duree_secondes)}</span>
                  <span>{h.nb_combinaisons} combinaison{h.nb_combinaisons !== 1 ? 's' : ''}</span>
                  <button type="button" onClick={() => supprimerEntreeHistorique(h.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du mouvement" style={{ ...champStyle, flexGrow: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterMouvement(); } }} />
          <button type="button" onClick={ajouterMouvement} style={{ fontSize: 13, padding: '9px 16px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}>
            Ajouter
          </button>
        </div>
      </section>

      {/* TIRAGE */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Shaker de mouvement</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: COULEURS.texteAtt }}>Longueur :</label>
          <input type="number" min={2} max={20} value={longueur} onChange={(e) => setLongueur(Number(e.target.value))} style={{ ...champStyle, width: 60 }} />
          <button
            type="button"
            onClick={tirerSequence}
            disabled={mouvements.length === 0}
            style={{ fontSize: 13, padding: '9px 18px', borderRadius: 999, border: 'none', background: mouvements.length === 0 ? COULEURS.surfaceForte : GRADIENT, color: mouvements.length === 0 ? COULEURS.texteFaible : 'white', fontWeight: 600, cursor: mouvements.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            🎲 Tirer une combinaison
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

