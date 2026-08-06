import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { FORMULES } from '@/lib/formules';
import Temoignages, { Temoignage } from '../components/Temoignages';

export const metadata = {
  title: 'Mentorship — Formation Mouvement pour professionnels | Movement Practice Bordeaux',
  description:
    'Programme de Mentorship pour professionnels et passionnés du Mouvement à Bordeaux : comprendre, organiser et maîtriser une pratique de calisthenics, handstand et mobilité.',
  keywords: ['mentorship', 'formation mouvement', 'formation coach sportif', 'Bordeaux', 'calisthenics', 'handstand'],
};

const OBJECTIFS = [
  'Bâtir des fondations solides',
  'Comprendre, organiser, maîtriser',
  'Enseigner le mouvement',
];

const ETAPES = [
  {
    titre: '1. Comprendre',
    texte: "Une vision globale de l'univers du Mouvement, à travers ses différents secteurs. Apprendre à analyser et décomposer un mouvement pour mieux le comprendre et le reconstruire efficacement.",
  },
  {
    titre: '2. Organiser',
    texte: "La structure et l'organisation de la progression du pratiquant, à différentes échelles de temps, avec une méthodologie propre à Sylvain pour bâtir un plan de progression clair et cohérent.",
  },
  {
    titre: '3. Maîtriser',
    texte: "L'acquisition d'une vraie maîtrise des outils, de la méthode et des premiers objectifs du programme, en appliquant les connaissances acquises jusqu'aux premiers jalons fixés.",
  },
];

const EXPERTISE = [
  'Support théorique sur le Mouvement',
  "Support méthodologique de l'entraînement",
  'Accès au contenu vidéo online Amplitude',
  'Accès aux objectifs du Module 1',
  'Assistance vocale et vidéo avec Sylvain',
];

const TEMOIGNAGES_PRO: Temoignage[] = [
  {
    nom: 'Adrien, Bordeaux',
    note: 5,
    texte: "Coach sportif et maître nageur, actuellement en mentorship avec Sylvain : l'enseignement, les outils, la disponibilité, le partage et la bienveillance sont au rendez-vous. Une approche qui change durablement la façon de bouger.",
  },
  {
    nom: 'Paul, Bordeaux',
    note: 5,
    texte: "Sylvain aborde la pratique physique très différemment des schémas habituels : on travaille ses points faibles autant que ses acquis, avec des outils variés (balles, bâton, anneaux), dans la bonne humeur et la bienveillance, quel que soit le niveau.",
  },
  {
    nom: 'Koulouf, Normandie',
    note: 5,
    texte: "Deux ans de mentorship en présentiel qui m'ont permis de valider mon BPJEPS et de devenir coach en Mouvement. Sylvain ne donne pas seulement des réponses : il transmet une vraie méthode pour progresser seul, durablement.",
  },
  {
    nom: 'Jules, Bretagne',
    note: 5,
    texte: "Une année de mentorship avec un accès au contenu en ligne qui a renforcé mon autonomie et clarifié les compétences à développer. Sylvain a été très disponible et généreux dans ses réponses, un vrai accompagnement vers mon diplôme d'éducateur sportif.",
  },
];

const CLES_MENTORSHIP = ['mentorship', 'post_mentorship'];

export default function ProPage() {
  return (
    <main>
      {/* HERO */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: COULEURS.texteFaible, marginBottom: 16 }}>
          POUR PROFESSIONNELS &amp; PASSIONNÉS
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7.5vw, 56px)', lineHeight: 1.08, letterSpacing: 0.5, margin: '0 0 20px' }}>
          PROGRAMME <span style={GRADIENT_TEXTE}>MENTORSHIP</span>
        </h1>
        <p style={{ fontSize: 18, color: COULEURS.texteAtt, maxWidth: 560, margin: '0 auto' }}>
          Une recherche physique profonde du Mouvement, pour construire une vraie boîte à outils —
          utilisable dans ta pratique personnelle comme dans l'enseignement.
        </p>
      </section>

      {/* OBJECTIFS */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {OBJECTIFS.map((o) => (
            <div key={o} style={{ border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                <span style={GRADIENT_TEXTE}>✓</span> {o}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DESCRIPTIF */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>DESCRIPTIF</p>
        <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 12 }}>
          Le Mentorship propose une recherche physique profonde du Mouvement, pour fournir une boîte à
          outils utilisable dans diverses disciplines sportives de haut niveau comme dans un entraînement
          personnel.
        </p>
        <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6 }}>
          C'est une formation conçue pour les professionnels et les passionnés qui veulent approfondir
          leurs connaissances et compétences dans le domaine du Mouvement, avec ou sans objectif
          d'enseignement.
        </p>
      </section>

      {/* MÉTHODE EN 3 ÉTAPES */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 64px' }}>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, letterSpacing: 0.5, margin: '0 0 20px', textAlign: 'center' }}>
          Une progression en 3 étapes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {ETAPES.map((e) => (
            <div key={e.titre} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.5, margin: '0 0 10px' }}>{e.titre}</h3>
              <p style={{ color: COULEURS.texteAtt, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EXPERTISE & TARIFS */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>L'EXPERTISE DU MENTORAT</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EXPERTISE.map((e) => (
            <li key={e} style={{ color: COULEURS.texteAtt, fontSize: 14, display: 'flex', gap: 8 }}>
              <span style={GRADIENT_TEXTE}>✓</span> {e}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CLES_MENTORSHIP.map((cle) => {
            const f = FORMULES[cle];
            return (
              <a key={cle} href={`/tarifs#${cle}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COULEURS.bordure}`, padding: '8px 0', fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
                <span>{f.nom}</span>
                <span style={{ color: '#FF2D78', fontWeight: 600 }}>{f.prixIndicatif} € →</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <Temoignages items={TEMOIGNAGES_PRO} titre="TÉMOIGNAGES — MENTORSHIP" />

      {/* CTA */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/tarifs#mentorship" style={{ background: GRADIENT, color: 'white', fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
            S'inscrire au Mentorship
          </a>
          <a href="mailto:contact@movementpracticebordeaux.com?subject=Question%20Mentorship" style={{ border: `1px solid ${COULEURS.bordure}`, color: COULEURS.texte, fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
            Me contacter
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COULEURS.bordure}`, padding: '32px 20px', fontSize: 13, color: COULEURS.texteFaible }}>
        <p style={{ margin: '0 0 6px' }}>Movement Practice Bordeaux — Darwin écosystème, 87 Quai des Queyries, 33100 Bordeaux</p>
        <p style={{ margin: 0 }}>Lun · Mer · Ven, 9h–21h</p>
      </footer>
    </main>
  );
}
