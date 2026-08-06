import { supabaseServer } from '@/lib/supabase-server';
import { calculerSemaine } from '@/lib/semaine';
import { reserverCours } from '../booking/actions';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default async function PlanningPage({ searchParams }: { searchParams: { erreur?: string } }) {
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
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 40, letterSpacing: 1, margin: '0 0 20px' }}>
        PLANNING
      </h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}
      {!user && (
        <p style={{ color: COULEURS.texteAtt }}>
          <a href="/login" style={{ color: '#FF2D78' }}>Connecte-toi</a> pour réserver un cours.
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
          <section key={date.toISOString()} style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>
              {JOURS[date.getDay()]} {date.toLocaleDateString('fr-FR')} · semaine {semaine}
            </p>
            {coursDuJour.map((c) => {
              const dateStr = date.toISOString().slice(0, 10);
              const dejaReserve = mesReservations.some(
                (r) => r.cours_id === c.id && r.date_seance === dateStr
              );
              return (
                <div
                  key={c.id}
                  style={{
                    border: `1px solid ${COULEURS.bordure}`,
                    background: COULEURS.surface,
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.5 }}>
                      {c.discipline.toUpperCase()}
                    </strong>
                    <div style={{ fontSize: 13, color: COULEURS.texteAtt }}>
                      {c.heure_debut.slice(0, 5)} - {c.heure_fin.slice(0, 5)}
                      {c.lieu ? ` · ${c.lieu}` : ''}
                    </div>
                  </div>
                  {user ? (
                    dejaReserve ? (
                      <span style={{ color: '#9ef29e', fontSize: 13, fontWeight: 600 }}>Réservé ✓</span>
                    ) : (
                      <form action={reserverCours}>
                        <input type="hidden" name="cours_id" value={c.id} />
                        <input type="hidden" name="date_seance" value={dateStr} />
                        <button
                          type="submit"
                          style={{ background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Réserver
                        </button>
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
