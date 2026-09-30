import FormulaireTelephone from './FormulaireTelephone';

// Affiché par-dessus le site tant qu'un élève connecté n'a pas renseigné son
// numéro : impossible de continuer sans. Disparaît dès l'enregistrement.
export default function TelephoneObligatoire() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400, background: '#141417', border: '1px solid #2a2a30', borderRadius: 16, padding: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 22 }}>📱 Ton numéro de téléphone</h2>
        <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>
          Sylvain en a besoin pour pouvoir te prévenir rapidement en cas de changement : cours annulé, lieu déplacé,
          question sur ta réservation. Il ne sera jamais affiché publiquement.
        </p>
        <FormulaireTelephone libelle="Continuer" />
      </div>
    </div>
  );
}
