import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { FORMULES } from '@/lib/formules';
import Temoignages, { Temoignage } from '../components/Temoignages';

export const metadata = {
  title: 'Coaching calisthenics, handstand & mobilité à Bordeaux | MPB',
  description:
    'Coaching calisthenics, handstand et mobilité à Bordeaux, en présentiel ou en ligne. Programmes personnalisés et progression tous niveaux avec Sylvain Noury.',
  keywords: ['coaching calisthenics', 'coaching handstand', 'coaching mobilité', 'Bordeaux', 'coaching en ligne', 'locomotion'],
  openGraph: {
    title: 'Coaching calisthenics, handstand & mobilité à Bordeaux',
    description: 'Coaching présentiel à Bordeaux ou en ligne, où que tu sois. Programmes personnalisés avec Sylvain Noury.',
    url: '/coaching',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Movement Practice Bordeaux' }],
  },
};

const ATOUTS_PRESENTIEL = [
  'Suivi individuel et attention complète',
  'Corrections directes en temps réel',
  'Ajustements technique, respiration, posture',
  'Travail sur la force, mobilité, équilibre, coordination',
  'Projet ciblé : handstand, locomotion, mobilité, renforcement',
  'Options variées de carnet',
];

const ATOUTS_ONLINE = [
  'Programme adapté à ton niveau, ton temps et tes objectifs',
  'Entraînements progressifs et thématiques',
  'Feedback individuel avec corrections techniques',
  'Planification mensuelle claire',
  'Validation des compétences (« mastering ») en fin de mois',
  'Motivation, autonomie et progression durable',
];

const FAQ_COACHING = [
  { q: "Est-ce adapté aux débutants ?", r: "Oui. Le coaching démarre à ton niveau actuel. Les séances permettent d'apprendre les bases calisthenics, handstand, mobilité et locomotion progressivement." },
  { q: "Quelle est la durée d'un programme ?", r: "Le programme fonctionne mensuellement. Chaque mois, tu reçois un plan d'entraînement adapté, des corrections et des objectifs." },
  { q: 'Que contient le coaching online ?', r: 'Un planning hebdomadaire, des tutos vidéo, des corrections techniques, un feedback par message ou vidéo, et une progression mensuelle avec des exercices individualisés.' },
  { q: 'Comment réserver une séance ou un programme ?', r: 'En choisissant directement une formule sur la page Tarifs — le paiement se fait en ligne et tu es ensuite mis en relation avec Sylvain pour caler ton créneau.' },
];

const CLES_PRESENTIEL = ['coaching_unite', 'coaching_carnet_4h', 'coaching_carnet_3h'];

const TEMOIGNAGES_COACHING: Temoignage[] = [
  {
    nom: 'Stéphane, Toulouse',
    note: 5,
    texte: "J'ai beaucoup apprécié ces 6 mois de mouvement Online avec Sylvain. En quelques semaines j'ai ressenti des progrès surtout en souplesse. L'accompagnement est vraiment parfait, sensible à l'état de forme et disponible.",
  },
  {
    nom: 'Salomé, Bretagne',
    note: 5,
    texte: "Inscrite au coaching en ligne de Sylvain depuis quelques mois et ravie de l'être ! Son enseignement précis, varié et rigoureux éveille la curiosité dans l'apprentissage tout en construisant des bases solides pour évoluer dans sa pratique.",
  },
  {
    nom: 'Manex, Pays Basque',
    note: 5,
    texte: "J'ai rejoint la communauté en ligne après avoir assisté à un workshop avec Sylvain. Très bonne méthode pour ceux qui ne peuvent pas assister aux cours à Bordeaux : bien organisé, tutoriels clairs, grande disponibilité pour répondre aux questions.",
  },
];

