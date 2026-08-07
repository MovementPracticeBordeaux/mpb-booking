import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';

export const metadata = {
  title: 'Conditions générales de vente — Movement Practice Bordeaux',
  description: 'Conditions générales de vente des cours, coaching et programmes Movement Practice Bordeaux.',
};

const style = {
  section: { marginBottom: 28 },
  h2: { fontFamily: POLICE_DISPLAY, fontSize: 22, letterSpacing: 0.5, margin: '0 0 10px' },
  p: { color: COULEURS.texteAtt, lineHeight: 1.6, margin: '0 0 8px' },
  li: { color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 6 },
};

export default function CGVPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 6vw, 44px)', letterSpacing: 0.5, margin: '0 0 32px' }}>
        CONDITIONS GÉNÉRALES DE VENTE
      </h1>

      <section style={style.section}>
        <h2 style={style.h2}>1. Objet</h2>
        <p style={style.p}>
          Les présentes CGV s'appliquent à toute réservation de cours collectifs, de séances de coaching
          individuel ou en ligne, et au programme Mentorship, proposés par Movement Practice Bordeaux via
          ce site.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>2. Formules et tarifs</h2>
        <p style={style.p}>
          Les formules disponibles (cours à l'unité, pass mensuels, carnets, coaching, Mentorship) et
          leurs tarifs en vigueur sont détaillés sur la page{' '}
          <a href="/tarifs" style={{ color: '#FF2D78' }}>Tarifs</a>. Sauf mention contraire, il s'agit de
          pass à durée de validité fixe, payés en une seule fois — pas d'abonnement à reconduction
          automatique.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>3. Paiement</h2>
        <p style={style.p}>
          Le paiement s'effectue en ligne par carte bancaire via Stripe, prestataire de paiement
          sécurisé. Movement Practice Bordeaux ne stocke aucune donnée bancaire.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>4. Réservation et annulation des cours collectifs</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={style.li}>La réservation d'un créneau est obligatoire pour participer à un cours collectif.</li>
          <li style={style.li}>
            Une réservation peut être annulée librement depuis l'espace personnel, jusqu'à 1h30 avant le
            début du cours. La séance est alors recréditée automatiquement sur le pass (sauf formule
            illimitée, qui ne décompte pas de séances).
          </li>
          <li style={style.li}>
            Passé ce délai de 1h30, l'annulation n'est plus possible depuis le site et la séance est due —
            contacter directement Sylvain pour un cas particulier.
          </li>
        </ul>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>5. Coaching individuel, coaching en ligne et Mentorship</h2>
        <p style={style.p}>
          Ces formules ne font pas l'objet d'une réservation de créneau sur le planning : après l'achat,
          l'élève est mis en relation directe avec Sylvain pour convenir des modalités (créneau, contenu,
          organisation).
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>6. Validité et expiration des pass</h2>
        <p style={style.p}>
          Chaque formule a une durée de validité propre (1, 3 ou 6 mois selon la formule, précisée sur la
          page Tarifs), au-delà de laquelle les séances non consommées ne sont plus utilisables.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>7. Remboursement</h2>
        <p style={style.p}>
          Les pass ne sont en principe pas remboursables une fois l'achat effectué, sauf décision
          exceptionnelle de Movement Practice Bordeaux (geste commercial, erreur de commande, empêchement
          médical justifié). Toute demande est à adresser directement à Sylvain.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>8. Droit de rétractation</h2>
        <p style={style.p}>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne
          s'applique pas aux prestations de services pleinement exécutées avant la fin du délai de
          rétractation et dont l'exécution a commencé après accord préalable exprès du consommateur — ce
          qui est le cas dès qu'une séance réservée a eu lieu.
        </p>
      </section>

      <section style={style.section}>
        <h2 style={style.h2}>9. Contact</h2>
        <p style={style.p}>
          Pour toute question relative à une commande, écrire à contact@movementpracticebordeaux.com ou
          via la page <a href="/contact" style={{ color: '#FF2D78' }}>Contact</a>.
        </p>
      </section>

      <p style={{ fontSize: 12, color: COULEURS.texteFaible, marginTop: 40 }}>Dernière mise à jour : août 2026.</p>
    </main>
  );
}
