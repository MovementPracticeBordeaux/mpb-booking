// Numéros de téléphone des élèves : un seul format stocké (+33612345678),
// quel que soit ce que l'élève a tapé (06 12 34 56 78, 06.12..., +33 6...,
// 0033...), pour que le lien WhatsApp fonctionne à coup sûr.

export function normaliserTelephone(brut: string | null | undefined): string | null {
  if (!brut) return null;
  let t = brut.trim().replace(/[\s.\-()/]/g, '');
  if (t.startsWith('00')) t = '+' + t.slice(2);
  if (/^0[1-9]\d{8}$/.test(t)) return '+33' + t.slice(1); // numéro français
  if (/^[67]\d{8}$/.test(t)) return '+33' + t; // mobile français sans le 0
  if (/^\+33 ?0/.test(t)) t = '+33' + t.slice(4); // +33 06... (0 en trop)
  if (/^\+[1-9]\d{7,14}$/.test(t)) return t; // international
  return null;
}

// Chiffres attendus par wa.me (sans le +).
export function lienWhatsApp(telephone: string, message?: string): string | null {
  const normalise = normaliserTelephone(telephone);
  if (!normalise) return null;
  const base = `https://wa.me/${normalise.slice(1)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Affichage lisible : +33 6 12 34 56 78 pour la France, tel quel sinon.
export function formaterTelephone(telephone: string): string {
  const normalise = normaliserTelephone(telephone);
  if (!normalise) return telephone;
  if (normalise.startsWith('+33') && normalise.length === 12) {
    const n = normalise.slice(3);
    return `0${n[0]} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
  }
  return normalise;
}
