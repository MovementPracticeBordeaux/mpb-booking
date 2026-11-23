import { supabaseAdmin } from '@/lib/supabase-server';

// Signature manuscrite de Sylvain (PNG transparent, base64), stockée dans
// config_interne — jamais dans le code, le dépôt est public.
export async function signatureFactureBase64(): Promise<string | null> {
  const { data } = await supabaseAdmin().from('config_interne').select('valeur').eq('cle', 'signature_facture_png').maybeSingle();
  return data?.valeur ?? null;
}

export async function signatureFacturePng(): Promise<Uint8Array | null> {
  const b64 = await signatureFactureBase64();
  return b64 ? Uint8Array.from(Buffer.from(b64, 'base64')) : null;
}
