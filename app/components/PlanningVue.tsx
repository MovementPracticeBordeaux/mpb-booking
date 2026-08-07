'use client';

import { useEffect, useRef } from 'react';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

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

const NOMS_JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formaterDate(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

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
        border: c.dejaReserve ? '1px solid rgba(80,200,120,0.4)' : `1px solid ${COULEURS.bordure}`,
        background: c.dejaReserve ? 'rgba(80,200,120,0.1)' : 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: '8px 10px',
        marginBottom: 8,
      }}
    >
      <strong style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, letterSpacing: 0.4, display: 'block' }}>
        {c.discipline.toUpperCase()}
      </strong>
      <div style={{ fontSize: 11, color: COULEURS.texteAtt, marginBottom: 6 }}>
        {c.heureDebut} – {c.heureFin}
        {c.lieu ? ` · ${c.lieu}` : ''}
      </div>
      {connecte && (
        c.dejaReserve ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#9ef29e', fontSize: 11, fontWeight: 600 }}>Réservé ✓</span>
            <form action={annulerReservation}>
              <input type="hidden" name="cours_id" value={c.id} />
              <input type="hidden" name="date_seance" value={dateISO} />
              <button
                type="submit"
                style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: '4px 0' }}
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
              style={{ background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              Réserver
            </button>
          </form>
        )
      )}
    </div>
  );
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
  const carrouselRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayISO = jours[indexAujourdhui]?.dateISO;

  function centrerSur(index: number) {
    const conteneur = carrouselRef.current;
    const carte = conteneur?.children[index] as HTMLElement | undefined;
    if (!conteneur || !carte) return;
    conteneur.scrollTo({
      left: carte.offsetLeft - (conteneur.offsetWidth - carte.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }

  // Centre sur aujourd'hui au premier chargement (sans animation).
  useEffect(() => {
    const conteneur = carrouselRef.current;
    const carte = conteneur?.children[indexAujourdhui] as HTMLElement | undefined;
    if (!conteneur || !carte) return;
    conteneur.scrollLeft = carte.offsetLeft - (conteneur.offsetWidth - carte.offsetWidth) / 2;
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
    <div style={{ marginBottom: 40 }}>
      <style>{`
        .carrousel-planning {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 12px;
          padding: 4px 4px 12px;
          -webkit-overflow-scrolling: touch;
        }
        .carrousel-planning::-webkit-scrollbar { height: 5px; }
        .carrousel-planning::-webkit-scrollbar-thumb { background: ${COULEURS.bordure}; border-radius: 4px; }
        .jour-carte-planning {
          scroll-snap-align: center;
          flex: 0 0 82%;
          max-width: 320px;
          padding: 16px;
          box-sizing: border-box;
        }
        @media (min-width: 640px) {
          .jour-carte-planning { flex-basis: 260px; }
        }
        @media (min-width: 1024px) {
          .jour-carte-planning { flex-basis: 175px; max-width: 175px; padding: 12px; }
        }
        input[type="date"].champ-date { color-scheme: dark; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => centrerSur(indexAujourdhui)} style={boutonStyle}>
          Aujourd&rsquo;hui
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${COULEURS.bordure}`, borderRadius: 999, padding: '5px 6px 5px 14px' }}>
          <label htmlFor="aller-a-date" style={{ fontSize: 12, color: COULEURS.texteFaible }}>Aller au :</label>
          <input
            ref={dateInputRef}
            id="aller-a-date"
            type="date"
            className="champ-date"
            min={jours[0]?.dateISO}
            max={jours[jours.length - 1]?.dateISO}
            defaultValue={todayISO}
            onChange={(e) => allerADate(e.target.value)}
            style={{ background: COULEURS.surfaceForte, border: 'none', borderRadius: 999, padding: '5px 10px', color: COULEURS.texte, fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div className="carrousel-planning" ref={carrouselRef}>
        {jours.map((j, i) => {
          const estAujourdhui = j.dateISO === todayISO;
          const estPasse = i < indexAujourdhui;
          const sansCours = !j.enVacances && j.cours.length === 0;

          return (
            <div
              key={j.dateISO}
              className="jour-carte-planning"
              style={{
                border: estAujourdhui ? '1px solid #FF2D78' : `1px solid ${COULEURS.bordure}`,
                boxShadow: estAujourdhui ? '0 0 0 1px rgba(255,45,120,0.35), 0 8px 30px rgba(255,45,120,0.15)' : undefined,
                background: estAujourdhui ? COULEURS.surfaceForte : COULEURS.surface,
                borderRadius: 16,
                opacity: estAujourdhui ? 1 : estPasse ? 0.45 : (j.enVacances || sansCours) ? 0.7 : 0.85,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div>
                  <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.5, ...(estAujourdhui ? GRADIENT_TEXTE : {}) }}>
                    {NOMS_JOURS_COURTS[j.jourSemaine]}
                  </span>
                  <br />
                  <span style={{ fontSize: 12, color: COULEURS.texteFaible }}>{formaterDate(j.dateISO)}</span>
                </div>
                {estAujourdhui && (
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#FF2D78', fontWeight: 700 }}>
                    Aujourd&rsquo;hui
                  </span>
                )}
              </div>

              {j.enVacances ? (
                <p style={{ fontSize: 12, color: COULEURS.texteFaible, textAlign: 'center', padding: '20px 0', margin: 0 }}>🏝️ Vacances</p>
              ) : sansCours ? (
                <p style={{ fontSize: 12, color: COULEURS.texteFaible, textAlign: 'center', padding: '20px 0', margin: 0 }}>Pas de cours</p>
              ) : (
                j.cours.map((c) => (
                  <CarteCours key={c.id} c={c} connecte={connecte} reserverCours={reserverCours} annulerReservation={annulerReservation} dateISO={j.dateISO} />
                ))
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
