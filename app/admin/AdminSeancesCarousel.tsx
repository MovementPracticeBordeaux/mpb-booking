'use client';

import { useEffect, useRef, useState } from 'react';
import { positionCentree, centrerAuChargement } from '@/lib/centrer-carte';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import SelecteurDiscipline from './SelecteurDiscipline';

export type Inscrit = { eleveId: string; nom: string };
export type Eleve = { id: string; nom: string | null; email: string };

export type CoursDuJour = {
  coursId: string;
  discipline: string;
  heureDebut: string;
  heureFin: string;
  inscrits: Inscrit[];
};

export type CoachingDuJour = {
  id: string;
  nom: string;
  heureDebut: string;
  heureFin: string;
  lieu: string | null;
  note: string | null;
  heuresDecomptees: number;
};

export type JourAdmin = {
  dateISO: string; // YYYY-MM-DD
  jourSemaine: number; // 0 = dimanche
  semaine: 'A' | 'B';
  cours: CoursDuJour[];
  coachings: CoachingDuJour[];
  enVacances?: boolean;
};

type Action = (formData: FormData) => void;

const VIOLET = '#8B5CF6';
const NOMS_JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const styleChamp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '5px 8px', borderRadius: 6,
  border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte,
};

function CarteCoaching({ k, supprimerCoaching }: { k: CoachingDuJour; supprimerCoaching: Action }) {
  return (
    <div style={{ border: `1px solid ${VIOLET}66`, background: 'rgba(139,92,246,0.08)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
      <strong style={{ fontFamily: POLICE_DISPLAY, fontSize: 13, letterSpacing: 0.3, display: 'block', color: VIOLET }}>
        COACHING · {k.nom}
      </strong>
      <div style={{ fontSize: 10, color: COULEURS.texteAtt }}>
        {k.heureDebut} – {k.heureFin}{k.lieu ? ` · ${k.lieu}` : ''}
        {k.heuresDecomptees > 0 ? ` · ${k.heuresDecomptees} h décomptée${k.heuresDecomptees > 1 ? 's' : ''}` : ''}
      </div>
      {k.note && <div style={{ fontSize: 11, marginTop: 4, whiteSpace: 'pre-wrap' }}>{k.note}</div>}
      <details style={{ marginTop: 4 }}>
        <summary style={{ fontSize: 10, color: COULEURS.texteAtt, cursor: 'pointer' }}>Supprimer</summary>
        <form action={supprimerCoaching} style={{ marginTop: 4 }}>
          <input type="hidden" name="id" value={k.id} />
          <button type="submit" style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, border: '1px solid #a44', background: 'none', color: '#f88', cursor: 'pointer' }}>
            Confirmer{k.heuresDecomptees > 0 ? ' (heures recréditées)' : ''}
          </button>
        </form>
      </details>
    </div>
  );
}

