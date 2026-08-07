'use client';

import { useState } from 'react';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';

export type CoursJour = {
  id: string;
  discipline: string;
  heureDebut: string;
  heureFin: string;
  lieu: string | null;
  dejaReserve: boolean;
};

export type JourPlanning = {
  dateISO: string; // YYYY-MM-DD
  jourSemaine: number; // 0 = dimanche
  semaine: 'A' | 'B';
  cours: CoursJour[];
  enVacances?: boolean;
};

const NOMS_JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const NOMS_JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formaterDate(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function minutesDe(heure: string) {
  const [h, m] = heure.split(':').map(Number);
  return h * 60 + m;
}

// Hauteur d'une heure dans la grille (px). 1px = 1min pour un calcul simple.
const HAUTEUR_HEURE = 60;

// Carte détaillée utilisée dans la vue "Jour" (confort de lecture + réservation).
function CarteCours({ c, connecte, reserverCours, annulerReservation, dateISO }: {
  c: CoursJour;
  connecte: boolean;
  reserverCours: (formData: FormData) => void;
  annulerReservation: (formData: FormData) => void;
  dateISO: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${COULEURS.bordure}`,
        background: COULEURS.surface,
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 8,
      }}
    >
      <strong style={{ fontFamily: POLICE_DISPLAY, fontSize: 16, letterSpacing: 0.5, display: 'block' }}>
        {c.discipline.toUpperCase()}
      </strong>
      <div style={{ fontSize: 12, color: COULEURS.texteAtt, marginBottom: 8 }}>
        {c.heureDebut} - {c.heureFin}
        {c.lieu ? ` · ${c.lieu}` : ''}
      </div>
      {connecte && (
        c.dejaReserve ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#9ef29e', fontSize: 12, fontWeight: 600 }}>Réservé ✓</span>
            <form action={annulerReservation}>
              <input type="hidden" name="cours_id" value={c.id} />
              <input type="hidden" name="date_seance" value={dateISO} />
              <button
                type="submit"
                style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: '6px 0' }}
              >
                Annuler
              </button>
            </form>
          </div>
        ) : (
          <form action={reserverCours}>
            <input type="hidden" name="cours_id" value={c.id} />
            <input type="hidden" name="date_seance" value={dateISO} />
            <button
              type="submit"
              style={{ background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Réserver
            </button>
          </form>
        )
      )}
    </div>
  );
}

// Bloc de cours positionné dans la grille horaire (vue "Semaine").
function BlocGrille({ c, top, hauteur, connecte, reserverCours, annulerReservation, dateISO }: {
  c: CoursJour;
  top: number;
  hauteur: number;
  connecte: boolean;
  reserverCours: (formData: FormData) => void;
  annulerReservation: (formData: FormData) => void;
  dateISO: string;
}) {
  const bookable = connecte && !c.dejaReserve;
  const fondBloc = c.dejaReserve ? 'rgba(80,200,120,0.14)' : COULEURS.surfaceForte;
  const accent = c.dejaReserve ? '#4caf7d' : '#FF8A00';

  const contenu = (
    <>
      <strong
        style={{
          fontFamily: POLICE_DISPLAY,
          fontSize: 13,
          letterSpacing: 0.4,
          lineHeight: 1.1,
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {c.discipline.toUpperCase()}
      </strong>
      <span style={{ fontSize: 11, color: COULEURS.texteAtt, whiteSpace: 'nowrap' }}>
        {c.heureDebut}–{c.heureFin}
      </span>
      {c.dejaReserve && (
        <span style={{ display: 'block', fontSize: 10, color: '#9ef29e', fontWeight: 600 }}>Réservé ✓</span>
      )}
    </>
  );

  const styleBloc: React.CSSProperties = {
    position: 'absolute',
    top,
    height: Math.max(hauteur, 34),
    left: 3,
    right: 3,
    background: fondBloc,
    borderRadius: 8,
    borderLeft: `3px solid ${accent}`,
    padding: '5px 7px',
    overflow: 'hidden',
    textAlign: 'left',
  };

  // Réservable : tout le bloc est un bouton de réservation.
  if (bookable) {
    return (
      <form action={reserverCours} style={{ position: 'absolute', top, height: Math.max(hauteur, 34), left: 3, right: 3 }}>
        <input type="hidden" name="cours_id" value={c.id} />
        <input type="hidden" name="date_seance" value={dateISO} />
        <button
          type="submit"
          title={`Réserver ${c.discipline} (${c.heureDebut}–${c.heureFin})`}
          style={{ ...styleBloc, top: 0, height: '100%', left: 0, right: 0, width: '100%', border: 'none', borderLeft: `3px solid ${accent}`, color: COULEURS.texte, cursor: 'pointer' }}
        >
          {contenu}
        </button>
      </form>
    );
  }

  // Déjà réservé : bloc + petit lien "Annuler".
  if (connecte && c.dejaReserve) {
    return (
      <div style={styleBloc}>
        {contenu}
        <form action={annulerReservation}>
          <input type="hidden" name="cours_id" value={c.id} />
          <input type="hidden" name="date_seance" value={dateISO} />
          <button
            type="submit"
            style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 10, textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: 2 }}
          >
            Annuler
          </button>
        </form>
      </div>
    );
  }

  // Non connecté : simple affichage.
  return <div style={styleBloc}>{contenu}</div>;
}

export default function PlanningVue({
  jours,
  connecte,
  reserverCours,
  annulerReservation,
  indexAujourdhui = 0,
}: {
  jours: JourPlanning[];
  connecte: boolean;
  reserverCours: (formData: FormData) => void;
  annulerReservation: (formData: FormData) => void;
  indexAujourdhui?: number;
}) {
  const [vue, setVue] = useState<'semaine' | 'jour'>('semaine');
  const [offsetSemaine, setOffsetSemaine] = useState(0);
  const [offsetJour, setOffsetJour] = useState(indexAujourdhui);

  // Regroupe les jours par semaine (blocs de 7 à partir du premier jour reçu,
  // qui est toujours "aujourd'hui").
  const semaines: JourPlanning[][] = [];
  for (let i = 0; i < jours.length; i += 7) {
    semaines.push(jours.slice(i, i + 7));
  }

  const semaineActuelle = semaines[offsetSemaine] ?? [];
  const jourActuel = jours[offsetJour];
  const todayISO = jours[indexAujourdhui]?.dateISO;

  // Bornes de l'axe horaire de la semaine affichée (arrondies à l'heure pleine).
  const coursSemaine = semaineActuelle.flatMap((j) => j.cours);
  const hasCours = coursSemaine.length > 0;
  const minStart = hasCours ? Math.min(...coursSemaine.map((c) => minutesDe(c.heureDebut))) : 9 * 60;
  const maxEnd = hasCours ? Math.max(...coursSemaine.map((c) => minutesDe(c.heureFin))) : 21 * 60;
  const axisStart = Math.floor(minStart / 60) * 60;
  const axisEnd = Math.ceil(maxEnd / 60) * 60;
  const hauteurGrille = (axisEnd - axisStart) * (HAUTEUR_HEURE / 60);
  const heures: number[] = [];
  for (let h = axisStart / 60; h <= axisEnd / 60; h++) heures.push(h);

  const boutonStyle = (actif: boolean) => ({
    background: actif ? GRADIENT : 'none',
    color: actif ? 'white' : COULEURS.texteAtt,
    border: actif ? 'none' : `1px solid ${COULEURS.bordure}`,
    borderRadius: 999,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setVue('semaine')} style={boutonStyle(vue === 'semaine')}>Semaine</button>
        <button onClick={() => setVue('jour')} style={boutonStyle(vue === 'jour')}>Jour</button>
      </div>

      {vue === 'semaine' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button
              onClick={() => setOffsetSemaine((o) => Math.max(0, o - 1))}
              disabled={offsetSemaine === 0}
              style={{ background: 'none', border: 'none', color: offsetSemaine === 0 ? COULEURS.texteFaible : COULEURS.texte, fontSize: 20, cursor: offsetSemaine === 0 ? 'default' : 'pointer' }}
              aria-label="Semaine précédente"
            >
              ‹
            </button>
            <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: 0 }}>
              {semaineActuelle[0] && formaterDate(semaineActuelle[0].dateISO)} — {semaineActuelle[6] && formaterDate(semaineActuelle[6].dateISO)}
            </p>
            <button
              onClick={() => setOffsetSemaine((o) => Math.min(semaines.length - 1, o + 1))}
              disabled={offsetSemaine >= semaines.length - 1}
              style={{ background: 'none', border: 'none', color: offsetSemaine >= semaines.length - 1 ? COULEURS.texteFaible : COULEURS.texte, fontSize: 20, cursor: offsetSemaine >= semaines.length - 1 ? 'default' : 'pointer' }}
              aria-label="Semaine suivante"
            >
              ›
            </button>
          </div>

          {!hasCours ? (
            <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>Aucun cours cette semaine.</p>
          ) : (
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <div style={{ minWidth: 720, display: 'grid', gridTemplateColumns: `44px repeat(7, minmax(96px, 1fr))` }}>
                {/* Ligne d'en-tête : gouttière vide + noms de jours */}
                <div />
                {semaineActuelle.map((j) => {
                  const estAujourdhui = j.dateISO === todayISO;
                  const sansCours = !j.enVacances && j.cours.length === 0;
                  return (
                    <div
                      key={`h-${j.dateISO}`}
                      style={{
                        textAlign: 'center',
                        padding: '0 2px 8px',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: estAujourdhui ? COULEURS.texte : COULEURS.texteFaible,
                        fontWeight: estAujourdhui ? 700 : 400,
                        opacity: (j.enVacances || sansCours) ? 0.7 : 1,
                      }}
                    >
                      {NOMS_JOURS_COURTS[j.jourSemaine]}
                      <br />
                      {formaterDate(j.dateISO)}
                    </div>
                  );
                })}

                {/* Ligne du corps : gouttière des heures + colonnes des jours */}
                <div style={{ position: 'relative', height: hauteurGrille }}>
                  {heures.map((h) => (
                    <div
                      key={h}
                      style={{
                        position: 'absolute',
                        top: (h * 60 - axisStart) * (HAUTEUR_HEURE / 60) - 6,
                        right: 6,
                        fontSize: 10,
                        color: COULEURS.texteFaible,
                      }}
                    >
                      {String(h).padStart(2, '0')}h
                    </div>
                  ))}
                </div>

                {semaineActuelle.map((j) => {
                  const estAujourdhui = j.dateISO === todayISO;
                  const sansCours = !j.enVacances && j.cours.length === 0;
                  return (
                    <div
                      key={`c-${j.dateISO}`}
                      style={{
                        position: 'relative',
                        height: hauteurGrille,
                        borderLeft: `1px solid ${COULEURS.bordure}`,
                        background: estAujourdhui ? 'rgba(255,138,0,0.05)' : undefined,
                        opacity: (j.enVacances || sansCours) ? 0.7 : 1,
                        // Lignes horaires en fond.
                        backgroundImage: `repeating-linear-gradient(to bottom, ${COULEURS.bordure} 0, ${COULEURS.bordure} 1px, transparent 1px, transparent ${HAUTEUR_HEURE}px)`,
                      }}
                    >
                      {j.cours.map((c) => (
                        <BlocGrille
                          key={c.id}
                          c={c}
                          top={(minutesDe(c.heureDebut) - axisStart) * (HAUTEUR_HEURE / 60)}
                          hauteur={(minutesDe(c.heureFin) - minutesDe(c.heureDebut)) * (HAUTEUR_HEURE / 60)}
                          connecte={connecte}
                          reserverCours={reserverCours}
                          annulerReservation={annulerReservation}
                          dateISO={j.dateISO}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button
              onClick={() => setOffsetJour((o) => Math.max(0, o - 1))}
              disabled={offsetJour === 0}
              style={{ background: 'none', border: 'none', color: offsetJour === 0 ? COULEURS.texteFaible : COULEURS.texte, fontSize: 20, cursor: offsetJour === 0 ? 'default' : 'pointer' }}
              aria-label="Jour précédent"
            >
              ‹
            </button>
            <p style={{ fontSize: 14, color: COULEURS.texte, margin: 0, fontWeight: 600 }}>
              {jourActuel && `${NOMS_JOURS[jourActuel.jourSemaine]} ${formaterDate(jourActuel.dateISO)} · semaine ${jourActuel.semaine}`}
            </p>
            <button
              onClick={() => setOffsetJour((o) => Math.min(jours.length - 1, o + 1))}
              disabled={offsetJour >= jours.length - 1}
              style={{ background: 'none', border: 'none', color: offsetJour >= jours.length - 1 ? COULEURS.texteFaible : COULEURS.texte, fontSize: 20, cursor: offsetJour >= jours.length - 1 ? 'default' : 'pointer' }}
              aria-label="Jour suivant"
            >
              ›
            </button>
          </div>

          {jourActuel?.enVacances ? (
            <p style={{ color: COULEURS.texteFaible }}>🏝️ Vacances, pas de cours ce jour-là.</p>
          ) : jourActuel && jourActuel.cours.length === 0 ? (
            <p style={{ color: COULEURS.texteFaible }}>Aucun cours ce jour-là.</p>
          ) : (
            jourActuel?.cours.map((c) => (
              <CarteCours key={c.id} c={c} connecte={connecte} reserverCours={reserverCours} annulerReservation={annulerReservation} dateISO={jourActuel.dateISO} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
