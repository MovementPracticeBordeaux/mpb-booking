import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import ApercuArbre from './ApercuArbre';
import { DOMAINE_COULEURS } from '@/lib/mentorship-modules';
import { MENTORAT_OUVERT, MENTORAT_PLACES_PAR_SESSION, FORMULES, FORMULES_MENTORAT_DUREE, FORMULE_MENTORAT_RECOMMANDEE } from '@/lib/formules';

export const metadata = {
  title: 'Mentorat — Calisthenics, Handstand, Locomotion & Mobilité | Movement Practice Bordeaux',
  description:
    "Le Mentorat de Movement Practice Bordeaux : un accompagnement personnel et structuré pour progresser en profondeur en calisthenics, handstand, mobilité et locomotion, avec la validation directe de Sylvain Noury.",
  keywords: ['mentorat', 'calisthenics', 'handstand', 'locomotion', 'mobilité', 'Bordeaux', 'Sylvain Noury'],
  openGraph: {
    title: 'Le Mentorat — Movement Practice Bordeaux',
    description: 'Un accompagnement personnel et structuré, en petit volume, avec un retour direct de mon regard de coach à chaque étape validée.',
    url: '/mentorat',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Movement Practice Bordeaux' }],
  },
};

const BRANCHES = [
  { cle: 'force', titre: 'Force', texte: 'La force du haut du corps, avec les anneaux de gymnastique.', cap: 'muscle-up aux anneaux, push-up unilatéral' },
  { cle: 'figures', titre: 'Figures', texte: 'Les figures en équilibre, sur les mains ou sur les coudes.', cap: 'handstand, pont haut, elbow lever straddle' },
  { cle: 'locomotion', titre: 'Locomotion', texte: 'Les déplacements au sol : un mélange de force, de mobilité et de coordination.', cap: 'QDR switch, lizard crawl, improvisation au sol' },
  { cle: 'connexion', titre: 'Connexion', texte: "L'habileté et la coordination, avec des jeux de manipulation d'objets.", cap: "des défis de manipulation d'objets et de coordination" },
  { cle: 'flexibilite', titre: 'Flexibilité', texte: 'La mobilité active du bas du corps.', cap: 'écarts en actif, squats unilatéraux, défis de squat, force en grande amplitude du bas du corps' },
] as const;

const POURQUOI = [
  { titre: 'Savoir quoi travailler', texte: "Pas une bibliothèque de vidéos à piocher au hasard : un chemin clair, étape par étape, du premier jour au plus avancé." },
  { titre: 'Comprendre ce que tu fais', texte: "À chaque étape, la théorie t'explique pourquoi le mouvement fonctionne, comment il se construit et ce qu'il prépare." },
  { titre: 'Être vu par un coach', texte: "Chaque étape se valide sur vidéo, que je regarde et commente moi-même. Pas d'algorithme, pas de contenu générique." },
];

const QUOTIDIEN = [
  { titre: 'Choisis ta priorité du jour', texte: "La séance se compose toute seule à partir de tes objectifs en cours. Tu décides de ce qui compte aujourd'hui." },
  { titre: "Fais l'essentiel", texte: "Une séance à durée fixe (60 minutes recommandées, réglable) : l'essentiel d'abord, le reste en bonus. 3 à 5 séances par semaine suffisent." },
  { titre: 'Note ce que tu fais', texte: 'Séries, répétitions, temps : ton suivi montre tes progrès, et ta régularité est récompensée.' },
  { titre: 'Envoie ta vidéo', texte: "Quand tu atteins l'objectif d'un exercice, tu m'envoies une vidéo. Je te réponds : validé, ou ce qu'il faut retravailler." },
];

const h2: React.CSSProperties = { fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 5vw, 30px)', letterSpacing: 0.5, margin: '0 0 10px', textAlign: 'center' };
const surtitre: React.CSSProperties = { fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, margin: '0 0 8px', textAlign: 'center', fontWeight: 600 };
const intro: React.CSSProperties = { color: COULEURS.texteAtt, lineHeight: 1.6, textAlign: 'center', maxWidth: 600, margin: '0 auto 28px' };