function PanneauAjout({
  j, eleves, creditsCoaching, disciplinesExistantes, ajouterCoaching, ajouterCoursDepuisJour,
}: {
  j: JourAdmin;
  eleves: Eleve[];
  creditsCoaching: Record<string, number>;
  disciplinesExistantes: string[];
  ajouterCoaching: Action;
  ajouterCoursDepuisJour: Action;
}) {
  const [onglet, setOnglet] = useState<'coaching' | 'cours'>('coaching');
  const styleOnglet = (o: 'coaching' | 'cours'): React.CSSProperties => ({
    flex: 1, fontSize: 12, padding: '6px 0', cursor: 'pointer', background: 'none', color: 'inherit',
    border: 'none', borderBottom: `2px solid ${onglet === o ? (o === 'coaching' ? VIOLET : '#FF2D78') : COULEURS.bordure}`,
    opacity: onglet === o ? 1 : 0.6, fontWeight: 600,
  });

  return (
    <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', marginBottom: 10 }}>
        <button type="button" onClick={() => setOnglet('coaching')} style={styleOnglet('coaching')}>Coaching</button>
        <button type="button" onClick={() => setOnglet('cours')} style={styleOnglet('cours')}>Cours collectif</button>
      </div>

      {onglet === 'coaching' ? (
        <form action={ajouterCoaching} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input type="hidden" name="date_seance" value={j.dateISO} />
          <select name="eleve_id" defaultValue="" style={styleChamp}>
            <option value="">-- Élève --</option>
            {eleves.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom ?? e.email}{creditsCoaching[e.id] ? ` (${creditsCoaching[e.id]} h)` : ''}
              </option>
            ))}
          </select>
          <input name="nom_libre" placeholder="ou nom, si pas de compte" style={styleChamp} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input name="heure_debut" type="time" required style={styleChamp} />
            <select name="duree_minutes" defaultValue="60" style={styleChamp}>
              <option value="60">1 h</option>
              <option value="90">1 h 30</option>
              <option value="120">2 h</option>
            </select>
          </div>
          <input name="lieu" placeholder="Lieu (optionnel)" style={styleChamp} />
          <textarea name="note" placeholder="Note (optionnel)" rows={2} style={{ ...styleChamp, fontFamily: 'inherit' }} />
          <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" name="decompter" defaultChecked /> Décompter du crédit de l'élève
          </label>
          <button type="submit" style={{ fontSize: 12, padding: '6px 0', borderRadius: 999, border: `1px solid ${VIOLET}`, background: 'none', color: VIOLET, fontWeight: 600, cursor: 'pointer' }}>
            Ajouter le coaching
          </button>
        </form>
      ) : (
        <form action={ajouterCoursDepuisJour} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input type="hidden" name="jour_semaine" value={j.jourSemaine} />
          <input type="hidden" name="semaine" value={j.semaine} />
          <SelecteurDiscipline disciplinesExistantes={disciplinesExistantes} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input name="heure_debut" type="time" required style={styleChamp} />
            <input name="heure_fin" type="time" required style={styleChamp} />
          </div>
          <input name="lieu" placeholder="Lieu (optionnel)" style={styleChamp} />
          <p style={{ fontSize: 11, color: COULEURS.texteFaible, margin: 0 }}>
            Chaque {NOMS_JOURS_LONGS[j.jourSemaine]} en semaine {j.semaine}
          </p>
          <button type="submit" style={{ fontSize: 12, padding: '6px 0', borderRadius: 999, border: '1px solid #FF2D78', background: 'none', color: '#FF2D78', fontWeight: 600, cursor: 'pointer' }}>
            Ajouter le cours
          </button>
        </form>
      )}
    </div>
  );
}

