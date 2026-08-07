import { supabaseServer } from '@/lib/supabase-server';
import { calculerSemaine } from '@/lib/semaine';
import { annulerReservation, reserverCours } from '../booking/actions';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import PlanningVue, { JourPlanning } from '../components/PlanningVue';

export const dynamic = 'force-dynamic';

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

  // On calcule 5 semaines glissantes (35 jours) pour permettre la navigation
  // "semaine suivante" dans la vue calendrier.
  const vacDebut = ref?.vacances_debut as string | null | undefined;
  const vacFin = ref?.vacances_fin as string | null | undefined;

  const jours: JourPlanning[] = [];
  if (ref) {
    const lundiRef = new Date(ref.date_lundi_reference);
    for (let i = 0; i < 35; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const enVacances = !!(vacDebut && vacFin && dateStr >= vacDebut && dateStr <= vacFin);
      const semaine = calculerSemaine(d, lundiRef, ref.semaine_ce_lundi);
      const coursDuJour = enVacances ? [] : (coursListe ?? [])
        .filter((c) => c.jour_semaine === d.getDay() && c.semaine === semaine)
        .map((c) => {
          return {
            id: c.id as string,
            discipline: c.discipline as string,
            heureDebut: (c.heure_debut as string).slice(0, 5),
            heureFin: (c.heure_fin as string).slice(0, 5),
            lieu: c.lieu as string | null,
            dejaReserve: mesReservations.some((r) => r.cours_id === c.id && r.date_seance === dateStr),
          };
        });
      jours.push({ dateISO: dateStr, jourSemaine: d.getDay(), semaine, cours: coursDuJour, enVacances });
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 40, letterSpacing: 1, margin: '0 0 20px' }}>
        PLANNING
      </h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}
      {!user && (
        <p style={{ color: COULEURS.texteAtt, marginBottom: 20 }}>
          <a href="/login" style={{ color: '#FF2D78' }}>Connecte-toi</a> pour réserver un cours.
        </p>
      )}
      {!ref && (
        <p style={{ color: COULEURS.texteAtt }}>
          Le planning est en cours de mise à jour, reviens très bientôt !
        </p>
      )}
      {jours[0]?.enVacances && (
        <p style={{ color: COULEURS.texteAtt, marginBottom: 20 }}>
          🏝️ Sylvain est actuellement en vacances{vacFin ? ` jusqu'au ${new Date(vacFin + 'T00:00:00').toLocaleDateString('fr-FR')}` : ''}, pas de cours pour le moment — les jours concernés sont grisés ci-dessous.
        </p>
      )}
      {ref && (
        <PlanningVue
          jours={jours}
          connecte={!!user}
          reserverCours={reserverCours}
          annulerReservation={annulerReservation}
        />
      )}
    </main>
  );
}