export default function MentoratPage() {
  return (
    <main>
      {/* 1. PROMESSE */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: COULEURS.texteFaible, marginBottom: 16 }}>
          ACCOMPAGNEMENT PERSONNEL · {MENTORAT_PLACES_PAR_SESSION} PLACES PAR SESSION
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7.5vw, 56px)', lineHeight: 1.08, letterSpacing: 0.5, margin: '0 0 20px' }}>
          LE <span style={GRADIENT_TEXTE}>MENTORAT</span>
        </h1>
        <p style={{ fontSize: 18, color: COULEURS.texteAtt, maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.5 }}>
          Un parcours guidé pour progresser en profondeur en calisthenics, handstand, mobilité et
          locomotion, à ton rythme, avec mon regard de coach à chaque étape.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#parcours" style={{ background: GRADIENT, color: 'white', fontWeight: 600, padding: '12px 24px', borderRadius: 999, textDecoration: 'none' }}>Découvrir le parcours</a>
          <a href="#tarifs" style={{ border: `1px solid ${COULEURS.bordure}`, color: COULEURS.texte, fontWeight: 600, padding: '12px 24px', borderRadius: 999, textDecoration: 'none' }}>Tarifs</a>
        </div>
      </section>

      {/* 2. POURQUOI */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={surtitre}>POURQUOI LE MENTORAT</p>
        <h2 style={{ ...h2, marginBottom: 24 }}>Une méthode, pas juste des exercices</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
          {POURQUOI.map((m) => (
            <div key={m.titre} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 18, background: COULEURS.surface }}>
              <h3 style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, margin: '0 0 8px', ...GRADIENT_TEXTE }}>{m.titre}</h3>
              <p style={{ fontSize: 14, color: COULEURS.texteAtt, margin: 0, lineHeight: 1.6 }}>{m.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. LE PARCOURS : l'arbre */}
      <section id="parcours" style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 64px', scrollMarginTop: 80 }}>
        <p style={surtitre}>LE PARCOURS</p>
        <h2 style={h2}>Ton <span style={GRADIENT_TEXTE}>arbre de compétences</span></h2>
        <p style={intro}>
          Toute ta pratique tient dans un arbre. Tu pars des racines, l'Armure Organique : trois niveaux de
          fondations pour tout le corps. Une fois validée, cinq branches s'ouvrent et grandissent ensemble,
          niveau par niveau. Débutant comme pratiquant confirmé, chacun suit ce chemin : si tu as déjà une
          bonne base, tu peux ouvrir toute l'Armure d'un coup et la valider à ton rythme.
        </p>
        <ApercuArbre />
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', marginTop: 32 }}>
          {BRANCHES.map((b) => (
            <div key={b.cle} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: DOMAINE_COULEURS[b.cle], flexShrink: 0, transform: 'translateY(1px)' }} />
              <p style={{ margin: 0, fontSize: 14, color: COULEURS.texteAtt, lineHeight: 1.5 }}>
                <strong style={{ color: DOMAINE_COULEURS[b.cle], fontWeight: 600 }}>{b.titre}</strong> · {b.texte}
                <span style={{ display: 'block', fontSize: 13, color: COULEURS.texteFaible, marginTop: 2 }}>Au bout du chemin : {b.cap}…</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AU QUOTIDIEN */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={surtitre}>AU QUOTIDIEN</p>
        <h2 style={h2}>Comment tu avances</h2>
        <p style={intro}>Chaque niveau de l'arbre se valide en quatre temps, au fil de tes séances.</p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {QUOTIDIEN.map((e, i) => (
            <li key={e.titre} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 16, background: COULEURS.surface }}>
              <span style={{ ...GRADIENT_TEXTE, fontFamily: POLICE_DISPLAY, fontSize: 22, lineHeight: 1.1, flexShrink: 0, width: 22, textAlign: 'center' }}>{i + 1}</span>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{e.titre}</span>
                <span style={{ display: 'block', fontSize: 14, color: COULEURS.texteAtt, lineHeight: 1.55 }}>{e.texte}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. LE CADRE */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 56px' }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', textAlign: 'center' }}>
          {[
            { fort: `${MENTORAT_PLACES_PAR_SESSION} places`, texte: 'par session, pour que chaque vidéo reçoive une vraie attention' },
            { fort: '5 jours ouvrés', texte: 'maximum pour mon retour, validations traitées chaque semaine' },
            { fort: 'Tout le parcours', texte: 'inclus quelle que soit la durée choisie : il s’ouvre au fil de ta progression' },
            { fort: 'Une plateforme', texte: 'pour la théorie, tes séances, ton suivi et nos échanges' },
          ].map((c) => (
            <div key={c.fort} style={{ padding: '14px 10px' }}>
              <span style={{ display: 'block', fontFamily: POLICE_DISPLAY, fontSize: 20, ...GRADIENT_TEXTE }}>{c.fort}</span>
              <span style={{ display: 'block', fontSize: 13, color: COULEURS.texteFaible, lineHeight: 1.5, marginTop: 4 }}>{c.texte}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TARIFS / CTA */}
      <section id="tarifs" style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, borderRadius: 16, padding: 28, textAlign: 'center' }}>
          {!MENTORAT_OUVERT ? (
            <>
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '0 0 10px' }}>
                Temporairement fermé aux nouvelles candidatures
              </p>
              <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
                Une refonte du programme est en cours. Réouverture prochainement — reviens bientôt, ou
                contacte-moi directement si tu veux être prévenu·e.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '0 0 20px' }}>
                {MENTORAT_PLACES_PAR_SESSION} places par session
              </p>

              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                {FORMULES_MENTORAT_DUREE.map((cle) => {
                  const f = FORMULES[cle];
                  const reco = cle === FORMULE_MENTORAT_RECOMMANDEE;
                  return (
                    <div key={cle} style={{ fontSize: 14, color: COULEURS.texteAtt, padding: '12px 16px', borderRadius: 12, border: `1px solid ${reco ? '#FF2D78' : 'transparent'}`, position: 'relative' }}>
                      {reco && <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: GRADIENT, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>Recommandé</span>}
                      <span style={{ display: 'block', fontFamily: POLICE_DISPLAY, fontSize: 22, ...GRADIENT_TEXTE }}>{f.prixIndicatif} €</span>
                      {f.nom.replace('Mentorat — ', '')}
                      <span style={{ display: 'block', fontSize: 12, color: COULEURS.texteFaible }}>soit {Math.round(f.prixIndicatif / (f.validiteMois ?? 1))} € / mois</span>
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: '0 0 20px' }}>Accès complet au parcours, quelle que soit la durée choisie.</p>
              <a
                href="/mentorat/candidature"
                style={{ display: 'inline-block', background: GRADIENT, color: 'white', fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}
              >
                Candidater au Mentorat →
              </a>
              <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginTop: 14, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                L'accès se fait sur candidature : quelques questions sur ton niveau et tes objectifs,
                pour s'assurer que le Mentorat correspond à ta démarche.
              </p>
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COULEURS.bordure}`, padding: '32px 20px', fontSize: 13, color: COULEURS.texteFaible }}>
        <p style={{ margin: '0 0 6px' }}>Movement Practice Bordeaux — Darwin écosystème, 87 Quai des Queyries, 33100 Bordeaux</p>
        <p style={{ margin: '0 0 10px' }}>Lun · Mer · Ven, 9h–21h</p>
        <p style={{ margin: 0, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/mentions-legales" style={{ color: 'inherit' }}>Mentions légales</a>
          <a href="/cgv" style={{ color: 'inherit' }}>CGV</a>
          <a href="/confidentialite" style={{ color: 'inherit' }}>Confidentialité</a>
        </p>
      </footer>
    </main>
  );
}