export default function CoachingPage() {
  return (
    <main>
      <style>{`
        .img-coaching { width: 240px; height: 300px; display: block; }
        @media (max-width: 640px) {
          .img-coaching { width: 100% !important; max-width: 340px; height: 360px !important; margin: 0 auto; }
        }
      `}</style>

      {/* HERO */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: COULEURS.texteFaible, marginBottom: 16 }}>
          COACHING INDIVIDUEL &amp; PROGRAMMES EN LIGNE
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7.5vw, 56px)', lineHeight: 1.08, letterSpacing: 0.5, margin: '0 0 20px' }}>
          COACHING CALISTHENICS, HANDSTAND &amp; <span style={GRADIENT_TEXTE}>MOBILITÉ</span>
        </h1>
        <p style={{ fontSize: 18, color: COULEURS.texteAtt, maxWidth: 560, margin: '0 auto' }}>
          Présentiel à Bordeaux ou online, où que tu sois : un accompagnement individuel pour progresser
          en calisthenics, handstand, mobilité et locomotion, à ton rythme et selon ton objectif.
        </p>
      </section>

      {/* COACHING PRÉSENTIEL */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 64px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <img
          src="/coaching-presentiel.jpg"
          alt="Coaching présentiel calisthenics à Bordeaux, Sylvain avec un élève"
          className="img-coaching"
          style={{ objectFit: 'cover', borderRadius: 16, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>EN PRÉSENTIEL, À BORDEAUX</p>
          <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, letterSpacing: 0.5, margin: '0 0 16px' }}>
            Coaching présentiel
          </h2>
          <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 16 }}>
            Séances individuelles à Bordeaux, adaptées à ton profil et ton objectif : remise en forme,
            force, mobilité, handstand, locomotion ou projet spécifique. Une heure dédiée, avec
            observation, corrections techniques et retour instantané pour progresser plus vite.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ATOUTS_PRESENTIEL.map((a) => (
              <li key={a} style={{ color: COULEURS.texteAtt, fontSize: 14, display: 'flex', gap: 8 }}>
                <span style={GRADIENT_TEXTE}>✓</span> {a}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CLES_PRESENTIEL.map((cle) => {
              const f = FORMULES[cle];
              return (
                <a key={cle} href={`/tarifs#${cle}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COULEURS.bordure}`, padding: '8px 0', fontSize: 14, textDecoration: 'none', color: 'inherit' }}>
                  <span>{f.nom}</span>
                  <span style={{ color: '#FF2D78', fontWeight: 600 }}>{f.prixIndicatif} € →</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* COACHING ONLINE */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 64px', display: 'flex', gap: 32, flexWrap: 'wrap-reverse', alignItems: 'center' }}>
        <img
          src="/coaching-online.png"
          alt="Élève suivant un programme de coaching en ligne Movement Practice Bordeaux"
          className="img-coaching"
          style={{ objectFit: 'cover', borderRadius: 16, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>OÙ QUE TU SOIS</p>
          <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, letterSpacing: 0.5, margin: '0 0 16px' }}>
            Coaching Online
          </h2>
          <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 16 }}>
            Où que tu sois dans le monde, un accompagnement à distance : chaque mois, un programme
            personnalisé selon ton objectif (remise en forme, mobilité, renforcement, handstand,
            locomotion), livré via une application dédiée avec tutoriels vidéo et feedback direct.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ATOUTS_ONLINE.map((a) => (
              <li key={a} style={{ color: COULEURS.texteAtt, fontSize: 14, display: 'flex', gap: 8 }}>
                <span style={GRADIENT_TEXTE}>✓</span> {a}
              </li>
            ))}
          </ul>
          <a href="/tarifs#coaching_online" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COULEURS.bordure}`, padding: '8px 0', fontSize: 14, maxWidth: 320, textDecoration: 'none', color: 'inherit' }}>
            <span>{FORMULES.coaching_online.nom}</span>
            <span style={{ color: '#FF2D78', fontWeight: 600 }}>{FORMULES.coaching_online.prixIndicatif} € / mois →</span>
          </a>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <Temoignages items={TEMOIGNAGES_COACHING} titre="TÉMOIGNAGES — COACHING ONLINE" />

      {/* MENTORSHIP TEASER */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, borderRadius: 16, padding: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>POUR ALLER PLUS LOIN</p>
          <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 26, letterSpacing: 0.5, margin: '0 0 12px' }}>
            Programme Mentorship
          </h2>
          <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 20px' }}>
            Une formation pensée pour les passionnés et les professionnels qui veulent construire et
            comprendre en profondeur une pratique du mouvement, dans une optique d'enseignement ou non.
          </p>
          <a href="/pro" style={{ display: 'inline-block', color: '#FF2D78', textDecoration: 'none', fontWeight: 600 }}>
            Voir le programme Mentorship →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/tarifs" style={{ background: GRADIENT, color: 'white', fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
            Voir tous les tarifs
          </a>
          <a href="/profil" style={{ border: `1px solid ${COULEURS.bordure}`, color: COULEURS.texte, fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
            Déjà élève ? Mon suivi coaching
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, letterSpacing: 0.5, margin: '0 0 16px' }}>FAQ Coaching</h2>
        {FAQ_COACHING.map((item) => (
          <details key={item.q} style={{ borderBottom: `1px solid ${COULEURS.bordure}`, padding: '14px 0' }}>
            <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{item.q}</summary>
            <p style={{ color: COULEURS.texteAtt, marginTop: 8, lineHeight: 1.5 }}>{item.r}</p>
          </details>
        ))}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COULEURS.bordure}`, padding: '32px 20px', fontSize: 13, color: COULEURS.texteFaible }}>
        <p style={{ margin: '0 0 6px' }}>Movement Practice Bordeaux — Darwin écosystème, 87 Quai des Queyries, 33100 Bordeaux</p>
        <p style={{ margin: 0 }}>Lun · Mer · Ven, 9h–21h</p>
      </footer>
    </main>
  );
}
