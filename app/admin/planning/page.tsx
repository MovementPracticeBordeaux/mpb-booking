import { supabaseAdmin } from '@/lib/supabase-server';
import { ajouterCours, desactiverCours, definirSemaineReference, ajouterVacances, supprimerVacances } from '../actions';

export const dynamic = 'force-dynamic';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const COULEUR_SEMAINE: Record<'A' | 'B', string> = { A: '#4FC3F7', B: '#FFB74D' };

export default async function AdminPlanningPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const admin = supabaseAdmin();

  const { data: ref } = await admin.from('semaine_reference').select('*').eq('id', 1).single();
  const { data: periodesVacances } = await admin.from('vacances').select('*').order('date_debut');
  const { data: coursListe } = await admin
    .from('cours')
    .select('*')
    .eq('actif', true)
    .order('semaine')
    .order('jour_semaine');

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Planning collectif</h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}

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
        <h2>Périodes de vacances</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Pendant ces périodes, le planning public affiche un message "en vacances" et les jours
          concernés sont grisés (non réservables). Tu peux en ajouter plusieurs dans l'année.
        </p>

        {(periodesVacances ?? []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {periodesVacances!.map((v) => {
              const aujourdhui = new Date().toISOString().slice(0, 10);
              const statut = aujourdhui > v.date_fin ? 'passée' : aujourdhui >= v.date_debut ? 'en cours' : 'à venir';
              const couleurStatut = statut === 'en cours' ? '#f0a' : statut === 'à venir' ? '#4caf7d' : '#666';
              const debutAffiche = new Date(v.date_debut + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
              const finAffiche = new Date(v.date_fin + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
              const nbJours = Math.round((new Date(v.date_fin).getTime() - new Date(v.date_debut).getTime()) / 86400000) + 1;
              return (
                <div key={v.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '8px 0', borderBottom: '1px solid #333' }}>
                  <span>
                    <span style={{ color: couleurStatut, fontWeight: 600, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>{statut}</span>
                    {' — '}Du {debutAffiche} au {finAffiche} ({nbJours} jour{nbJours > 1 ? 's' : ''})
                  </span>
                  <form action={supprimerVacances}>
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" style={{ fontSize: 12 }}>Supprimer</button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
        {(periodesVacances ?? []).length === 0 && (
          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 16 }}>Aucune période de vacances définie pour le moment.</p>
        )}

        <form action={ajouterVacances} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Du
            <input type="date" name="date_debut" required style={{ marginLeft: 4 }} />
          </label>
          <label style={{ fontSize: 13 }}>Au
            <input type="date" name="date_fin" required style={{ marginLeft: 4 }} />
          </label>
          <button type="submit">Ajouter</button>
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
