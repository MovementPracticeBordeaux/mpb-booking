import { supabaseServer } from '@/lib/supabase-server';
import { calculerSemaine } from '@/lib/semaine';
import { reserverCours } from './booking/actions';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default async function PlanningPage() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: ref } = await supabase
    .from('semaine_reference')
    .select('*')
    .eq('id', 1)
    .single();

  const { data: coursListe } = await supabase
    .from('cours')
    .select('*')
    .eq('actif', true)
    .order('jour_semaine')
    .order('heure_debut');

  let mesReservations: { cours_id: string; date_seance: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from('reservations')
      .select('cours_id, date_seance')
      .eq('eleve_id', user.id)
      .eq('statut', 'confirmee');
    mesReservations = data ?? [];
  }

  // Génère les 14 prochains jours avec, pour chacun, la semaine A/B correspondante
  const jours: { date: Date; semaine: 'A' | 'B' }[] = [];
  if (ref) {
    const lundiRef = new Date(ref.date_lundi_reference);
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      jours.push({ date: d, semaine: calculerSemaine(d, lundiRef, ref.semaine_ce_lundi) });
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Planning - Movement Practice Bordeaux</h1>
      {!user && (
        <p>
          <a href="/login" style={{ color: '#f0a' }}>Connecte-toi</a> pour réserver un cours.
        </p>
      )}
      {!ref && (
        <p style={{ color: 'orange' }}>
          Aucune semaine de référence configurée. Un admin doit la définir depuis /admin.
        </p>
      )}
      {jours.map(({ date, semaine }) => {
        const coursDuJour = (coursListe ?? []).filter(
          (c) => c.jour_semaine === date.getDay() && c.semaine === semaine
        );
        if (coursDuJour.length === 0) return null;
        return (
          <section key={date.toISOString()} style={{ marginBottom: 24 }}>
            <h3>
              {JOURS[date.getDay()]} {date.toLocaleDateString('fr-FR')}{' '}
              <span style={{ fontSize: 12, opacity: 0.6 }}>(semaine {semaine})</span>
            </h3>
            {coursDuJour.map((c) => {
              const dateStr = date.toISOString().slice(0, 10);
              const dejaReserve = mesReservations.some(
                (r) => r.cours_id === c.id && r.date_seance === dateStr
              );
              return (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{c.discipline}</strong>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      {c.heure_debut.slice(0, 5)} - {c.heure_fin.slice(0, 5)}
                      {c.lieu ? ` · ${c.lieu}` : ''}
                    </div>
                  </div>
                  {user ? (
                    dejaReserve ? (
                      <span style={{ color: '#4f4' }}>Réservé ✓</span>
                    ) : (
                      <form action={reserverCours}>
                        <input type="hidden" name="cours_id" value={c.id} />
                        <input type="hidden" name="date_seance" value={dateStr} />
                        <button type="submit">Réserver</button>
                      </form>
                    )
                  ) : null}
                </div>
              );
            })}
          </section>
        );
      })}
    </main>
  );
}
