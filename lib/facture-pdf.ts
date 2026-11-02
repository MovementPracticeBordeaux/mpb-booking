import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ENTREPRISE } from '@/lib/entreprise';

// Facture "manuelle" (prestation hors formules) au format PDF, identique à
// la page /facture-externe/[id] : coordonnées, SIRET, numéro, lignes, total,
// mention TVA. Polices standard PDF (Helvetica) : accents et € inclus.

export type FacturePdf = {
  id: string;
  nom_client: string;
  lignes: { description: string; prixUnitaire: number; quantite: number }[];
  total: number;
  created_at: string;
};

export function numeroFacture(f: { id: string; created_at: string }) {
  return `MPB-${new Date(f.created_at).getFullYear()}-${f.id.slice(0, 8).toUpperCase()}`;
}

const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

export async function genererFacturePdf(f: FacturePdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
  const gris = rgb(0.35, 0.35, 0.35);
  const noir = rgb(0.07, 0.07, 0.07);
  const marge = 50;
  const droite = 595.28 - marge;
  let y = 790;

  const texte = (t: string, x: number, yy: number, taille = 10, police = normal, couleur = noir) =>
    page.drawText(t, { x, y: yy, size: taille, font: police, color: couleur });
  const aDroite = (t: string, yy: number, taille = 10, police = normal, couleur = noir) =>
    texte(t, droite - police.widthOfTextAtSize(t, taille), yy, taille, police, couleur);

  // En-tête : émetteur à gauche, facture à droite
  texte(ENTREPRISE.nom, marge, y, 14, gras);
  aDroite('Facture', y, 14, gras);
  y -= 18;
  texte(ENTREPRISE.adresse, marge, y, 9, normal, gris);
  aDroite(`N° ${numeroFacture(f)}`, y, 9);
  y -= 13;
  texte(`SIRET : ${ENTREPRISE.siret}`, marge, y, 9, normal, gris);
  aDroite(new Date(f.created_at).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }), y, 9);
  y -= 13;
  texte(ENTREPRISE.email, marge, y, 9, normal, gris);

  // Client
  y -= 40;
  texte('Facturé à', marge, y, 9, normal, gris);
  y -= 14;
  texte(f.nom_client, marge, y, 11);

  // Tableau
  const colQte = 360, colPu = 420;
  y -= 40;
  texte('Désignation', marge, y, 10, gras);
  aDroiteCol('Qté', colQte + 30, y, gras);
  aDroiteCol('Prix unitaire', colPu + 60, y, gras);
  aDroite('Montant', y, 10, gras);
  y -= 8;
  page.drawLine({ start: { x: marge, y }, end: { x: droite, y }, thickness: 1.2, color: noir });

  for (const l of f.lignes) {
    y -= 18;
    texte(tronquer(l.description, 300), marge, y, 10);
    aDroiteCol(String(l.quantite), colQte + 30, y, normal);
    aDroiteCol(euros(l.prixUnitaire), colPu + 60, y, normal);
    aDroite(euros(l.prixUnitaire * l.quantite), y, 10);
    y -= 8;
    page.drawLine({ start: { x: marge, y }, end: { x: droite, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
  }

  y -= 30;
  aDroite(`Total : ${euros(Number(f.total))}`, y, 13, gras);
  y -= 16;
  aDroite(ENTREPRISE.mentionTva, y, 8, normal, gris);

  return pdf.save();

  function aDroiteCol(t: string, xFin: number, yy: number, police: typeof normal) {
    texte(t, xFin - police.widthOfTextAtSize(t, 10), yy, 10, police);
  }
  function tronquer(t: string, largeurMax: number) {
    if (normal.widthOfTextAtSize(t, 10) <= largeurMax) return t;
    let s = t;
    while (s.length > 1 && normal.widthOfTextAtSize(s + '…', 10) > largeurMax) s = s.slice(0, -1);
    return s + '…';
  }
}
