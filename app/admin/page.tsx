import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { ajouterCours, desactiverCours, definirSemaineReference, definirVacances, attribuerFormule, suspendreAcces, decompterCoaching, modifierQuotaRestant, modifierExpiration, gelerPass, degelerPass, rembourserPaiement } from './actions';
import { FORMULES } from '@/lib/formules';

export const dynamic = 'force-dynamic';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default async function AdminPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') {
    return <main style={{ padding: 20 }}>Accès réservé à l'admin.</main>;
  }

  // À partir d'ici, l'utilisateur est confirmé admin : on utilise le client
  // service_role pour voir TOUS les élèves et paiements (pas seulement les
  // siens), puisque la sécurité RLS classique limite chacun à ses propres
  // données par défaut.
  const admin = supabaseAdmin();

  const { data: ref } = await admin.from('semaine_reference').select('*').eq('id', 1).single();
  const { data: coursListe } = await admin
    .from('cours')
    .select('*')
    .eq('actif', true)
    .order('semaine')
    .order('jour_semaine');

  const { data: eleves } = await admin
    .from('profiles')
    .select('*')
    .order('email');

  const { data: paiements } = await admin
    .from('paiements')
    .select('*, profiles!paiements_eleve_id_fkey(email)')
    .order('created_at', { ascending: false })
    .limit(20);

  // Données pour la section Statistiques : historique complet des paiements
  // (pas seulement les 20 derniers affichés) et des réservations confirmées.
  const { data: paiementsTous } = await admin
    .from('paiements')
    .select('montant, created_at, paye, rembourse');

  const { data: reservationsTotales } = await admin
    .from('reservations')
    .select('cours_id')
    .eq('statut', 'confirmee');

  const nbAbonnementsActifs = (eleves ?? []).filter((e) => e.abonnement_actif).length;
  const nbActifsCollectif = (eleves ?? []).filter(
    (e) => e.abonnement_actif && FORMULES[e.formule_nom ?? '']?.categorie === 'planning'
  ).length;
  const nbActifsCoaching = (eleves ?? []).filter(
    (e) => e.abonnement_actif && FORMULES[e.formule_nom ?? '']?.categorie === 'coaching'
  ).length;

  const eleveParFormule = new Map<string, number>();
  for (const e of eleves ?? []) {
    if (!e.abonnement_actif || !e.formule_nom) continue;
    eleveParFormule.set(e.formule_nom, (eleveParFormule.get(e.formule_nom) ?? 0) + 1);
  }

  const COULEUR_SEMAINE: Record<'A' | 'B', string> = { A: '#4FC3F7', B: '#FFB74D' };
  const reservationsParCours = new Map<string, number>();
  for (const r of reservationsTotales ?? []) {
    reservationsParCours.set(r.cours_id, (reservationsParCours.get(r.cours_id) ?? 0) + 1);
  }
  const coursAvecStats = (coursListe ?? [])
    .map((c) => ({ ...c, nbReservations: reservationsParCours.get(c.id) ?? 0 }))
    .sort((a, b) => b.nbReservations - a.nbReservations);
  const maxReservations = Math.max(1, ...coursAvecStats.map((c) => c.nbReservations));

  const revenusParMois = new Map<string, number>();
  for (const p of paiementsTous ?? []) {
    if (!p.paye || p.rembourse) continue;
    const mois = (p.created_at as string).slice(0, 7); // YYYY-MM
    revenusParMois.set(mois, (revenusParMois.get(mois) ?? 0) + Number(p.montant));
  }
  const moisTries = [...revenusParMois.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const maxRevenu = Math.max(1, ...moisTries.map(([, m]) => m));
  const NOMS_MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Coordonnées de la courbe SVG (viewBox fixe 600x160, mise à l'échelle en CSS).
  const svgW = 600, svgH = 160, padG = 30, padD = 10, padH = 14, padB = 24;
  const pointsCourbe = moisTries.map(([, montant], i) => {
    const x = moisTries.length > 1 ? padG + (i / (moisTries.length - 1)) * (svgW - padG - padD) : svgW / 2;
    const y = padH + (1 - montant / maxRevenu) * (svgH - padH - padB);
    return { x, y, montant };
  });
  const chemin = pointsCourbe.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Admin - Planning</h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2>Statistiques</h2>

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
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>coaching / mentorship</p>
          </div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Élèves actifs par formule</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {Object.entries(FORMULES).map(([cle, f]) => {
            const n = eleveParFormule.get(cle) ?? 0;
            if (n === 0) return null;
            return (
              <span key={cle} style={{ border: '1px solid #333', borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>
                {f.nom} · {n}
              </span>
            );
          })}
          {eleveParFormule.size === 0 && <p style={{ fontSize: 12, opacity: 0.6 }}>Aucun abonnement actif pour le moment.</p>}
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Évolution des revenus mensuels (encaissé, hors remboursements)</p>
        {moisTries.length === 0 ? (
          <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>Pas encore de paiement enregistré.</p>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* ligne de base */}
              <line x1={padG} y1={svgH - padB} x2={svgW - padD} y2={svgH - padB} stroke="#333" strokeWidth={1} />
              {/* courbe */}
              <path d={chemin} fill="none" stroke="#f0a" strokeWidth={2} />
              {pointsCourbe.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={3} fill="#f0a" />
                  <text x={p.x} y={p.y - 8} fontSize={10} fill="#eee" textAnchor="middle">{p.montant.toFixed(0)}€</text>
                  <text x={p.x} y={svgH - 6} fontSize={9} fill="#888" textAnchor="middle">
                    {NOMS_MOIS[Number(moisTries[i][0].split('-')[1]) - 1]} {moisTries[i][0].split('-')[0].slice(2)}
                  </text>
                </g>
              ))}
            </svg>
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
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Semaine de référence</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Indique un lundi et si c'est une semaine A ou B, ça sert de point de départ pour calculer l'alternance.
        </p>
        <form action={definirSemaineReference} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="date"
            name="date_lundi_reference"
            defaultValue={ref?.date_lundi_reference}
            required
          />
          <select name="semaine_ce_lundi" defaultValue={ref?.semaine_ce_lundi ?? 'A'}>
            <option value="A">Semaine A</option>
            <option value="B">Semaine B</option>
          </select>
          <button type="submit">Enregistrer</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Période de vacances</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Pendant cette période, le planning public affiche un message "en vacances" et les jours
          concernés sont grisés (non réservables). Laisse les deux champs vides pour désactiver.
        </p>
        <form action={definirVacances} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Du
            <input type="date" name="vacances_debut" defaultValue={ref?.vacances_debut ?? ''} style={{ marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: 13 }}>Au
            <input type="date" name="vacances_fin" defaultValue={ref?.vacances_fin ?? ''} style={{ marginLeft: 4 }} />
          </label>
          <button type="submit">Enregistrer</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Ajouter un créneau</h2>
        <form action={ajouterCours} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 }}>
          <input name="discipline" placeholder="Discipline (ex: Handstand)" required />
          <select name="semaine" defaultValue="A">
            <option value="A">Semaine A</option>
            <option value="B">Semaine B</option>
          </select>
          <select name="jour_semaine" defaultValue="2">
            {JOURS.map((j, i) => (
              <option key={i} value={i}>{j}</option>
            ))}
          </select>
          <label style={{ fontSize: 13 }}>Heure début
            <input type="time" name="heure_debut" required />
          </label>
          <label style={{ fontSize: 13 }}>Heure fin
            <input type="time" name="heure_fin" required />
          </label>
          <input name="lieu" placeholder="Lieu (optionnel)" />
          <button type="submit">Ajouter</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Attribuer une formule à un élève</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Utile pour offrir un cours d'essai, un geste commercial, ou un paiement reçu en dehors du site (liquide, virement...).
          Décoche "Payé" si c'est offert.
        </p>
        <form action={attribuerFormule} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <select name="eleve_id" required>
            <option value="">-- Choisir un élève --</option>
            {(eleves ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.nom ?? e.email}</option>
            ))}
          </select>
          <select name="formule_nom" required defaultValue="illimite">
            <optgroup label="Cours collectifs">
              {Object.entries(FORMULES).filter(([, f]) => f.categorie === 'planning').map(([cle, f]) => (
                <option key={cle} value={cle}>{f.nom} ({f.quota ? `${f.quota} ${f.unite}s` : 'illimité'}, {f.validiteMois} mois)</option>
              ))}
            </optgroup>
            <optgroup label="Coaching & Mentorship">
              {Object.entries(FORMULES).filter(([, f]) => f.categorie === 'coaching').map(([cle, f]) => (
                <option key={cle} value={cle}>{f.nom} ({f.quota ? `${f.quota} ${f.unite}s` : 'illimité'}, {f.validiteMois} mois)</option>
              ))}
            </optgroup>
          </select>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" name="paye" defaultChecked /> Payé
          </label>
          <input type="number" step="0.01" name="montant" placeholder="Montant reçu (€) — laisser vide si offert" />
          <button type="submit">Attribuer</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Élèves</h2>
        {(eleves ?? []).map((e) => {
          const formule = e.formule_nom ? FORMULES[e.formule_nom] : null;
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
                      <form action={degelerPass}>
                        <input type="hidden" name="eleve_id" value={e.id} />
                        <button type="submit">Dégeler (prolonge auto)</button>
                      </form>
                    ) : (
                      <form action={gelerPass}>
                        <input type="hidden" name="eleve_id" value={e.id} />
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
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Paiements récents</h2>
        {(paiements ?? []).map((p: any) => (
          <details key={p.id} style={{ borderBottom: '1px solid #333', padding: 8 }}>
            <summary style={{ fontSize: 13, cursor: 'pointer' }}>
              {new Date(p.created_at).toLocaleDateString('fr-FR')} · {p.profiles?.email} · {Number(p.montant).toFixed(2)} €
              {p.rembourse && ' · ↩️ remboursé'}
            </summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
              <span>
                {FORMULES[p.formule_nom]?.nom ?? p.formule_nom}
                {' · '}{p.origine === 'manuel' ? 'manuel' : 'Stripe'}
              </span>
              {p.origine === 'stripe' && !p.rembourse && Number(p.montant) > 0 && (
                <form action={rembourserPaiement}>
                  <input type="hidden" name="paiement_id" value={p.id} />
                  <button type="submit">Rembourser</button>
                </form>
              )}
            </div>
          </details>
        ))}
      </section>

      <section>
        <h2>Créneaux actifs</h2>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          Repère-toi comme sur le planning public : un bloc par semaine (A/B), une colonne par jour.
        </p>
        {(['A', 'B'] as const).map((sem) => {
          const coursSemaine = (coursListe ?? []).filter((c) => c.semaine === sem);
          const disciplinesSemaine = [...new Set(coursSemaine.map((c) => c.discipline))];
          return (
            <div key={sem} style={{ marginBottom: 24, borderLeft: `3px solid ${COULEUR_SEMAINE[sem]}`, paddingLeft: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: COULEUR_SEMAINE[sem], marginBottom: 2 }}>
                ● Semaine {sem}
              </p>
              <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
                {disciplinesSemaine.length > 0 ? disciplinesSemaine.join(' · ') : 'Aucun créneau'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {JOURS.map((nomJour, i) => {
                  const coursDuJour = coursSemaine.filter((c) => c.jour_semaine === i);
                  if (coursDuJour.length === 0) return null;
                  return (
                    <div key={i}>
                      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, marginBottom: 6 }}>
                        {nomJour}
                      </p>
                      {coursDuJour.map((c) => (
                        <div key={c.id} style={{ border: '1px solid #333', borderRadius: 8, padding: 8, marginBottom: 6, fontSize: 12 }}>
                          <strong style={{ display: 'block' }}>{c.discipline}</strong>
                          <span style={{ opacity: 0.7 }}>{c.heure_debut.slice(0, 5)}-{c.heure_fin.slice(0, 5)}</span>
                          <form action={desactiverCours} style={{ marginTop: 4 }}>
                            <input type="hidden" name="id" value={c.id} />
                            <button type="submit" style={{ fontSize: 11 }}>Désactiver</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
