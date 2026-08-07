import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';

export const metadata = {
  title: 'Politique de confidentialité — Movement Practice Bordeaux',
  description: 'Politique de confidentialité et protection des données personnelles Movement Practice Bordeaux.',
};

const style = {
  section: { marginBottom: 28 },
  h2: { fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.5, margin: '0 0 10px' },
  p: { color: COULEURS.texteAtt, lineHeight: 1.6, margin: '0 0 8px' },
  li: { color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 6 },
};

export default function ConfidentialitePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 6vw, 44px)', letterSpacing: 0.5, margin: '0 0 32px' }}>
        POLITIQUE DE CONFIDENTIALITÉ
      </h1>

      <section style={style.section}>
        <h2 style={style.h2}>Qui traite tes données ?</h2>
        <p style={style.p}>
          Sylvain Noury, exerçant sous le nom Movement Practice Bordeaux, est responsable du traitement
          des données collectées sur ce site.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Quelles données sont collectées ?</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={style.li}>Email (identifiant de connexion, communication)</li>
          <li style={style.li}>Nom (si renseigné)</li>
          <li style={style.li}>Historique de réservations de cours</li>
          <li style={style.li}>Historique de paiements et factures</li>
        </ul>
        <p style={style.p}>
          Movement Practice Bordeaux ne stocke jamais de coordonnées bancaires : les paiements sont
          traités directement par Stripe.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Pourquoi ces données sont-elles collectées ?</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={style.li}>Gérer les réservations de cours et l'accès aux formules souscrites</li>
          <li style={style.li}>Émettre les factures</li>
          <li style={style.li}>Envoyer les emails nécessaires au service (connexion, rappels de cours)</li>
        </ul>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Qui a accès à ces données ?</h2>
        <p style={style.p}>
          Seul Sylvain Noury a accès à l'espace d'administration. Les données transitent par les
          prestataires techniques suivants, qui n'utilisent ces données que pour fournir leur service :
        </p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={style.li}><strong>Supabase</strong> — hébergement de la base de données et authentification</li>
          <li style={style.li}><strong>Stripe</strong> — traitement des paiements</li>
          <li style={style.li}><strong>Resend</strong> — envoi des emails transactionnels (connexion, rappels)</li>
          <li style={style.li}><strong>Vercel</strong> — hébergement du site</li>
        </ul>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Combien de temps ces données sont-elles conservées ?</h2>
        <p style={style.p}>
          Les données sont conservées le temps de la relation avec Movement Practice Bordeaux, puis
          archivées ou supprimées conformément aux durées légales (notamment comptables) applicables.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Cookies</h2>
        <p style={style.p}>
          Ce site n'utilise pas de cookies publicitaires ou de traceurs tiers. Seul un cookie de session,
          strictement nécessaire pour rester connecté à son espace personnel, est déposé — aucun
          consentement n'est requis pour ce type de cookie purement fonctionnel.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>Tes droits</h2>
        <p style={style.p}>
          Conformément au RGPD, tu disposes d'un droit d'accès, de rectification, de suppression et
          d'opposition concernant tes données personnelles. Pour l'exercer, écris à
          contact@movementpracticebordeaux.com. Tu peux aussi introduire une réclamation auprès de la
          CNIL (cnil.fr).
        </p>
      </section>

      <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginTop: 40 }}>Dernière mise à jour : août 2026.</p>
    </main>
  );
}
