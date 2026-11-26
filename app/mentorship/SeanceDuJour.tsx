'use client';

// « Ma séance du jour » : une séance composée automatiquement à partir des
// objectifs en cours de l'élève (choisis par ArbreCompetences). Pour chaque
// exercice : consigne, objectif de réalisation, vidéo de référence, outils,
// et le suivi chiffré pour noter ce qui a été fait. À la fin, un clic
// consigne la séance dans le journal d'entraînement.
// Méthode de Sylvain : 60 minutes maximum ; l'essentiel (priorité n° 1)
// d'abord : s'il est fait, la séance est réussie, le reste est du bonus.

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { phraseDuJour } from '@/lib/mentorship-phrases';
import { XP_PAR_SEANCE, SEANCES_RECOMPENSEES_PAR_SEMAINE } from '@/lib/mentorship-engagement';
import { BoutonCoeur } from './Coeurs';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { ExerciceMentorship } from '@/lib/mentorship-modules';
import SuiviPerf, { usePerfs, formaterPerf, estAujourdhui } from './SuiviPerf';
import { encoderNote } from './noteJournalFormat';

export type ElementSeance = {
  moduleId: string;
  exercice: ExerciceMentorship;
  libelleNiveau: string; // "Force · niveau 2"
  couleur: string;
  brancheJournal: string; // clé de branche pour le journal ('tronc', 'force'...)
  aRetravailler: boolean;
  recuperation?: boolean; // outil de récupération : pas de suivi chiffré
  bloc: string; // « L'essentiel · Force », « Bonus · Figures »…
  essentiel?: boolean; // priorité n° 1 de la séance
};

const DUREE_MAX_MIN = 60;
const CLE_DEBUT = 'mentorat-seance-debut';

