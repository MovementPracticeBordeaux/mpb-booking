import { supabaseAdmin } from '@/lib/supabase-server';
import { ajouterCours, desactiverCours, modifierCours, definirSemaineReference, ajouterVacances, supprimerVacances, reserverCoursPourEleve, annulerReservationAdmin } from '../actions';
import { calculerSemaine } from '@/lib/semaine';
import AdminSeancesCarousel from '../AdminSeancesCarousel';

export const dynamic = 'force-dynamic';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const COULEUR_SEMAINE: Record<'A' | 'B', string> = { A: '#4FC3F7', B: '#FFB74D' };
const JOURS_A_VENIR = 14; // fenêtre à venir de la section "Séances"
const JOURS_PASSES = 14; // fenêtre passée de la même section, pour pouvoir gérer les no-show/erreurs après coup

export default async function AdminPlanningPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();

  const { data: ref } = await admin.from('semaine_reference').select('*').eq('id', 1).single();
  const { data: periodesVacances } = await admin.from('vacances').select('*').order('date_debut');
  const { data: coursListe } = await admin
    .from('cours')
    .select('*')
    .eq('actif', true)
    .order('semaine')
    .order('jour_semaine');

  // Pour le sélecteur "+ Ajouter un élève" sur chaque séance, dans le
  // carrousel plus bas.
  const { data: eleves } = await admin.from('profiles').select('id, nom, email').order('email');

  // --- Séances datées (passées et à venir) + inscrits nommés (admin uniquement) ---
  // À la différence de "Créneaux actifs" (le modèle récurrent A/B), cette
  // section calcule les VRAIES dates des séances et liste les élèves
  // inscrits pour chacune, avec la possibilité de retirer un élève d'une
  // séance (y compris passée) et de le recréditer. Jamais visible côté élève.
  const { data: reservationsAVenir } = await admin
    .from('reservations')
    .select('eleve_id, cours_id, date_seance')
    .eq('statut', 'confirmee');

  const idsEleves = [...new Set((reservationsAVenir ?? []).map((r) => r.eleve_id))];
  const { data: profilsEleves } = idsEleves.length > 0
    ? await admin.from('profiles').select('id, nom, email').in('id', idsEleves)
    : { data: [] as { id: string; nom: string | null; email: string | null }[] };
  const nomParEleveId = new Map((profilsEleves ?? []).map((p) => [p.id, p.nom || p.email || 'Élève']));

  type Inscrit = { eleveId: string; nom: string };
  const inscritsParSeance = new Map<string, Inscrit[]>();
  for (const r of reservationsAVenir ?? []) {
    const cle = `${r.cours_id}::${r.date_seance}`;
    const liste = inscritsParSeance.get(cle) ?? [];
    liste.push({ eleveId: r.eleve_id, nom: nomParEleveId.get(r.eleve_id) ?? 'Élève' });
    inscritsParSeance.set(cle, liste);
  }

  // Regroupe les séances par jour pour le carrousel admin (même principe
  // visuel que le planning public, en un seul jour à la fois plutôt qu'une
  // liste empilée qui prenait beaucoup trop de place).
  type JourAdminCarousel = {
    dateISO: string;
    jourSemaine: number;
    enVacances: boolean;
    cours: { coursId: string; discipline: string; heureDebut: string; heureFin: string; inscrits: Inscrit[] }[];
  };
  const joursCarousel: JourAdminCarousel[] = [];
  let indexAujourdhuiCarousel = JOURS_PASSES;
  if (ref) {
    const lundiRef = new Date(ref.date_lundi_reference);
    const periodesVacancesActives = periodesVacances ?? [];
    const aujourdhuiISO = new Date().toISOString().slice(0, 10);
    for (let i = -JOURS_PASSES; i < JOURS_A_VENIR; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr === aujourdhuiISO) indexAujourdhuiCarousel = i + JOURS_PASSES;
      const enVacances = periodesVacancesActives.some((v) => dateStr >= v.date_debut && dateStr <= v.date_fin);
      const semaine = calculerSemaine(d, lundiRef, ref.semaine_ce_lundi);
      const coursDuJour = enVacances ? [] : (coursListe ?? []).filter((c) => c.jour_semaine === d.getDay() && c.semaine === semaine);
      joursCarousel.push({
        dateISO: dateStr,
        jourSemaine: d.getDay(),
        enVacances,
        cours: coursDuJour.map((c) => ({
          coursId: c.id,
          discipline: c.discipline as string,
          heureDebut: (c.heure_debut as string).slice(0, 5),
          heureFin: (c.heure_fin as string).slice(0, 5),
          inscrits: inscritsParSeance.get(`${c.id}::${dateStr}`) ?? [],
        })),
      });
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Planning collectif</h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>
          ✅ {searchParams.succes}
        </p>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2>Séances — inscrits</h2>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          Visible uniquement par toi. Les élèves ne voient jamais ce nombre. Couvre les {JOURS_PASSES} derniers jours
          et les {JOURS_A_VENIR} prochains — tu peux retirer un élève d'une séance passée ou du jour même (sa formule
          est recréditée automatiquement), ou en ajouter un directement sur la séance concernée via "+ Ajouter un
          élève" (mêmes règles que la réservation normale : pass actif, quota, gel...).
        </p>
        <AdminSeancesCarousel
          jours={joursCarousel}
          indexAujourdhui={indexAujourdhuiCarousel}
          eleves={(eleves ?? []).map((e) => ({ id: e.id, nom: e.nom, email: e.email }))}
          reserverCoursPourEleve={reserverCoursPourEleve}
          annulerReservationAdmin={annulerReservationAdmin}
        />
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
                          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                            <details>
                              <summary style={{ fontSize: 11, cursor: 'pointer' }}>✏️ Modifier</summary>
                              <form action={modifierCours} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, minWidth: 140 }}>
                                <input type="hidden" name="id" value={c.id} />
                                <input name="discipline" defaultValue={c.discipline} required style={{ fontSize: 11, padding: 4 }} />
                                <input name="lieu" defaultValue={c.lieu ?? ''} placeholder="Lieu" style={{ fontSize: 11, padding: 4 }} />
                                <button type="submit" style={{ fontSize: 11 }}>Enregistrer</button>
                                <span style={{ fontSize: 10, opacity: 0.5 }}>
                                  Les élèves déjà inscrits sur ce créneau le restent.
                                </span>
                              </form>
                            </details>
                            <form action={desactiverCours}>
                              <input type="hidden" name="id" value={c.id} />
                              <button type="submit" style={{ fontSize: 11 }}>Désactiver</button>
                            </form>
                          </div>
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
