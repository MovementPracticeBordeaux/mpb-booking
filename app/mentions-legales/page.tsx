import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';

export const metadata = {
  title: 'Mentions légales — Movement Practice Bordeaux',
  description: 'Mentions légales du site Movement Practice Bordeaux.',
};

const style = {
  section: { marginBottom: 28 },
  h2: { fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.5, margin: '0 0 10px' },
  p: { color: COULEURS.texteAtt, lineHeight: 1.6, margin: '0 0 8px' },
};

export default function MentionsLegalesPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 6vw, 44px)', letterSpacing: 0.5, margin: '0 0 32px' }}>
        MENTIONS LÉGALES
      </h1>

      <section style={style.section}>
        <h2 style={style.h2}>Éditeur du site</h2>
        <p style={style.p}>
          Le site movementpracticebordeaux.com est édité par Sylvain Noury, entrepreneur individuel
          (auto-entrepreneur), exerçant sous le nom commercial Movement Practice Bordeaux.
        </p>
        <p style={style.p}>Adresse : 36 rue Édouard Mayaudon, Bordeaux, France</p>
        <p style={style.p}>SIRET : [à compléter]</p>
        <p style={style.p}>Email : contact@movementpracticebordeaux.com</p>
        <p style={style.p}>Téléphone : 06 20 47 70 64</p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Directeur de la publication</h2>
        <p style={style.p}>Sylvain Noury.</p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Hébergement du site</h2>
        <p style={style.p}>
          Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Site web : vercel.com
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Propriété intellectuelle</h2>
        <p style={style.p}>
          L'ensemble du contenu de ce site (textes, photographies, logo, éléments graphiques) est la
          propriété de Sylvain Noury / Movement Practice Bordeaux, sauf mention contraire. Toute
          reproduction, même partielle, sans autorisation préalable est interdite.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Liens hypertextes</h2>
        <p style={style.p}>
          Ce site peut contenir des liens vers d'autres sites (réseaux sociaux, prestataires). Movement
          Practice Bordeaux n'est pas responsable du contenu de ces sites tiers.
        </p>
      </section>

      <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginTop: 40 }}>Dernière mise à jour : août 2026.</p>
    </main>
  );
}
