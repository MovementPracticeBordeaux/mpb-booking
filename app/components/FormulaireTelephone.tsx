'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { enregistrerMonTelephone } from '../profil/actions';

function BoutonEnvoi({ libelle }: { libelle: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ padding: '10px 16px', minHeight: 44, borderRadius: 999, border: 'none', background: '#FF2D78', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: pending ? 0.7 : 1 }}
    >
      {pending ? 'Enregistrement...' : libelle}
    </button>
  );
}

export default function FormulaireTelephone({ valeurInitiale, libelle = 'Enregistrer' }: { valeurInitiale?: string; libelle?: string }) {
  const [etat, action] = useFormState(enregistrerMonTelephone, {});
  const router = useRouter();

  useEffect(() => {
    if (etat.ok) router.refresh();
  }, [etat.ok, router]);

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        name="telephone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        defaultValue={valeurInitiale ?? ''}
        placeholder="06 12 34 56 78"
        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #444', background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: 16 }}
      />
      <BoutonEnvoi libelle={libelle} />
      {etat.erreur && <p style={{ color: '#ff8a8a', fontSize: 13, margin: 0 }}>{etat.erreur}</p>}
      {etat.ok && <p style={{ color: '#8fe0a8', fontSize: 13, margin: 0 }}>✅ Numéro enregistré.</p>}
    </form>
  );
}
