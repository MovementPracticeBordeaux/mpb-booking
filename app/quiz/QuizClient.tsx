'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

// --- Données du quiz -------------------------------------------------

const NIVEAUX_SPORTIFS = [
  { id: 'pas_sportif', label: 'Pas sportif du tout' },
  { id: 'occasionnel', label: 'Sportif occasionnel' },
  { id: 'assez_sportif', label: 'Assez sportif' },
  { id: 'tres_sportif', label: 'Très sportif' },
] as const;

const NIVEAUX_DOULEUR = [
  { id: 'aucune', label: 'Aucune douleur, aucune gêne' },
  { id: 'petite_gene', label: "Une petite gêne occasionnelle, ça n'empêche pas de bouger" },
  { id: 'douleur_limitante', label: 'Une douleur qui limite clairement certains mouvements' },
  { id: 'blessure_serieuse', label: 'Une blessure ou pathologie sérieuse, en cours de soin' },
] as const;

const GOUTS = [
  { id: 'challenge', label: 'Le challenge, se dépasser techniquement' },
  { id: 'creativite', label: "La créativité, l'exploration du mouvement" },
  { id: 'jeux_balle', label: 'Les jeux de balle, la coordination ludique' },
  { id: 'construction', label: 'La construction physique, structurée et progressive' },
  { id: 'amplitude', label: 'La mobilité et le travail en profondeur, un travail exigeant' },
] as const;

const OBJECTIFS = [
  { id: 'force', label: 'Prendre de la force' },
  { id: 'perte_poids', label: 'Perdre du poids, me remettre en forme' },
  { id: 'decouvrir', label: 'Découvrir mes capacités' },
  { id: 'explorer', label: 'Explorer le monde du mouvement' },
  { id: 'bien_etre', label: "Un système qui s'adapte — force, mobilité, coordination, engagement" },
] as const;

const DISCIPLINES: Record<string, { titre: string; description: string }> = {
  Handstand: { titre: 'Handstand', description: 'Équilibre sur les mains — technique fine, progression méthodique.' },
  'Arm Balance': { titre: 'Arm Balance', description: 'Équilibres sur les bras — force, précision, contrôle.' },
  Calisthenics: { titre: 'Calisthenics', description: 'Construction de force au poids du corps, structurée et progressive.' },
  Locomotion: { titre: 'Locomotion', description: 'Déplacements au sol — exploration et créativité du mouvement.' },
  Altinha: { titre: 'Altinha', description: 'Jeux de balle au pied — coordination, plaisir du jeu, esprit d\'équipe.' },
  Mobilité: { titre: 'Mobilité', description: 'Stretch actif et renforcement en grande amplitude — exigeant et énergivore, loin d\'un cours doux.' },
};

const SCORE_GOUTS: Record<string, Record<string, number>> = {
  challenge: { Handstand: 3, 'Arm Balance': 3, Calisthenics: 1 },
  creativite: { Locomotion: 3 },
  jeux_balle: { Altinha: 3 },
  construction: { Calisthenics: 3, Handstand: 1 },
  amplitude: { Mobilité: 3 },
};

const SCORE_OBJECTIFS: Record<string, Record<string, number>> = {
  force: { Calisthenics: 2, Handstand: 1, 'Arm Balance': 1 },
  perte_poids: { Calisthenics: 2, Locomotion: 1 },
  decouvrir: { Handstand: 1, 'Arm Balance': 1, Locomotion: 1, Altinha: 1 },
  explorer: { Locomotion: 3, Altinha: 1 },
  bien_etre: { Mobilité: 2, Locomotion: 2, Altinha: 1, Calisthenics: 1 },
};

type Reponses = {
  bordeaux: boolean | null;
  niveauSportif: string | null;
  douleur: string | null;
  gouts: string[];
  objectifs: string[];
};

const REPONSES_INITIALES: Reponses = {
  bordeaux: null,
  niveauSportif: null,
  douleur: null,
  gouts: [],
  objectifs: [],
};

// --- Composant --------------------------------------------------------