const NOMS_JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formaterDate(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function AdminSeancesCarousel({
  jours,
  indexAujourdhui,
  eleves,
  reserverCoursPourEleve,
  annulerReservationAdmin,
  ajouterCoaching,
  supprimerCoaching,
  ajouterCoursDepuisJour,
  disciplinesExistantes,
  creditsCoaching,
}: {
  jours: JourAdmin[];
  indexAujourdhui: number;
  eleves: Eleve[];
  reserverCoursPourEleve: Action;
  annulerReservationAdmin: Action;
  ajouterCoaching: Action;
  supprimerCoaching: Action;
  ajouterCoursDepuisJour: Action;
  disciplinesExistantes: string[];
  creditsCoaching: Record<string, number>;
}) {
  const [jourOuvert, setJourOuvert] = useState<string | null>(null);
  const carrouselRef = useRef<HTMLDivElement>(null);
  const todayISO = jours[indexAujourdhui]?.dateISO;

  function centrerSur(index: number) {
    const conteneur = carrouselRef.current;
    const carte = conteneur?.children[index] as HTMLElement | undefined;
    if (!conteneur || !carte) return;
    // 'smooth' combiné à scroll-snap-type: mandatory (voir CSS plus bas)
    // est peu fiable selon les navigateurs — le défilement animé se fait
    // parfois interrompre par le magnétisme et revient à sa position de
    // départ (même correctif que sur le planning public, PlanningVue.tsx).
    conteneur.scrollTo({
      left: positionCentree(conteneur, carte),
      behavior: 'auto',
    });
  }

  useEffect(() => {
    centrerAuChargement(carrouselRef.current, indexAujourdhui);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function allerADate(dateISO: string) {
    const index = jours.findIndex((j) => j.dateISO === dateISO);
    if (index !== -1) centrerSur(index);
  }

  const boutonStyle: React.CSSProperties = {
    borderRadius: 999,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    border: `1px solid ${COULEURS.bordure}`,
    background: 'none',
    color: COULEURS.texteAtt,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div>
      <style>{`
        .carrousel-admin-seances {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 12px;
          padding: 4px 4px 12px;
          -webkit-overflow-scrolling: touch;
        }
        .carrousel-admin-seances::-webkit-scrollbar { height: 5px; }
        .carrousel-admin-seances::-webkit-scrollbar-thumb { background: ${COULEURS.bordure}; border-radius: 4px; }
        .jour-carte-admin-seances {
          scroll-snap-align: center;
          flex: 0 0 84%;
          max-width: 340px;
          padding: 16px;
          box-sizing: border-box;
        }
        @media (min-width: 640px) {
          .jour-carte-admin-seances { flex-basis: 280px; }
        }
        @media (min-width: 1024px) {
          .jour-carte-admin-seances { flex-basis: 200px; max-width: 200px; padding: 12px; }
        }
        input[type="date"].champ-date-admin { color-scheme: dark; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={() => centrerSur(indexAujourdhui)} style={boutonStyle}>
          Aujourd&rsquo;hui
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '5px 6px 5px 14px' }}>
          <label htmlFor="aller-a-date-admin" style={{ fontSize: 12, color: COULEURS.texteFaible }}>Aller au :</label>
          <input
            id="aller-a-date-admin"
            type="date"
            className="champ-date-admin"
            min={jours[0]?.dateISO}
            max={jours[jours.length - 1]?.dateISO}
            defaultValue={todayISO}
            onChange={(e) => allerADate(e.target.value)}
            style={{ background: COULEURS.surfaceForte, border: 'none', borderRadius: 999, padding: '5px 10px', color: COULEURS.texte, fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div className="carrousel-admin-seances" ref={carrouselRef}>
        {jours.map((j, i) => {
          const estAujourdhui = j.dateISO === todayISO;
          const estPasse = i < indexAujourdhui;
          // Cours collectifs et coachings mélangés dans l'ordre chronologique.
          const elements = [
            ...j.cours.map((c) => ({ type: 'cours' as const, heure: c.heureDebut, c })),
            ...j.coachings.map((k) => ({ type: 'coaching' as const, heure: k.heureDebut, k })),
          ].sort((a, b) => a.heure.localeCompare(b.heure));
          const sansCours = !j.enVacances && elements.length === 0;
          const nbInscritsTotal = j.cours.reduce((n, c) => n + c.inscrits.length, 0);

          return (
            <div
              key={j.dateISO}
              className="jour-carte-admin-seances"
              style={{
                border: estAujourdhui ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
                boxShadow: estAujourdhui ? '0 0 0 1px rgba(255,45,120,0.35), 0 8px 30px rgba(255,45,120,0.15)' : undefined,
                background: estAujourdhui ? COULEURS.surfaceForte : COULEURS.surface,
                borderRadius: 16,
                opacity: estAujourdhui ? 1 : estPasse ? 0.55 : (j.enVacances || sansCours) ? 0.7 : 0.9,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div>
                  <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 18, letterSpacing: 0.5, ...(estAujourdhui ? GRADIENT_TEXTE : {}) }}>
                    {NOMS_JOURS_COURTS[j.jourSemaine]}
                  </span>
                  <br />
                  <span style={{ fontSize: 11, color: COULEURS.texteFaible }}>{formaterDate(j.dateISO)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {estAujourdhui ? (
                    <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#FF2D78', fontWeight: 700 }}>
                      Aujourd&rsquo;hui
                    </span>
                  ) : estPasse ? (
                    <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: COULEURS.texteFaible }}>
                      Passée
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Ajouter un coaching ou un cours"
                    onClick={() => setJourOuvert(jourOuvert === j.dateISO ? null : j.dateISO)}
                    style={{
                      width: 32, height: 32, borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'none',
                      color: COULEURS.texte, fontSize: 18, lineHeight: 1, cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    {jourOuvert === j.dateISO ? '×' : '+'}
                  </button>
                </div>
              </div>

              {jourOuvert === j.dateISO && (
                <PanneauAjout
                  j={j}
                  eleves={eleves}
                  creditsCoaching={creditsCoaching}
                  disciplinesExistantes={disciplinesExistantes}
                  ajouterCoaching={ajouterCoaching}
                  ajouterCoursDepuisJour={ajouterCoursDepuisJour}
                />
              )}

              {j.enVacances && elements.length === 0 ? (
                <p style={{ fontSize: 12, color: COULEURS.texteFaible, textAlign: 'center', padding: '16px 0', margin: 0 }}>🏝️ Vacances</p>
              ) : sansCours ? (
                <p style={{ fontSize: 12, color: COULEURS.texteFaible, textAlign: 'center', padding: '16px 0', margin: 0 }}>Pas de cours</p>
              ) : (
                elements.map((el) => el.type === 'coaching' ? (
                  <CarteCoaching key={el.k.id} k={el.k} supprimerCoaching={supprimerCoaching} />
                ) : ((c: CoursDuJour) => (
                  <div
                    key={c.coursId}
                    style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}
                  >
                    <strong style={{ fontFamily: POLICE_DISPLAY, fontSize: 13, letterSpacing: 0.3, display: 'block' }}>
                      {c.discipline.toUpperCase()}
                    </strong>
                    <div style={{ fontSize: 10, color: COULEURS.texteAtt, marginBottom: 6 }}>
                      {c.heureDebut} – {c.heureFin} · {c.inscrits.length} inscrit{c.inscrits.length !== 1 ? 's' : ''}
                    </div>
                    {c.inscrits.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {c.inscrits.map((inscrit) => (
                          <li
                            key={inscrit.eleveId}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 11, padding: '3px 0' }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inscrit.nom}</span>
                            <form action={annulerReservationAdmin}>
                              <input type="hidden" name="eleve_id" value={inscrit.eleveId} />
                              <input type="hidden" name="cours_id" value={c.coursId} />
                              <input type="hidden" name="date_seance" value={j.dateISO} />
                              <button
                                type="submit"
                                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid #663', background: 'none', color: '#f88', cursor: 'pointer', flexShrink: 0 }}
                              >
                                Retirer
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                    <details>
                      <summary style={{ fontSize: 10, color: COULEURS.texteAtt, cursor: 'pointer', marginTop: c.inscrits.length > 0 ? 6 : 0 }}>
                        + Ajouter un élève
                      </summary>
                      <form action={reserverCoursPourEleve} style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        <input type="hidden" name="seance" value={`${c.coursId}::${j.dateISO}`} />
                        <select
                          name="eleve_id"
                          required
                          style={{ flex: 1, fontSize: 10, padding: '4px 6px', borderRadius: 6, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte }}
                        >
                          <option value="">-- Élève --</option>
                          {eleves.map((e) => (
                            <option key={e.id} value={e.id}>{e.nom ?? e.email}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid #4a4', background: 'none', color: '#8f8', cursor: 'pointer', flexShrink: 0 }}
                        >
                          Réserver
                        </button>
                      </form>
                    </details>
                  </div>
                ))(el.c))
              )}
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: COULEURS.texteFaible, margin: '6px 0 0' }}>
        ← swipe ou scroll pour changer de jour →
      </p>
    </div>
  );
}
