import { supabaseAdmin } from '@/lib/supabase-server';
import { envoyerEmail } from '@/lib/resend';
import { genererFacturePdf, numeroFacture } from '@/lib/facture-pdf';

// Les réponses aux emails de facture arrivent directement chez Sylvain.
export const ADRESSE_REPONSE_FACTURES = 'amplitude.inside@protonmail.com';

// Envoie une facture manuelle par email, PDF en pièce jointe, et la marque
// comme envoyée. Utilisé par Admin → Factures et par la facture mensuelle.
export async function envoyerFactureManuelle(factureId: string): Promise<void> {
  const admin = supabaseAdmin();
  const { data: f } = await admin.from('factures_manuelles').select('*').eq('id', factureId).single();
  if (!f) throw new Error('Facture introuvable.');
  if (!f.email_client) throw new Error("Cette facture n'a pas d'email renseigné.");

  const lignes = f.lignes as { description: string; prixUnitaire: number; quantite: number }[];
  const total = Number(f.total);
  const numero = numeroFacture(f);
  const pdf = await genererFacturePdf({ id: f.id, nom_client: f.nom_client, lignes, total, created_at: f.created_at });
  const lien = `${process.env.NEXT_PUBLIC_SITE_URL}/facture-externe/${f.id}`;
  const lignesHtml = lignes
    .map((l) => `<li>${l.description}${l.quantite > 1 ? ` — ${l.quantite} × ${l.prixUnitaire.toFixed(2)} €` : ''} — ${(l.prixUnitaire * l.quantite).toFixed(2)} €</li>`)
    .join('');

  await envoyerEmail(
    f.email_client,
    `Facture Movement Practice Bordeaux — ${total.toFixed(2)} €`,
    `<p>Bonjour ${f.nom_client},</p>
     <p>Voici la facture pour la prestation convenue (PDF en pièce jointe) :</p>
     <ul>${lignesHtml}</ul>
     <p><strong>Total : ${total.toFixed(2)} €</strong></p>
     <p><a href="${lien}">Voir la facture en ligne</a></p>
     <p>Merci !</p>`,
    {
      replyTo: ADRESSE_REPONSE_FACTURES,
      attachments: [{ filename: `Facture-${numero}.pdf`, content: Buffer.from(pdf).toString('base64') }],
    }
  );

  await admin.from('factures_manuelles').update({ envoyee_le: new Date().toISOString() }).eq('id', f.id);
}
