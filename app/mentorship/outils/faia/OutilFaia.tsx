'use client';

import { useState } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Etape = 'fragmenter' | 'assembler' | 'injecter' | 'amplifier';

type Competence = {
  id: string;
  nom: string;
  etape_actuelle: Etape;
  fragments: string;
  assemblage: string;
  injection: string;
  amplification: string;
  cree_le: string;
};

const ETAPES: { id: Etape; label: string; description: string; placeholder: string; couleur: string }[] = [
  {
    id: 'fragmenter',
    label: 'Fragmenter',
    description: 'Diviser le mouvement en qualités isolées, travaillées séparément.',
    placeholder: 'Ex. suspension active/passive, rowing, partie haute de la traction...',
    couleur: '#FF3B30',
  },
  {
    id: 'assembler',
    label: 'Assembler',
    description: 'Recréer des liens entre les fragments, du plus simple au plus complexe.',
    placeholder: 'Ex. traction assistée, traction excentrique, traction complète...',
    couleur: '#FF8A00',
  },
  {
    id: 'injecter',
    label: 'Injecter',
    description: 'Intégrer la compétence dans la Locomotion, où elle devient utilisable.',
    placeholder: 'Ex. dans un travail de muscle up...',
    couleur: '#FF2D78',
  },
  {
    id: 'amplifier',
    label: 'Amplifier',
    description: "Ajouter un cran de complexité, par le jeu ou l'augmentation du niveau d'exigence.",
    placeholder: 'Ex. lester la traction, la travailler en fault grip...',
    couleur: '#8B5CF6',
  },
];

const champStyle: React.CSSProperties = {
  background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8,
  padding: '9px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit', width: '100%',
};

export default function OutilFaia({ competencesInitiales }: { competencesInitiales: Competence[] }) {
  const supabase = supabaseBrowser();
  const [competences, setCompetences] = useState(competencesInitiales);
  const [nouveauNom, setNouveauNom] = useState('');
  const [creation, setCreation] = useState(false);

  async function ajouterCompetence() {
    if (!nouveauNom.trim()) return;
    setCreation(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreation(false); return; }

    const { data, error } = await supabase
      .from('competences_faia')
      .insert({ eleve_id: user.id, nom: nouveauNom.trim() })
      .select('id, nom, etape_actuelle, fragments, assemblage, injection, amplification, cree_le')
      .single();

    setCreation(false);
    if (!error && data) {
      setCompetences((prev) => [data as Competence, ...prev]);
      setNouveauNom('');
    }
  }

  function retirerCompetence(id: string) {
    setCompetences((prev) => prev.filter((c) => c.id !== id));
  }

  function mettreAJourLocal(id: string, patch: Partial<Competence>) {
    setCompetences((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        OUTIL <span style={GRADIENT_TEXTE}>FAIA</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 8px' }}>
        La méthode s'applique à n'importe quelle compétence. Choisis-en une, et remplis les 4 temps du cycle
        à ton rythme — pas besoin de tout écrire d'un coup, ça se construit au fil de ta pratique.
      </p>

      {/* Rappel condensé des 4 étapes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 28 }}>
        {ETAPES.map((e) => (
          <div key={e.id} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: e.couleur }}>{e.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: COULEURS.texteFaible, lineHeight: 1.4 }}>{e.description}</p>
          </div>
        ))}
      </div>

      {/* Nouvelle compétence */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)}
            placeholder="Nom de la compétence (ex. Traction complète)"
            style={{ ...champStyle, flexGrow: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterCompetence(); } }}
          />
          <button
            type="button" onClick={ajouterCompetence} disabled={creation || !nouveauNom.trim()}
            style={{ fontSize: 13, padding: '9px 18px', borderRadius: 999, border: 'none', flexShrink: 0, background: nouveauNom.trim() ? GRADIENT : COULEURS.surfaceForte, color: nouveauNom.trim() ? 'white' : COULEURS.texteFaible, fontWeight: 600, cursor: nouveauNom.trim() ? 'pointer' : 'not-allowed' }}
          >
            + Ajouter
          </button>
        </div>
      </section>

      {/* Liste des compétences */}
      {competences.length === 0 ? (
        <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>
          Aucune compétence en cours pour l'instant — ajoute-en une pour commencer à appliquer le cycle.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {competences.map((c) => (
            <CarteCompetence key={c.id} competence={c} onSupprimee={() => retirerCompetence(c.id)} onMiseAJour={(patch) => mettreAJourLocal(c.id, patch)} supabase={supabase} />
          ))}
        </div>
      )}
    </main>
  );
}

