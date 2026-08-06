'use client';

import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function BoutonDeconnexion() {
  const router = useRouter();

  async function deconnecter() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={deconnecter}
      style={{
        background: 'none',
        border: '1px solid #333',
        borderRadius: 6,
        padding: '8px 14px',
        color: 'inherit',
        cursor: 'pointer',
        font: 'inherit',
      }}
    >
      Se déconnecter
    </button>
  );
}