// Minuteur de séance : démarré par l'élève, mémorisé sur l'appareil pour la
// journée (un rechargement de page ne le remet pas à zéro), plafonné à 60 min.
function MinuteurSeance() {
  const [debut, setDebut] = useState<number | null>(null);
  const [, setTic] = useState(0);
  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_DEBUT);
      const t = brut ? Number(brut) : NaN;
      if (Number.isFinite(t) && new Date(t).toDateString() === new Date().toDateString()) setDebut(t);
    } catch { /* stockage indisponible : minuteur non mémorisé */ }
  }, []);
  useEffect(() => {
    if (debut === null) return;
    const id = setInterval(() => setTic((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [debut]);

  function demarrer() {
    const t = Date.now();
    setDebut(t);
    try { localStorage.setItem(CLE_DEBUT, String(t)); } catch { /* idem */ }
  }
  function reinitialiser() {
    setDebut(null);
    try { localStorage.removeItem(CLE_DEBUT); } catch { /* idem */ }
  }

  const ecoule = debut === null ? 0 : Math.floor((Date.now() - debut) / 60000);
  const fini = ecoule >= DUREE_MAX_MIN;
  const restant = Math.max(0, DUREE_MAX_MIN - ecoule);
  const couleur = fini ? '#00FF91' : restant <= 10 ? '#FFC24B' : '#ff00aa';

  return (
    <div style={{ border: `1px solid ${couleur}55`, borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Timer size={20} color={couleur} style={{ flexShrink: 0 }} />
      {debut === null ? (
        <>
          <span style={{ flexGrow: 1, fontSize: 13, color: COULEURS.texteAtt, minWidth: 180 }}>Séance de {DUREE_MAX_MIN} minutes maximum, récupération comprise.</span>
          <button type="button" onClick={demarrer} style={{ background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Démarrer les 60 min</button>
        </>
      ) : fini ? (
        <span style={{ flexGrow: 1, fontSize: 13, color: couleur, fontWeight: 600 }}>60 minutes : c'est fini pour aujourd'hui. Ce qui n'est pas fait attendra, sans culpabilité. Pense juste à noter ce que tu as fait.</span>
      ) : (
        <>
          <span style={{ flexGrow: 1, fontSize: 13, color: COULEURS.texte }}>
            <strong style={{ color: couleur, fontSize: 16 }}>{restant} min</strong> restantes sur {DUREE_MAX_MIN}
          </span>
          <span style={{ flexBasis: '100%', height: 4, borderRadius: 2, background: COULEURS.bordure, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (ecoule / DUREE_MAX_MIN) * 100)}%`, background: couleur }} />
          </span>
        </>
      )}
      {debut !== null && (
        <button type="button" onClick={reinitialiser} style={{ background: 'none', border: 'none', padding: 0, color: COULEURS.texteFaible, fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Remettre à zéro</button>
      )}
    </div>
  );
}

type BrancheCycle = { domaine: string; label: string; couleur: string; noeudId: string };
export type InfosCycle = { axe: string; options: { cle: string; label: string }[]; branches: BrancheCycle[]; baseValidee: boolean };

function debutSemaine(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export default function SeanceDuJour({ elements, cycle, onChangerCycle, onOuvrirVideo, onFermer }: {
  elements: ElementSeance[];
  cycle: InfosCycle | null;
  onChangerCycle: (c: { axe?: any }) => void;
  onOuvrirVideo: (url: string, titre: string) => void;
  onFermer: () => void;
}) {
  const { parModule } = usePerfs();
  const [ressenti, setRessenti] = useState('');
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'fait'>('saisie');
  const supabase = supabaseBrowser();

  const perfDuJour = (moduleId: string) => (parModule.get(moduleId) ?? []).filter((p) => estAujourdhui(p.cree_le));
  const travail = elements.filter((e) => !e.recuperation);
  const faits = travail.filter((e) => perfDuJour(e.moduleId).length > 0).length;
  const essentiels = travail.filter((e) => e.essentiel);
  const essentielFait = essentiels.length > 0 && essentiels.every((e) => perfDuJour(e.moduleId).length > 0);

  async function terminer() {
    if (etat !== 'saisie') return;
    const lignes = travail
      .filter((e) => perfDuJour(e.moduleId).length > 0)
      .map((e) => `${e.exercice.nom} : ${perfDuJour(e.moduleId).map(formaterPerf).reverse().join(' / ')}`);
    if (ressenti.trim()) lignes.push(`Ressenti : ${ressenti.trim()}`);
    if (lignes.length === 0) return;
    setEtat('envoi');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('journal_entrainement').insert({
        eleve_id: user.id,
        branche: travail[0]?.brancheJournal ?? 'tronc',
        contenu: encoderNote(lignes.join('\n'), 'liste', 'Séances du jour'),
      });
    }
    setEtat('fait');
  }

  const peutTerminer = faits > 0 || !!ressenti.trim();

  // Nombre de jours de la semaine où une perf a été notée sur la branche.
  const lundi = debutSemaine();
  const seancesSemaine = (noeudId: string) => {
    const jours = new Set<string>();
    for (const [moduleId, perfs] of parModule) {
      if (!moduleId.startsWith(`${noeudId}::`)) continue;
      for (const p of perfs) { const d = new Date(p.cree_le); if (d >= lundi) jours.add(d.toDateString()); }
    }
    return jours.size;
  };
  // Séances de la semaine, tous axes confondus : jours où au moins une perf a été notée.
  const seancesTotalSemaine = (() => {
    const jours = new Set<string>();
    for (const perfs of parModule.values()) for (const p of perfs) { const d = new Date(p.cree_le); if (d >= lundi) jours.add(d.toDateString()); }
    return jours.size;
  })();

  return (
    <div style={{ maxWidth: 720, marginInline: 'auto' }}>
      <button type="button" onClick={onFermer} style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit' }}>← Retour au tableau de bord</button>
      <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 24, letterSpacing: 0.5, margin: '10px 0 4px', color: COULEURS.texte }}>MA SÉANCE DU JOUR</h2>
      <p style={{ fontSize: 14, color: COULEURS.texte, margin: '0 0 6px', lineHeight: 1.5, fontStyle: 'italic' }}>« {phraseDuJour(1)} »</p>
      <p style={{ fontSize: 13, color: COULEURS.texteFaible, margin: '0 0 14px', lineHeight: 1.5 }}>
        Commence par <strong style={{ color: COULEURS.texte }}>l'essentiel</strong> : s'il est fait, ta séance est réussie. Le reste est du bonus, si tu as le temps et l'envie.
        {' '}Une seule chose à ne pas oublier : <strong style={{ color: COULEURS.texte }}>note ce que tu fais</strong> (séries, répétitions, temps) au fur et à mesure : {faits}/{travail.length} exercice{travail.length > 1 ? 's' : ''} noté{faits > 1 ? 's' : ''}.
      </p>

      <MinuteurSeance />

      {essentielFait && (
        <p style={{ border: '1px solid #00FF9166', background: 'rgba(0,255,145,0.07)', color: '#00FF91', borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>
          ✓ L'essentiel est fait : ta séance est réussie. Tout le reste est du bonus.
        </p>
      )}

      {cycle && (
        <div style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, margin: '0 0 4px', color: COULEURS.texte }}>Mon cycle</p>
          <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: '0 0 12px', lineHeight: 1.5 }}>
            {cycle.baseValidee
              ? "La qualité de base de cet axe est validée à ce palier : la séance s'attache maintenant à valider la branche qu'elle sert."
              : "On valide d'abord la qualité de base (Force ou Mobilité), puis la branche qu'elle sert (Figures ou Locomotion)."}
            {' '}Les deux axes alternent d'une séance à l'autre, sur 3 à 5 séances par semaine au total.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
            <span style={{ fontSize: 13, color: COULEURS.texte, fontWeight: 600 }}>Aujourd'hui : {cycle.options.find((o) => o.cle === cycle.axe)?.label}</span>
            {cycle.branches.map((b) => (
              <span key={b.domaine} style={{ fontSize: 12, color: b.couleur, fontWeight: 600, whiteSpace: 'nowrap' }}>{b.label} : {seancesSemaine(b.noeudId)} cette semaine</span>
            ))}
            <span style={{ fontSize: 12, color: seancesTotalSemaine >= 3 ? '#00FF91' : COULEURS.texteAtt, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Semaine : {seancesTotalSemaine} séance{seancesTotalSemaine > 1 ? 's' : ''} sur 3 à 5{seancesTotalSemaine > 5 ? ' — pense à récupérer' : ''}
            </span>
          </div>
          {cycle.options.filter((o) => o.cle !== cycle.axe).map((o) => (
            <button key={o.cle} type="button" onClick={() => onChangerCycle({ axe: o.cle })} style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, color: COULEURS.texteFaible, fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer', fontFamily: 'inherit' }}>
              Faire plutôt {o.label} aujourd'hui
            </button>
          ))}
        </div>
      )}

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {elements.map((e, i) => {
          const fait = !e.recuperation && perfDuJour(e.moduleId).length > 0;
          const nouveauBloc = i === 0 || elements[i - 1].bloc !== e.bloc;
          return (
            <li key={e.moduleId} style={{ listStyle: 'none' }}>
            {nouveauBloc && (
              <p style={{ fontSize: 11, color: e.essentiel ? '#ff00aa' : COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, margin: `${i === 0 ? 0 : 14}px 0 8px` }}>{e.bloc}</p>
            )}
            <div style={{ border: `1px solid ${fait ? e.couleur : COULEURS.bordure}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${e.couleur}`, background: fait ? e.couleur : 'transparent', color: fait ? '#04121A' : e.couleur, fontSize: 13, fontWeight: 700 }}>
                  {fait ? '✓' : i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 11, color: e.couleur, letterSpacing: 0.8, fontWeight: 600 }}>
                    {e.recuperation ? 'OUTIL SANTÉ' : e.libelleNiveau.toUpperCase()}{e.aRetravailler ? ' · À RETRAVAILLER' : ''}
                  </span>
                  <span style={{ display: 'block', fontSize: 15, color: COULEURS.texte, fontWeight: 500 }}>{e.exercice.nom}</span>
                </span>
                {!e.recuperation && <span style={{ marginLeft: 'auto' }}><BoutonCoeur moduleId={e.moduleId} /></span>}
              </div>

              {e.exercice.critereValidation && (
                <p style={{ margin: '10px 0 0', fontSize: 12.5, color: e.couleur, fontWeight: 600, lineHeight: 1.45 }}>Objectif : {e.exercice.critereValidation}</p>
              )}
              {e.exercice.consigne && (
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: COULEURS.texteAtt, lineHeight: 1.5 }}>{e.exercice.consigne}</p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {e.exercice.videoUrl && (
                  <button type="button" onClick={() => onOuvrirVideo(e.exercice.videoUrl, e.exercice.nom)} style={{ fontSize: 12, fontWeight: 600, color: COULEURS.texte, background: 'transparent', border: `1px solid ${e.couleur}`, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ▶ Voir la référence
                  </button>
                )}
                {(e.exercice.outils ?? []).filter((o) => o.videoUrl).map((o) => (
                  <button key={o.nom} type="button" onClick={() => onOuvrirVideo(o.videoUrl, o.nom)} style={{ fontSize: 12, color: COULEURS.texteAtt, background: 'transparent', border: `1px dashed ${COULEURS.bordure}`, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Outil : {o.nom}
                  </button>
                ))}
              </div>

              {!e.recuperation && <SuiviPerf moduleId={e.moduleId} couleur={e.couleur} critere={e.exercice.critereValidation} />}
            </div>
            </li>
          );
        })}
      </ol>

      <div style={{ marginTop: 18, border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: '14px 16px' }}>
        {etat === 'fait' ? (
          <>
            <p style={{ margin: 0, fontSize: 14, color: '#00FF91' }}>✓ Séance consignée dans ton journal (sujet « Séances du jour »). {faits > 0 ? `Ta présence compte : chaque jour de pratique noté rapporte ${XP_PAR_SEANCE} XP (jusqu'à ${SEANCES_RECOMPENSEES_PAR_SEMAINE} jours par semaine).` : ''}</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: COULEURS.texteAtt, fontStyle: 'italic' }}>« {phraseDuJour(2)} »</p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 15, margin: '0 0 8px', color: COULEURS.texte }}>Fin de séance</p>
            <textarea
              value={ressenti} onChange={(ev) => setRessenti(ev.target.value)} rows={3}
              placeholder="Ton ressenti en quelques mots (facultatif) : ce qui a bien marché, ce qui a coincé."
              style={{ width: '100%', boxSizing: 'border-box', background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }}
            />
            <button type="button" onClick={terminer} disabled={!peutTerminer || etat === 'envoi'} style={{ marginTop: 10, background: peutTerminer ? GRADIENT : COULEURS.surfaceForte, color: peutTerminer ? 'white' : COULEURS.texteFaible, border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: peutTerminer ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Terminer et consigner dans le journal
            </button>
          </>
        )}
      </div>
    </div>
  );
}
