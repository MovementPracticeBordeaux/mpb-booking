'use client';

import { useState } from 'react';

type Eleve = { id: string; nom: string | null; email: string; createdAt: string };

// Reçoit les abonnements déjà enrichis de leur formule (nom, unité, quota,
// catégorie) pour ne pas avoir à repasser tout le catalogue FORMULES en prop.
type Abonnement = {
  id: string;
  eleve_id: string;
  categorie: string;
  formule_nom: string;
  quota_restant: number | null;
  quota_total: number | null;
  date_expiration: string | null;
  date_fin_gel_prevue: string | null;
  gele: boolean;
  abonnement_actif: boolean;
  origine: string;
  paye: boolean;
  branches: string | null;
  formuleAffichage: { nom: string; unite: string; quota: number | null; categorie: string } | null;
};

const LIBELLE_CATEGORIE: Record<string, string> = {
  planning: 'Collectif',
  coaching: 'Coaching',
  mentorat: 'Mentorat',
};

export default function ListeElevesRepliable({
  eleves,
  abonnements,
  idsAyantDejaEuFormule,
  suspendreAcces,
  modifierQuotaRestant,
  modifierExpiration,
  gelerPass,
  degelerPass,
  definirDateReprise,
  decompterCoaching,
}: {
  eleves: Eleve[];
  abonnements: Abonnement[];
  idsAyantDejaEuFormule: string[];
  suspendreAcces: (formData: FormData) => void;
  modifierQuotaRestant: (formData: FormData) => void;
  modifierExpiration: (formData: FormData) => void;
  gelerPass: (formData: FormData) => void;
  degelerPass: (formData: FormData) => void;
  definirDateReprise: (formData: FormData) => void;
  decompterCoaching: (formData: FormData) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'actifs' | 'geles' | 'anciens' | 'jamais' | 'tous'>('actifs');

  const ensembleDejaEuFormule = new Set(idsAyantDejaEuFormule);

  // Un élève peut désormais avoir plusieurs abonnements actifs en même
  // temps (planning + coaching + mentorat) — on les regroupe par élève
  // pour l'affichage.
  const abosParEleve = new Map<string, Abonnement[]>();
  for (const a of abonnements) {
    const liste = abosParEleve.get(a.eleve_id) ?? [];
    liste.push(a);
    abosParEleve.set(a.eleve_id, liste);
  }

  function statutEleve(e: Eleve): 'actifs' | 'geles' | 'anciens' | 'jamais' {
    const abos = abosParEleve.get(e.id) ?? [];
    if (abos.some((a) => a.gele)) return 'geles';
    if (abos.length > 0) return 'actifs';
    if (ensembleDejaEuFormule.has(e.id)) return 'anciens';
    return 'jamais';
  }

  const NB_JOURS_AVANT_SUPPRESSION_AUTO = 7;
  function joursDepuisCreation(e: Eleve): number {
    return Math.floor((Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  const compteurs = { actifs: 0, geles: 0, anciens: 0, jamais: 0 };
  for (const e of eleves) compteurs[statutEleve(e)]++;

  const filtres = eleves.filter((e) => {
    if (filtreStatut !== 'tous' && statutEleve(e) !== filtreStatut) return false;
    const abos = abosParEleve.get(e.id) ?? [];
    const cible = `${e.nom ?? ''} ${e.email} ${abos.map((a) => a.formuleAffichage?.nom ?? '').join(' ')}`.toLowerCase();
    return cible.includes(recherche.toLowerCase());
  });

  const boutonFiltre = (valeur: typeof filtreStatut, label: string, count?: number): React.CSSProperties => ({
    background: filtreStatut === valeur ? '#f0a' : 'none',
    color: filtreStatut === valeur ? 'white' : 'inherit',
    border: '1px solid #444',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
  });

  return (
    <div>
      <button
        onClick={() => setOuvert((o) => !o)}
        style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span>{ouvert ? '▾' : '▸'}</span> Élèves ({eleves.length})
      </button>

      {ouvert && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <button type="button" onClick={() => setFiltreStatut('actifs')} style={boutonFiltre('actifs', 'Actifs')}>
              Actifs ({compteurs.actifs})
            </button>
            <button type="button" onClick={() => setFiltreStatut('geles')} style={boutonFiltre('geles', 'Gelés')}>
              Gelés ({compteurs.geles})
            </button>
            <button type="button" onClick={() => setFiltreStatut('anciens')} style={boutonFiltre('anciens', 'Anciens clients')}>
              Anciens clients ({compteurs.anciens})
            </button>
            <button type="button" onClick={() => setFiltreStatut('jamais')} style={boutonFiltre('jamais', 'Jamais de formule')}>
              Jamais de formule ({compteurs.jamais})
            </button>
            <button type="button" onClick={() => setFiltreStatut('tous')} style={boutonFiltre('tous', 'Tous')}>
              Tous ({eleves.length})
            </button>
          </div>
          <input
            type="text"
            placeholder="Rechercher un élève (nom, email, formule)..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ width: '100%', maxWidth: 320, marginBottom: 10, padding: '6px 10px', fontSize: 13 }}
          />
          {filtreStatut === 'jamais' && (
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: -4, marginBottom: 10 }}>
              Ces comptes sont supprimés automatiquement au bout de {NB_JOURS_AVANT_SUPPRESSION_AUTO} jours s'ils
              n'ont toujours pris aucune formule.
            </p>
          )}
          {filtres.length === 0 && <p style={{ fontSize: 13, opacity: 0.6 }}>Aucun élève ne correspond.</p>}
          {filtres.map((e) => {
            const abos = abosParEleve.get(e.id) ?? [];
            const resume = abos.length === 0
              ? 'aucune formule active'
              : abos.map((a) => `${LIBELLE_CATEGORIE[a.categorie] ?? a.categorie}: ${a.formuleAffichage?.nom ?? a.formule_nom}`).join(' + ');
            const joursRestants = statutEleve(e) === 'jamais' ? Math.max(0, NB_JOURS_AVANT_SUPPRESSION_AUTO - joursDepuisCreation(e)) : null;
            return (
              <details key={e.id} style={{ borderBottom: '1px solid #333', padding: 8 }}>
                <summary style={{ fontSize: 14, cursor: 'pointer' }}>
                  {e.nom ?? e.email} — {resume}
                  {joursRestants !== null && (
                    <span style={{ fontSize: 11, opacity: 0.5 }}> · suppression auto dans {joursRestants} j</span>
                  )}
                </summary>

                <div style={{ marginTop: 10 }}>
                  {abos.length === 0 && <p style={{ fontSize: 13, opacity: 0.6 }}>Aucun abonnement actif pour cet élève.</p>}
                  {abos.map((a) => {
                    const formule = a.formuleAffichage;
                    const statut = a.gele ? '❄️ gelé' : '✅ actif';
                    return (
                      <div key={a.id} style={{ border: '1px solid #333', borderRadius: 6, padding: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {LIBELLE_CATEGORIE[a.categorie] ?? a.categorie} — {formule?.nom ?? a.formule_nom} · {statut}
                          </span>
                          <form action={suspendreAcces}>
                            <input type="hidden" name="abonnement_id" value={a.id} />
                            <button type="submit">Suspendre</button>
                          </form>
                        </div>

                        <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 8px' }}>
                          {formule?.quota && `${a.quota_restant}/${a.quota_total} ${formule.unite}s`}
                          {a.categorie === 'mentorat' && a.branches && ` · branche(s) : ${a.branches.split(',').join(' + ')}`}
                          {a.date_expiration && ` · exp. ${a.date_expiration}`}
                          {a.gele && a.date_fin_gel_prevue && ` · reprise prévue le ${a.date_fin_gel_prevue}`}
                          {' · '}{a.origine === 'manuel' ? 'manuel' : 'Stripe'}
                          {!a.paye && ' · offert'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                          {formule?.quota && (
                            <form action={modifierQuotaRestant} style={{ display: 'flex', gap: 4 }}>
                              <input type="hidden" name="abonnement_id" value={a.id} />
                              <input type="number" name="quota_restant" defaultValue={a.quota_restant ?? 0} style={{ width: 50 }} />
                              <button type="submit">Corriger quota</button>
                            </form>
                          )}
                          <form action={modifierExpiration} style={{ display: 'flex', gap: 4 }}>
                            <input type="hidden" name="abonnement_id" value={a.id} />
                            <input type="date" name="date_expiration" defaultValue={a.date_expiration ?? ''} />
                            <button type="submit">Corriger date</button>
                          </form>
                          {a.gele ? (
                            <>
                              <form action={degelerPass}>
                                <input type="hidden" name="abonnement_id" value={a.id} />
                                <button type="submit">Dégeler (prolonge auto)</button>
                              </form>
                              <form action={definirDateReprise} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input type="hidden" name="abonnement_id" value={a.id} />
                                <label style={{ fontSize: 11, opacity: 0.7 }}>
                                  Corriger la date de reprise
                                  <input type="date" name="date_fin_gel_prevue" defaultValue={a.date_fin_gel_prevue ?? ''} style={{ marginLeft: 4 }} />
                                </label>
                                <button type="submit">Enregistrer</button>
                              </form>
                            </>
                          ) : (
                            <form action={gelerPass} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input type="hidden" name="abonnement_id" value={a.id} />
                              <label style={{ fontSize: 11, opacity: 0.7 }}>
                                Reprise le
                                <input type="date" name="date_fin_gel_prevue" style={{ marginLeft: 4 }} />
                              </label>
                              <button type="submit">❄️ Geler (blessure, vacances...)</button>
                            </form>
                          )}
                          {a.categorie === 'coaching' && formule?.quota && (
                            <form action={decompterCoaching} style={{ display: 'flex', gap: 6 }}>
                              <input type="hidden" name="abonnement_id" value={a.id} />
                              <input
                                type="number" name="quantite" min="1" step="1" defaultValue="1"
                                style={{ width: 60 }}
                                aria-label={`${formule.unite}s consommées`}
                              />
                              <button type="submit">Décompter ({formule.unite}s consommées après séance)</button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
