'use client';

export default function BoutonImprimer() {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: '10px 16px', background: '#f0a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      className="no-print"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
