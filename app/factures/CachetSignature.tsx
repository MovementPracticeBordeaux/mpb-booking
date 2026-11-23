import { ENTREPRISE } from '@/lib/entreprise';
import { signatureFactureBase64 } from '@/lib/signature-facture';

// Cachet de l'entreprise + signature, comme sur les factures PDF.
// Demandé par les CSE pour rembourser les élèves.
export default async function CachetSignature() {
  const signature = await signatureFactureBase64();
  const encre = '#1a2a6b';
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
      <div>
        <div style={{ border: `2px solid ${encre}`, padding: 3, display: 'inline-block' }}>
          <div style={{ border: `1px solid ${encre}`, padding: '8px 14px', textAlign: 'center', color: encre, fontSize: 11, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 0.3 }}>MOVEMENT PRACTICE BORDEAUX</div>
            <div>Sylvain Noury — Entrepreneur individuel</div>
            <div>{ENTREPRISE.adresse}</div>
            <div>SIRET {ENTREPRISE.siret}</div>
          </div>
        </div>
        {signature && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#555' }}>Signature</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${signature}`} alt="Signature" style={{ width: 170, height: 'auto', display: 'block', marginLeft: 8 }} />
          </div>
        )}
      </div>
    </div>
  );
}
