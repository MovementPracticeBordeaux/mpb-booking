import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { ajouterCours, desactiverCours, definirSemaineReference, attribuerFormule, suspendreAcces, decompterCoaching, modifierQuotaRestant, modifierExpiration, gelerPass, degelerPass } from './actions';
import { FORMULES } from '@/lib/formules';

export const dynamic = 'force-dynamic';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default async function AdminPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') {
    return <main style={{ padding: 20 }}>Accès réservé à l'admin.</main>;
  }

  const { data: ref } = await supabase.from('semaine_reference').select('*').eq('id', 1).single();
  const { data: coursListe } = await supabase
    .from('cours')
    .select('*')
    .eq('actif', true)
    .order('semaine')
    .order('jour_semaine');

  const { data: eleves } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'eleve')
    .order('email');

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Admin - Planning</h1>

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
          return (
            <div key={e.id} style={{ borderBottom: '1px solid #333', padding: 8, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {e.nom ?? e.email} — {formule?.nom ?? 'aucune formule'}
                  {formule?.quota && ` (${e.quota_restant}/${e.quota_total} ${formule.unite}s)`}
                  {e.date_expiration && ` · exp. ${e.date_expiration}`}
                  {' · '}{e.gele ? '❄️ gelé' : e.abonnement_actif ? '✅ actif' : '⛔ inactif'}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, fontSize: 12 }}>
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
          );
        })}
      </section>

      <section>
        <h2>Créneaux actifs</h2>
        {(coursListe ?? []).map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', padding: 8 }}>
            <span>
              [{c.semaine}] {JOURS[c.jour_semaine]} {c.heure_debut.slice(0, 5)}-{c.heure_fin.slice(0, 5)} — {c.discipline}
            </span>
            <form action={desactiverCours}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit">Désactiver</button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