function CarteCompetence({
  competence, onSupprimee, onMiseAJour, supabase,
}: {
  competence: Competence;
  onSupprimee: () => void;
  onMiseAJour: (patch: Partial<Competence>) => void;
  supabase: ReturnType<typeof supabaseBrowser>;
}) {
  const [ouverte, setOuverte] = useState(false);
  const [brouillon, setBrouillon] = useState({
    fragments: competence.fragments,
    assemblage: competence.assemblage,
    injection: competence.injection,
    amplification: competence.amplification,
  });
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  const indexEtape = ETAPES.findIndex((e) => e.id === competence.etape_actuelle);

  async function definirEtape(etape: Etape) {
    onMiseAJour({ etape_actuelle: etape });
    await supabase.from('competences_faia').update({ etape_actuelle: etape, modifie_le: new Date().toISOString() }).eq('id', competence.id);
  }

  async function enregistrer() {
    setEnregistrement(true);
    const { error } = await supabase
      .from('competences_faia')
      .update({ ...brouillon, modifie_le: new Date().toISOString() })
      .eq('id', competence.id);
    setEnregistrement(false);
    if (!error) onMiseAJour(brouillon);
  }

  async function supprimer() {
    if (!confirm(`Supprimer "${competence.nom}" ?`)) return;
    setSuppression(true);
    await supabase.from('competences_faia').delete().eq('id', competence.id);
    onSupprimee();
  }

  return (
    <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px', background: COULEURS.surface }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={() => setOuverte((o) => !o)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0, flexGrow: 1 }}>
          <p style={{ margin: 0, fontFamily: POLICE_DISPLAY, fontSize: 17, letterSpacing: 0.3, color: COULEURS.texte }}>{competence.nom}</p>
        </button>
        <button type="button" onClick={supprimer} disabled={suppression} style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
      </div>

      {/* Indicateur d'étape F-A-I-A, cliquable */}
      <div style={{ display: 'flex', gap: 4, marginBottom: ouverte ? 16 : 0 }}>
        {ETAPES.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => definirEtape(e.id)}
            title={e.label}
            style={{
              flex: 1, padding: '6px 4px', fontSize: 10, fontWeight: 700, textAlign: 'center', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${i <= indexEtape ? e.couleur : COULEURS.bordure}`,
              background: i <= indexEtape ? `${e.couleur}22` : 'transparent',
              color: i <= indexEtape ? e.couleur : COULEURS.texteFaible,
            }}
          >
            {e.label[0]}
          </button>
        ))}
      </div>

      {ouverte && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ETAPES.map((e) => (
            <div key={e.id}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: e.couleur, marginBottom: 4 }}>{e.label}</label>
              <textarea
                value={brouillon[e.id === 'fragmenter' ? 'fragments' : e.id === 'assembler' ? 'assemblage' : e.id === 'injecter' ? 'injection' : 'amplification']}
                onChange={(ev) => {
                  const champ = e.id === 'fragmenter' ? 'fragments' : e.id === 'assembler' ? 'assemblage' : e.id === 'injecter' ? 'injection' : 'amplification';
                  setBrouillon((prev) => ({ ...prev, [champ]: ev.target.value }));
                }}
                placeholder={e.placeholder}
                rows={2}
                style={{ ...champStyle, resize: 'vertical', fontSize: 13 }}
              />
            </div>
          ))}
          <button
            type="button" onClick={enregistrer} disabled={enregistrement}
            style={{ fontSize: 13, padding: '9px 18px', borderRadius: 999, border: 'none', background: GRADIENT, color: 'white', fontWeight: 600, cursor: enregistrement ? 'default' : 'pointer', alignSelf: 'flex-start' }}
          >
            {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  );
}
