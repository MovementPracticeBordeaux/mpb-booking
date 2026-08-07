import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

export const metadata = {
  title: 'Contact — Movement Practice Bordeaux',
  description: 'Contacte Movement Practice Bordeaux : coach calisthenics, handstand et mobilité à Bordeaux. Adresse, horaires et réseaux sociaux.',
  keywords: ['contact', 'Movement Practice Bordeaux', 'Bordeaux', 'calisthenics', 'handstand', 'mobilité'],
  openGraph: {
    title: 'Contact — Movement Practice Bordeaux',
    description: 'Adresse, horaires, téléphone et réseaux sociaux de Movement Practice Bordeaux.',
    url: '/contact',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Movement Practice Bordeaux' }],
  },
};

export default function ContactPage() {
  return (
    <main>
      {/* HERO */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: COULEURS.texteFaible, marginBottom: 16 }}>
          UNE QUESTION ?
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7.5vw, 56px)', lineHeight: 1.08, letterSpacing: 0.5, margin: '0 0 20px' }}>
          NOUS <span style={GRADIENT_TEXTE}>CONTACTER</span>
        </h1>
        <p style={{ fontSize: 18, color: COULEURS.texteAtt, maxWidth: 520, margin: '0 auto' }}>
          N'hésite pas à me contacter si tu souhaites plus d'informations, via le chat en bas de page ou
          directement par email. Je suis à ton écoute — Sylvain
        </p>
      </section>

      {/* CTA EMAIL */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px', textAlign: 'center' }}>
        <a
          href="mailto:contact@movementpracticebordeaux.com?subject=Question%20depuis%20le%20site"
          style={{ display: 'inline-block', background: GRADIENT, color: 'white', fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}
        >
          ✉️ M'écrire par email
        </a>
      </section>

      {/* COORDONNÉES */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>COORDONNÉES</p>
        <div style={{ border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, borderRadius: 14, padding: 20 }}>
          <p style={{ margin: '0 0 8px', color: COULEURS.texte }}>Movement Practice Bordeaux</p>
          <p style={{ margin: '0 0 8px', color: COULEURS.texteAtt }}>Darwin écosystème, 87 Quai des Queyries, 33100 Bordeaux</p>
          <p style={{ margin: '0 0 8px', color: COULEURS.texteAtt }}>Lun · Mer · Ven, 9h–21h</p>
          <p style={{ margin: '0 0 8px' }}>
            <a href="tel:+33620477064" style={{ color: COULEURS.texte, textDecoration: 'none' }}>06 20 47 70 64</a>
          </p>
          <a href="https://www.instagram.com/movement_practice_bordeaux/" target="_blank" rel="noopener noreferrer" style={{ color: '#FF2D78', textDecoration: 'none', fontWeight: 600 }}>
            @movement_practice_bordeaux sur Instagram →
          </a>
        </div>
      </section>

      {/* LOCALISATION */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>OÙ NOUS TROUVER</p>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${COULEURS.bordure}` }}>
          <iframe
            title="Movement Practice Bordeaux sur Google Maps"
            src="https://www.google.com/maps?q=Movement+practice+Bordeaux&output=embed"
            width="100%"
            height="320"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
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
