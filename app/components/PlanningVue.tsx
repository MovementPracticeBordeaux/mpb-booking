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

function CarteCours({ c, connecte, reserverCours, dateISO }: {
  c: CoursJour;
  connecte: boolean;
  reserverCours: (formData: FormData) => void;
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
          <span style={{ color: '#9ef29e', fontSize: 12, fontWeight: 600 }}>Réservé ✓</span>
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

export default function PlanningVue({
  jours,
  connecte,
  reserverCours,
}: {
  jours: JourPlanning[];
  connecte: boolean;
  reserverCours: (formData: FormData) => void;
}) {
  const [vue, setVue] = useState<'semaine' | 'jour'>('semaine');
  const [offsetSemaine, setOffsetSemaine] = useState(0);
  const [offsetJour, setOffsetJour] = useState(0);

  // Regroupe les jours par semaine (blocs de 7 à partir du premier jour reçu,
  // qui est toujours "aujourd'hui").
  const semaines: JourPlanning[][] = [];
  for (let i = 0; i < jours.length; i += 7) {
    semaines.push(jours.slice(i, i + 7));
  }

  const semaineActuelle = semaines[offsetSemaine] ?? [];
  const jourActuel = jours[offsetJour];

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
      <style>{`
        .grille-semaine { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        @media (max-width: 480px) {
          .grille-semaine { grid-template-columns: 1fr; }
        }
      `}</style>
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

          <div className="grille-semaine">
            {semaineActuelle.map((j) => (
              <div key={j.dateISO} style={j.enVacances ? { opacity: 0.4 } : undefined}>
                <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: COULEURS.texteFaible, marginBottom: 8 }}>
                  {NOMS_JOURS_COURTS[j.jourSemaine]} {formaterDate(j.dateISO)}
                </p>
                {j.enVacances ? (
                  <p style={{ fontSize: 12, color: COULEURS.texteFaible }}>🏝️ Vacances</p>
                ) : j.cours.length === 0 ? (
                  <p style={{ fontSize: 12, color: COULEURS.texteFaible, opacity: 0.6 }}>—</p>
                ) : (
                  j.cours.map((c) => (
                    <CarteCours key={c.id} c={c} connecte={connecte} reserverCours={reserverCours} dateISO={j.dateISO} />
                  ))
                )}
              </div>
            ))}
          </div>
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
              <CarteCours key={c.id} c={c} connecte={connecte} reserverCours={reserverCours} dateISO={jourActuel.dateISO} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