export default function QuizClient() {
  const [etape, setEtape] = useState<'intro' | 'bordeaux' | 'sportif' | 'douleur' | 'gouts' | 'objectifs' | 'resultat'>('intro');
  const [reponses, setReponses] = useState<Reponses>(REPONSES_INITIALES);

  const douleurImportante = reponses.douleur === 'douleur_limitante' || reponses.douleur === 'blessure_serieuse';

  function toggleDansListe(liste: string[], id: string): string[] {
    return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
  }

  function classementDisciplines(): string[] {
    const scores: Record<string, number> = {};
    for (const g of reponses.gouts) {
      for (const [d, pts] of Object.entries(SCORE_GOUTS[g] ?? {})) scores[d] = (scores[d] ?? 0) + pts;
    }
    for (const o of reponses.objectifs) {
      for (const [d, pts] of Object.entries(SCORE_OBJECTIFS[o] ?? {})) scores[d] = (scores[d] ?? 0) + pts;
    }
    return Object.entries(scores)
      .filter(([, pts]) => pts > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([d]) => d);
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px', minHeight: '70vh' }}>
      {etape === 'intro' && (
        <div>
          <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 8vw, 40px)', lineHeight: 1.08, letterSpacing: 0.5, margin: '0 0 16px', ...GRADIENT_TEXTE }}>
            Quel cours te correspond ?
          </h1>
          <p style={{ color: COULEURS.texteAtt, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            Cinq questions rapides pour te proposer les disciplines les plus adaptées à ton profil et tes envies.
          </p>
          <BoutonPrincipal onClick={() => setEtape('bordeaux')}>Commencer</BoutonPrincipal>
        </div>
      )}

      {etape === 'bordeaux' && (
        <Question titre="Es-tu à Bordeaux, ou peux-tu t'y déplacer régulièrement ?">
          <Choix label="Oui, je suis sur Bordeaux ou à proximité" onClick={() => { setReponses((r) => ({ ...r, bordeaux: true })); setEtape('sportif'); }} />
          <Choix label="Non, je ne peux pas me déplacer régulièrement" onClick={() => { setReponses((r) => ({ ...r, bordeaux: false })); setEtape('resultat'); }} />
        </Question>
      )}

      {etape === 'sportif' && (
        <Question titre="Comment tu te définirais aujourd'hui ?">
          {NIVEAUX_SPORTIFS.map((n) => (
            <Choix key={n.id} label={n.label} onClick={() => { setReponses((r) => ({ ...r, niveauSportif: n.id })); setEtape('douleur'); }} />
          ))}
        </Question>
      )}

      {etape === 'douleur' && (
        <Question titre="As-tu une douleur ou une blessure actuellement ?">
          {NIVEAUX_DOULEUR.map((n) => (
            <Choix key={n.id} label={n.label} onClick={() => { setReponses((r) => ({ ...r, douleur: n.id })); setEtape(n.id === 'douleur_limitante' || n.id === 'blessure_serieuse' ? 'resultat' : 'gouts'); }} />
          ))}
        </Question>
      )}

      {etape === 'gouts' && (
        <QuestionMultiple
          titre="Qu'est-ce qui t'attire le plus ? (plusieurs réponses possibles)"
          options={GOUTS}
          selection={reponses.gouts}
          onToggle={(id) => setReponses((r) => ({ ...r, gouts: toggleDansListe(r.gouts, id) }))}
          onValider={() => setEtape('objectifs')}
        />
      )}

      {etape === 'objectifs' && (
        <QuestionMultiple
          titre="Qu'est-ce que tu recherches ? (plusieurs réponses possibles)"
          options={OBJECTIFS}
          selection={reponses.objectifs}
          onToggle={(id) => setReponses((r) => ({ ...r, objectifs: toggleDansListe(r.objectifs, id) }))}
          onValider={() => setEtape('resultat')}
          libelleBouton="Voir mon résultat"
        />
      )}

      {etape === 'resultat' && (
        <Resultat
          bordeaux={reponses.bordeaux}
          douleurImportante={douleurImportante}
          disciplines={classementDisciplines()}
          onRecommencer={() => { setReponses(REPONSES_INITIALES); setEtape('intro'); }}
        />
      )}
    </main>
  );
}

// --- Sous-composants ----------------------------------------------------

function BoutonPrincipal({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: GRADIENT, color: 'white', border: 'none', borderRadius: 999,
        padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Question({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 26, letterSpacing: 0.3, margin: '0 0 20px', color: COULEURS.texte }}>
        {titre}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Choix({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`,
        borderRadius: 10, padding: '14px 18px', color: COULEURS.texte, fontSize: 15, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function QuestionMultiple({
  titre, options, selection, onToggle, onValider, libelleBouton = 'Continuer',
}: {
  titre: string;
  options: readonly { id: string; label: string }[];
  selection: string[];
  onToggle: (id: string) => void;
  onValider: () => void;
  libelleBouton?: string;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 26, letterSpacing: 0.3, margin: '0 0 20px', color: COULEURS.texte }}>
        {titre}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {options.map((o) => {
          const actif = selection.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => onToggle(o.id)}
              style={{
                textAlign: 'left', background: actif ? 'rgba(255,45,120,0.12)' : COULEURS.surface,
                border: `1px solid ${actif ? '#FF2D78' : COULEURS.bordure}`,
                borderRadius: 10, padding: '14px 18px', color: COULEURS.texte, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 5, border: `2px solid ${actif ? '#FF2D78' : COULEURS.texteFaible}`,
                background: actif ? '#FF2D78' : 'transparent', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>
                {actif ? '✓' : ''}
              </span>
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
      <BoutonPrincipal onClick={onValider}>{libelleBouton}</BoutonPrincipal>
      {selection.length === 0 && (
        <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginTop: 8 }}>Sélectionne au moins une réponse pour continuer.</p>
      )}
    </div>
  );
}

function Resultat({
  bordeaux, douleurImportante, disciplines, onRecommencer,
}: {
  bordeaux: boolean | null;
  douleurImportante: boolean;
  disciplines: string[];
  onRecommencer: () => void;
}) {
  if (bordeaux === false) {
    return (
      <div>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 30, letterSpacing: 0.3, margin: '0 0 16px', ...GRADIENT_TEXTE }}>
          Le Mentorat te correspond
        </h2>
        <p style={{ color: COULEURS.texteAtt, fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
          Comme tu ne peux pas te déplacer régulièrement sur Bordeaux, le Mentorat est la formule adaptée : un
          accompagnement structuré et personnalisé, à distance, avec un retour direct sur tes vidéos à chaque étape validée.
        </p>
        <Link href="/mentorat" style={styleLienBouton}>Découvrir le Mentorat</Link>
      </div>
    );
  }

  if (douleurImportante) {
    return (
      <div>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 30, letterSpacing: 0.3, margin: '0 0 16px', ...GRADIENT_TEXTE }}>
          Le Coaching individuel te correspond
        </h2>
        <p style={{ color: COULEURS.texteAtt, fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
          Avec une douleur ou une blessure qui limite tes mouvements, mieux vaut démarrer en individuel : le programme
          s'adapte précisément à ta situation, en toute sécurité, avant d'envisager les cours collectifs si tu le souhaites.
        </p>
        <Link href="/coaching" style={styleLienBouton}>Découvrir le Coaching</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 30, letterSpacing: 0.3, margin: '0 0 8px', ...GRADIENT_TEXTE }}>
        Voici ce qui te correspond
      </h2>
      <p style={{ color: COULEURS.texteAtt, fontSize: 15, marginBottom: 24 }}>
        D'après tes réponses, ces disciplines te correspondent particulièrement :
      </p>

      {disciplines.length === 0 ? (
        <p style={{ color: COULEURS.texteAtt, marginBottom: 24 }}>
          Tous les cours peuvent te convenir — le plus simple est de venir essayer avec le cours découverte.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {disciplines.map((d, i) => (
            <div key={d} style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#FF2D78', fontWeight: 700 }}>{i === 0 ? '★ RECOMMANDÉ EN PRIORITÉ' : `#${i + 1}`}</p>
              <p style={{ margin: '4px 0 6px', fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.3, color: COULEURS.texte }}>
                {DISCIPLINES[d]?.titre ?? d}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: COULEURS.texteAtt, lineHeight: 1.5 }}>{DISCIPLINES[d]?.description}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: COULEURS.texteAtt, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
        Le meilleur moyen de te faire un vrai avis : viens essayer avec le <strong>cours découverte</strong>, sans engagement.
      </p>
      <Link href="/tarifs" style={styleLienBouton}>Voir le cours découverte</Link>

      <div style={{ marginTop: 24 }}>
        <button onClick={onRecommencer} style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
          Refaire le quiz
        </button>
      </div>
    </div>
  );
}

const styleLienBouton: React.CSSProperties = {
  display: 'inline-block', background: GRADIENT, color: 'white', textDecoration: 'none',
  borderRadius: 999, padding: '14px 32px', fontSize: 16, fontWeight: 600,
};
