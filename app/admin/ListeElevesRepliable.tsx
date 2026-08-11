'use client';

import { useState } from 'react';

// Reçoit les élèves déjà enrichis de leur formule (nom, unité, quota, catégorie)
// pour ne pas avoir à repasser tout le catalogue FORMULES en prop.
type Eleve = {
  id: string;
  nom: string | null;
  email: string;
  formule_nom: string | null;
  quota_restant: number | null;
  quota_total: number | null;
  date_expiration: string | null;
  date_fin_gel_prevue: string | null;
  gele: boolean;
  abonnement_actif: boolean;
  origine: string;
  paye: boolean;
  formuleAffichage: { nom: string; unite: string; quota: number | null; categorie: string } | null;
};

export default function ListeElevesRepliable({
  eleves,
  suspendreAcces,
  modifierQuotaRestant,
  modifierExpiration,
  gelerPass,
  degelerPass,
  definirDateReprise,
  decompterCoaching,
}: {
  eleves: Eleve[];
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

  const filtres = eleves.filter((e) => {
    const cible = `${e.nom ?? ''} ${e.email} ${e.formuleAffichage?.nom ?? ''}`.toLowerCase();
    return cible.includes(recherche.toLowerCase());
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
          <input
            type="text"
            placeholder="Rechercher un élève (nom, email, formule)..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ width: '100%', maxWidth: 320, marginBottom: 10, padding: '6px 10px', fontSize: 13 }}
          />
          {filtres.length === 0 && <p style={{ fontSize: 13, opacity: 0.6 }}>Aucun élève ne correspond.</p>}
          {filtres.map((e) => {
            const formule = e.formuleAffichage;
            const statut = e.gele ? '❄️ gelé' : e.abonnement_actif ? '✅ actif' : '⛔ inactif';
            return (
              <details key={e.id} style={{ borderBottom: '1px solid #333', padding: 8 }}>
                <summary style={{ fontSize: 14, cursor: 'pointer' }}>
                  {e.nom ?? e.email} — {formule?.nom ?? 'aucune formule'} · {statut}
                </summary>

                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
                    <span>
                      {formule?.quota && `${e.quota_restant}/${e.quota_total} ${formule.unite}s`}
                      {e.date_expiration && ` · exp. ${e.date_expiration}`}
                      {e.gele && e.date_fin_gel_prevue && ` · reprise prévue le ${e.date_fin_gel_prevue}`}
                      {' · '}{e.origine === 'manuel' ? 'manuel' : 'Stripe'}
                      {!e.paye && ' · offert'}
                    </span>
                    {e.abonnement_actif && (
                      <form action={suspendreAcces}>
                        <input type="hidden" name="eleve_id" value={e.id} />
                        <button type="submit">Suspendre</button>
                      </form>
                    )}
                  </div>

                  {e.formule_nom && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                      {formule?.quota && (
                        <form action={modifierQuotaRestant} style={{ display: 'flex', gap: 4 }}>
                          <input type="hidden" name="eleve_id" value={e.id} />
                          <input type="number" name="quota_restant" defaultValue={e.quota_restant ?? 0} style={{ width: 50 }} />
                          <button type="submit">Corriger quota</button>
                        </form>
                      )}
                      <form action={modifierExpiration} style={{ display: 'flex', gap: 4 }}>
                        <input type="hidden" name="eleve_id" value={e.id} />
                        <input type="date" name="date_expiration" defaultValue={e.date_expiration ?? ''} />
                        <button type="submit">Corriger date</button>
                      </form>
                      {e.gele ? (
                        <>
                          <form action={degelerPass}>
                            <input type="hidden" name="eleve_id" value={e.id} />
                            <button type="submit">Dégeler (prolonge auto)</button>
                          </form>
                          <form action={definirDateReprise} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input type="hidden" name="eleve_id" value={e.id} />
                            <label style={{ fontSize: 11, opacity: 0.7 }}>
                              Corriger la date de reprise
                              <input type="date" name="date_fin_gel_prevue" defaultValue={e.date_fin_gel_prevue ?? ''} style={{ marginLeft: 4 }} />
                            </label>
                            <button type="submit">Enregistrer</button>
                          </form>
                        </>
                      ) : (
                        <form action={gelerPass} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input type="hidden" name="eleve_id" value={e.id} />
                          <label style={{ fontSize: 11, opacity: 0.7 }}>
                            Reprise le
                            <input type="date" name="date_fin_gel_prevue" style={{ marginLeft: 4 }} />
                          </label>
                          <button type="submit">❄️ Geler (blessure, vacances...)</button>
                        </form>
                      )}
                    </div>
                  )}
                  {formule?.categorie === 'coaching' && formule.quota && e.abonnement_actif && (
                    <form action={decompterCoaching} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input type="hidden" name="eleve_id" value={e.id} />
                      <input
                        type="number" name="quantite" min="1" step="1" defaultValue="1"
                        style={{ width: 60 }}
                        aria-label={`${formule.unite}s consommées`}
                      />
                      <button type="submit">Décompter ({formule.unite}s consommées après séance)</button>
                    </form>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
