import { NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import { genererFacturePdf, numeroFacture } from '@/lib/facture-pdf';
import { signatureFacturePng } from '@/lib/signature-facture';

// Facture d'un paiement d'élève en PDF (avec cachet et signature), pour la
// transmettre à un CSE. Réservée à l'élève concerné (ou à l'admin).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', _req.url));

  const admin = supabaseAdmin();
  const { data: paiement } = await admin.from('paiements')
    .select('id, eleve_id, formule_nom, montant, created_at, profiles!paiements_eleve_id_fkey(nom, email)')
    .eq('id', params.id).maybeSingle();
  if (!paiement) return new NextResponse('Facture introuvable', { status: 404 });

  const { data: profil } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (paiement.eleve_id !== user.id && profil?.role !== 'admin') {
    return new NextResponse('Cette facture ne t’appartient pas.', { status: 403 });
  }

  const client = (paiement.profiles as any) ?? {};
  const f = {
    id: paiement.id,
    nom_client: client.nom ?? client.email ?? '',
    lignes: [{ description: FORMULES[paiement.formule_nom]?.nom ?? paiement.formule_nom, prixUnitaire: Number(paiement.montant), quantite: 1 }],
    total: Number(paiement.montant),
    created_at: paiement.created_at,
  };
  const pdf = await genererFacturePdf(f, await signatureFacturePng());
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Facture-${numeroFacture(f)}.pdf"`,
    },
  });
}
