import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { MENTORAT_OUVERT, MENTORAT_PLACES_PAR_SESSION, FORMULES } from '@/lib/formules';

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

const BRANCHES_PRESENTATION = [
  { titre: 'Force', texte: 'Travail de la force du haut du corps, avec les anneaux de gymnastique.' },
  { titre: 'Figures', texte: 'Travail des figures en équilibre, sur les mains ou sur les coudes.' },
  { titre: 'Locomotion', texte: 'Apprentissage des déplacements au sol — un mélange de force, de mobilité et de coordination.' },
  { titre: 'Connexion', texte: "Travail d'habileté et de coordination, avec des jeux de manipulation d'objets." },
  { titre: 'Flexibilité', texte: 'Travail de mobilité active du bas du corps.' },
];

const METHODOLOGIE = [
  {
    titre: 'Comprendre, pas seulement exécuter',
    texte: "Un contenu théorique t'accompagne à chaque étape : pourquoi ce mouvement fonctionne, comment il se construit, ce qu'il prépare. Tu ne reproduis pas un exercice, tu comprends ce que tu fais.",
  },
  {
    titre: 'Apprendre à structurer ta pratique',
    texte: "Au-delà des mouvements eux-mêmes, le Mentorat transmet une méthodologie pour apprendre à s'entraîner : comment organiser ses séances, doser l'effort, identifier ses priorités du moment.",
  },
  {
    titre: 'Des domaines qui se nourrissent entre eux',
    texte: "Force, figures, locomotion, connexion, flexibilité : ces domaines ne se travaillent pas en silos. Chacun renforce les autres, et la méthode t'apprend à voir ces liens plutôt qu'à cocher des cases séparément.",
  },
];

const FONCTIONNEMENT = [
  {
    titre: 'Des fondations avant tout',
    texte: "Trois niveaux de fondations sur l'ensemble du corps se valident en entier avant que les cinq thématiques de spécialisation ne s'ouvrent. Pas de raccourci : la base doit être solide.",
  },
  {
    titre: 'Ma validation personnelle',
    texte: 'Chaque étape franchie l\'est à partir d\'une vidéo que tu soumets, que je regarde et commente moi-même — pas un algorithme, pas un contenu générique.',
  },
  {
    titre: 'Des échanges cadrés',
    texte: 'Tout passe par la plateforme (soumission vidéo + commentaire dédié). Les validations sont traitées de façon groupée chaque semaine, avec un délai de réponse maximum de 5 jours ouvrés.',
  },
  {
    titre: 'Un volume volontairement limité',
    texte: `${MENTORAT_PLACES_PAR_SESSION} places par session, pour que chaque validation reçoive une vraie attention plutôt qu'un traitement de masse.`,
  },
];

const CLES_MENTORAT = ['mentorship_3', 'mentorship_6', 'mentorship_12'];

export default function MentoratPage() {
  return (
    <main>
      {/* HERO */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: COULEURS.texteFaible, marginBottom: 16 }}>
          ACCOMPAGNEMENT PERSONNEL — PLACES LIMITÉES
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7.5vw, 56px)', lineHeight: 1.08, letterSpacing: 0.5, margin: '0 0 20px' }}>
          LE <span style={GRADIENT_TEXTE}>MENTORAT</span>
        </h1>
        <p style={{ fontSize: 18, color: COULEURS.texteAtt, maxWidth: 560, margin: '0 auto' }}>
          Un accompagnement personnel et structuré pour progresser en profondeur en calisthenics,
          handstand, mobilité et locomotion — avec un retour direct de mon regard de coach à chaque
          étape validée.
        </p>
      </section>

      {/* CE QUE C'EST */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 56px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10, textAlign: 'center' }}>
          CE N'EST PAS UNE BIBLIOTHÈQUE DE VIDÉOS
        </p>
        <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          Le Mentorat est un parcours de progression structuré, pensé pour une pratique sérieuse et
          durable — pas une reconversion rapide, pas une formation vers l'enseignement. C'est un
          accompagnement pour qui veut construire une vraie base et progresser en profondeur, à son
          rythme, débutant comme pratiquant confirmé.
        </p>
      </section>

      {/* MÉTHODOLOGIE / FORCE THÉORIQUE */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 56px' }}>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 26, letterSpacing: 0.5, margin: '0 0 20px', textAlign: 'center' }}>
          Une méthode, pas juste des exercices
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {METHODOLOGIE.map((m) => (
            <div key={m.titre} style={{ display: 'flex', gap: 14 }}>
              <span style={{ ...GRADIENT_TEXTE, fontFamily: POLICE_DISPLAY, fontSize: 20, lineHeight: 1.3, flexShrink: 0 }}>—</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{m.titre}</h3>
                <p style={{ fontSize: 14, color: COULEURS.texteAtt, margin: 0, lineHeight: 1.6 }}>{m.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARBRE DE COMPÉTENCES */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 56px' }}>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 26, letterSpacing: 0.5, margin: '0 0 12px', textAlign: 'center' }}>
          Cinq thématiques de travail
        </h2>
        <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, textAlign: 'center', maxWidth: 560, margin: '0 auto 24px' }}>
          Le programme commence par un socle de fondations complet pour tout le corps, avant de s'ouvrir
          vers cinq axes de spécialisation :
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {BRANCHES_PRESENTATION.map((b) => (
            <div key={b.titre} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 18, background: COULEURS.surface }}>
              <h3 style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.3, margin: '0 0 6px', ...GRADIENT_TEXTE }}>
                {b.titre}
              </h3>
              <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: 0, lineHeight: 1.5 }}>{b.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 56px' }}>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 26, letterSpacing: 0.5, margin: '0 0 20px', textAlign: 'center' }}>
          Comment ça fonctionne
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FONCTIONNEMENT.map((f) => (
            <div key={f.titre} style={{ display: 'flex', gap: 14 }}>
              <span style={{ ...GRADIENT_TEXTE, fontFamily: POLICE_DISPLAY, fontSize: 20, lineHeight: 1.3, flexShrink: 0 }}>—</span>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{f.titre}</h3>
                <p style={{ fontSize: 14, color: COULEURS.texteAtt, margin: 0, lineHeight: 1.6 }}>{f.texte}</p>
              </div>
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
              <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.3, margin: '0 0 16px' }}>
                {MENTORAT_PLACES_PAR_SESSION} places par session
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                {CLES_MENTORAT.map((cle) => (
                  <div key={cle} style={{ fontSize: 14, color: COULEURS.texteAtt }}>
                    <span style={{ display: 'block', fontFamily: POLICE_DISPLAY, fontSize: 22, ...GRADIENT_TEXTE }}>
                      {FORMULES[cle].prixIndicatif} €
                    </span>
                    {FORMULES[cle].nom.replace('Mentorat — ', '')}
                  </div>
                ))}
              </div>
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
