import { supabaseAdmin } from '@/lib/supabase-server';
import { FORMULES } from '@/lib/formules';
import {
  REVENUS_MENSUELS_WIX,
  TOTAL_ENCAISSE_WIX,
  FREQUENTATION_DISCIPLINES_WIX,
  FORMULES_VENDUES_WIX,
  MEILLEURS_CRENEAUX_WIX,
  TRAFIC_WIX,
} from '@/lib/historique-wix';

export const dynamic = 'force-dynamic';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const COULEUR_SEMAINE: Record<'A' | 'B', string> = { A: '#4FC3F7', B: '#FFB74D' };

export default async function AdminStatistiquesPage() {
  const admin = supabaseAdmin();

  // Un élève peut avoir plusieurs abonnements actifs à la fois — ces
  // compteurs comptent des ABONNEMENTS, pas des élèves distincts.
  const { data: abonnements } = await admin.from('abonnements').select('categorie, formule_nom').eq('abonnement_actif', true);
  const { data: coursListe } = await admin.from('cours').select('*').eq('actif', true).order('semaine').order('jour_semaine').order('heure_debut');
  const { data: paiementsTous } = await admin.from('paiements').select('montant, created_at, paye, rembourse');
  const { data: reservationsTotales } = await admin.from('reservations').select('cours_id').eq('statut', 'confirmee');

  const nbAbonnementsActifs = (abonnements ?? []).length;
  const nbActifsCollectif = (abonnements ?? []).filter((a) => a.categorie === 'planning').length;
  const nbActifsCoaching = (abonnements ?? []).filter((a) => a.categorie === 'coaching').length;
  const nbActifsMentorat = (abonnements ?? []).filter((a) => a.categorie === 'mentorat').length;

  const eleveParFormule = new Map<string, number>();
  for (const a of abonnements ?? []) {
    eleveParFormule.set(a.formule_nom, (eleveParFormule.get(a.formule_nom) ?? 0) + 1);
  }

  const reservationsParCours = new Map<string, number>();
  for (const r of reservationsTotales ?? []) {
    reservationsParCours.set(r.cours_id, (reservationsParCours.get(r.cours_id) ?? 0) + 1);
  }
  const coursAvecStats = (coursListe ?? [])
    .map((c) => ({ ...c, nbReservations: reservationsParCours.get(c.id) ?? 0 }))
    .sort((a, b) => b.nbReservations - a.nbReservations);
  const maxReservations = Math.max(1, ...coursAvecStats.map((c) => c.nbReservations));

  const revenusParMois = new Map<string, number>();
  // Historique Wix (figé, avant la bascule) + revenus Stripe reels (a partir
  // du lancement du nouveau site) fusionnes dans une seule courbe continue.
  for (const [mois, montant] of Object.entries(REVENUS_MENSUELS_WIX)) {
    revenusParMois.set(mois, montant);
  }
  for (const p of paiementsTous ?? []) {
    if (!p.paye || p.rembourse) continue;
    const mois = (p.created_at as string).slice(0, 7); // YYYY-MM
    revenusParMois.set(mois, (revenusParMois.get(mois) ?? 0) + Number(p.montant));
  }
  const moisTries = [...revenusParMois.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-13);
  const maxRevenu = Math.max(1, ...moisTries.map(([, m]) => m));
  const NOMS_MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Coordonnées de la courbe SVG (viewBox fixe 600x160, mise à l'échelle en CSS).
  const svgW = 600, svgH = 160, padG = 30, padD = 10, padH = 14, padB = 24;
  const pointsCourbe = moisTries.map(([mois, montant], i) => {
    const x = moisTries.length > 1 ? padG + (i / (moisTries.length - 1)) * (svgW - padG - padD) : svgW / 2;
    const y = padH + (1 - montant / maxRevenu) * (svgH - padH - padB);
    return { x, y, montant, estWix: mois in REVENUS_MENSUELS_WIX };
  });

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Statistiques</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbAbonnementsActifs}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>abonnements actifs</p>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbActifsCollectif}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>sur cours collectifs</p>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbActifsCoaching}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>coaching individuel</p>
        </div>
        <div style={{ border: '1px solid #333', borderRadius: 8, padding: 12, flex: '1 1 140px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{nbActifsMentorat}</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>mentorat</p>
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Élèves actifs par formule</p>
      {(() => {
        const donnees = Object.entries(FORMULES)
          .map(([cle, f]) => ({ nom: f.nom, n: eleveParFormule.get(cle) ?? 0 }))
          .filter((d) => d.n > 0)
          .sort((a, b) => b.n - a.n);

        if (donnees.length === 0) {
          return <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>Aucun abonnement actif pour le moment.</p>;
        }

        const maxN = Math.max(...donnees.map((d) => d.n));
        const hauteurBarre = 26, espace = 8;
        const svgWBarres = 600, padGBarres = 140, padDBarres = 40;
        const svgHBarres = donnees.length * (hauteurBarre + espace);

        return (
          <div style={{ marginBottom: 20 }}>
            <svg viewBox={`0 0 ${svgWBarres} ${svgHBarres}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              {donnees.map((d, i) => {
                const y = i * (hauteurBarre + espace);
                const largeurMax = svgWBarres - padGBarres - padDBarres;
                const largeur = maxN > 0 ? (d.n / maxN) * largeurMax : 0;
                return (
                  <g key={d.nom}>
                    <text x={padGBarres - 10} y={y + hauteurBarre / 2} textAnchor="end" dominantBaseline="middle" fontSize="13" fill="#ccc">
                      {d.nom}
                    </text>
                    <rect x={padGBarres} y={y} width={largeurMax} height={hauteurBarre} rx={4} fill="#222" />
                    <rect x={padGBarres} y={y} width={largeur} height={hauteurBarre} rx={4} fill="#f0a" />
                    <text x={padGBarres + largeur + 8} y={y + hauteurBarre / 2} dominantBaseline="middle" fontSize="13" fontWeight="700" fill="#fff">
                      {d.n}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })()}

      <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Évolution des revenus mensuels (encaissé, hors remboursements)</p>
      {moisTries.length === 0 ? (
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>Pas encore de paiement enregistré.</p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* ligne de base */}
            <line x1={padG} y1={svgH - padB} x2={svgW - padD} y2={svgH - padB} stroke="#333" strokeWidth={1} />
            {/* courbe en deux segments : gris pour l'historique Wix, rose pour le nouveau site */}
            {pointsCourbe.slice(0, -1).map((p, i) => {
              const suivant = pointsCourbe[i + 1];
              const segmentWix = p.estWix && suivant.estWix;
              return (
                <line
                  key={i}
                  x1={p.x} y1={p.y} x2={suivant.x} y2={suivant.y}
                  stroke={segmentWix ? '#888' : '#f0a'}
                  strokeWidth={2}
                  strokeDasharray={segmentWix ? '4 3' : undefined}
                />
              );
            })}
            {pointsCourbe.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={3} fill={p.estWix ? '#888' : '#f0a'} />
                <text x={p.x} y={p.y - 8} fontSize={10} fill="#eee" textAnchor="middle">{p.montant.toFixed(0)}€</text>
                <text x={p.x} y={svgH - 6} fontSize={9} fill="#888" textAnchor="middle">
                  {NOMS_MOIS[Number(moisTries[i][0].split('-')[1]) - 1]} {moisTries[i][0].split('-')[0].slice(2)}
                </text>
              </g>
            ))}
          </svg>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, opacity: 0.7, marginTop: 4 }}>
            <span><span style={{ color: '#888' }}>●</span> Ancien site (Wix)</span>
            <span><span style={{ color: '#f0a' }}>●</span> Nouveau site</span>
          </div>
        </div>
      )}

      <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>
        Créneaux les plus / moins réservés (total réservations depuis toujours)
      </p>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 8 }}>
        Chiffre brut, pas ramené au nombre d'occurrences passées — à lire comme une tendance relative.
      </p>
      {coursAvecStats.map((c) => (
        <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12 }}>
          <span style={{ width: 178, flexShrink: 0 }}>
            <span style={{ color: COULEUR_SEMAINE[c.semaine as 'A' | 'B'] }}>●</span> {JOURS[c.jour_semaine].slice(0, 3)} {c.heure_debut.slice(0, 5)} — {c.discipline}
          </span>
          <div style={{ flex: '1 1 100px', background: '#222', borderRadius: 4, height: 14, overflow: 'hidden' }}>
            <div style={{ width: `${(c.nbReservations / maxReservations) * 100}%`, height: '100%', background: '#f0a' }} />
          </div>
          <span style={{ width: 24, textAlign: 'right', flexShrink: 0 }}>{c.nbReservations}</span>
        </div>
      ))}

      <details style={{ marginTop: 20, border: '1px solid #333', borderRadius: 8, padding: '10px 14px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          📦 Historique Wix (12 mois avant la bascule) — {TOTAL_ENCAISSE_WIX.toLocaleString('fr-FR')} € encaissés au total
        </summary>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 6 }}>Fréquentation par discipline</p>
          {FREQUENTATION_DISCIPLINES_WIX.map((d) => {
            const max = FREQUENTATION_DISCIPLINES_WIX[0].reservations;
            return (
              <div key={d.nom} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12 }}>
                <span style={{ width: 90, flexShrink: 0 }}>{d.nom}</span>
                <div style={{ flex: 1, background: '#222', borderRadius: 4, height: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${(d.reservations / max) * 100}%`, height: '100%', background: '#888' }} />
                </div>
                <span style={{ width: 32, textAlign: 'right', flexShrink: 0 }}>{d.reservations}</span>
              </div>
            );
          })}

          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, margin: '16px 0 6px' }}>Formules les plus vendues</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FORMULES_VENDUES_WIX.map((f) => (
              <span key={f.nom} style={{ border: '1px solid #333', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>
                {f.nom} · {f.ventes} ventes · {f.montant.toLocaleString('fr-FR')} €
              </span>
            ))}
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, margin: '16px 0 6px' }}>Meilleurs créneaux (jour + heure)</p>
          {MEILLEURS_CRENEAUX_WIX.map((cr) => (
            <div key={cr.jour + cr.heure} style={{ fontSize: 12, opacity: 0.85, marginBottom: 3 }}>
              {cr.jour} {cr.heure} — {cr.places} places réservées (taux de remplissage {cr.taux})
            </div>
          ))}

          <p style={{ fontSize: 11, opacity: 0.6, marginTop: 16 }}>
            Trafic du site sur la période : {TRAFIC_WIX.vuesDePage.toLocaleString('fr-FR')} vues de page,{' '}
            {TRAFIC_WIX.visiteursUniques.toLocaleString('fr-FR')} visiteurs uniques ({TRAFIC_WIX.jours} jours de données).
          </p>
        </div>
      </details>
    </main>
  );
}
