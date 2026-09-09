'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

type Objectif = {
  id: string; titre: string; branche: string; sous_groupe: string | null;
  video_url: string | null; mots_cles: string | null; note: string | null;
  famille: string | null; niveau: number | null; tags: string | null; descriptif: string | null;
};
type Relation = { id: string; objectif_source_id: string; objectif_cible_id: string; type: string };

// Un mot du titre/mots-clés DOIT COMMENCER par la recherche pour matcher —
// pas juste la contenir n'importe où. Sans ça, chercher "traction" ressort
// aussi "PROtraction", ce qui n'a aucun sens pour l'élève.
function motCorrespond(texte: string, q: string): boolean {
  return sansAccents(texte.toLowerCase())
    .split(/[^a-z0-9]+/)
    .some((mot) => mot.startsWith(q));
}

// Groupes de synonymes du vocabulaire mouvement/musculation — un élève qui
// tape "traction" doit aussi retrouver "chin up" ou "tirage", pas seulement
// les titres contenant littéralement "traction". Chaque groupe est une
// famille de mots interchangeables pour la recherche ; taper n'importe
// lequel élargit la recherche à tous les autres du même groupe.
const GROUPES_SYNONYMES: string[][] = [
  ['traction', 'chin', 'pull'],
  ['tirage', 'rowing', 'row'],
  ['poussee', 'pousser', 'push', 'pompe', 'pompes'],
  ['dips', 'dip'],
  ['muscle up', 'mu'],
  ['squat', 'accroupi'],
  ['pont', 'bridge'],
  ['handstand', 'poirier', 'atr', 'renversement', 'renverse'],
  ['elastique', 'band', 'bande'],
  ['fente', 'lunge'],
  ['suspension', 'hang'],
  ['ecart', 'split', 'straddle'],
  ['epaule', 'shoulder', 'scapula', 'scapulaire'],
  ['hanche', 'hip'],
  ['cheville', 'ankle'],
  ['poignet', 'wrist'],
  ['genou', 'knee'],
  ['equilibre', 'balance', 'balancier'],
  ['stretch', 'etirement', 'flexibilite', 'souplesse'],
  ['respiration', 'breath', 'breathing'],
  ['quadrupedie', 'quadrupede'],
  ['bipedie', 'bipede'],
];

// Pour certains groupes, il existe UNE réponse canonique -- l'exécution
// "complète" et représentative du mouvement demandé, distincte de ses
// régressions/progressions/variantes (elles-mêmes visibles une fois sur la
// page détail, dans la boîte régression/objectif/progression). Taper
// "push-up" doit répondre "Push up clean", pas ressortir Push up
// excentrique genoux, Angola PU etc. en vrac. Clé = un des mots du groupe
// concerné, valeur = le titre exact en base.
const REPONSE_CANONIQUE: Record<string, string> = {
  'push': 'PUSH UP CLEAN',
  'traction': 'CHIN UP RING',
  'tirage': 'Rowing circle - inside',
  'dips': 'Dips bar',
  'mu': 'MU HORIZONTAL',
};

// Normalise en enlevant les accents, pour que les synonymes matchent quelle
// que soit la façon dont l'élève tape sa recherche (élastique / elastique).
function sansAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Les titres viennent d'un import Excel avec une casse incohérente (certains
// tout en MAJUSCULES, d'autres en Casse normale) -- ce qui donnait l'illusion
// d'une police différente d'un titre à l'autre. On normalise à l'affichage
// (Sentence case), sans toucher aux données stockées.
function formatTitre(titre: string): string {
  const minuscule = titre.toLowerCase();
  return minuscule.charAt(0).toUpperCase() + minuscule.slice(1);
}

// Étend une recherche à tous les synonymes du ou des groupes concernés.
function elargirRecherche(q: string): string[] {
  const base = sansAccents(q.toLowerCase().trim());
  const motsTrouves = GROUPES_SYNONYMES.filter((groupe) => groupe.some((mot) => mot.startsWith(base) || base.startsWith(mot)));
  const elargis = new Set<string>([base, ...motsTrouves.flat()]);
  return [...elargis];
}

// "Zones à travailler" (option A, automatique) : pour un objectif donné, on
// cherche dans la bibliothèque Armure Organique les outils dont un tag
// correspond à sa famille (ex. famille 'Tirer' -> tag 'Préparation Tirer'),
// avec repli sur la branche si aucun tag de famille n'existe encore (ex.
// famille 'Handstand' sans tag dédié -> tag 'Préparation Figures'). Le
// vocabulaire des tags ne correspond pas toujours mot pour mot au nom de la
// famille (ex. famille 'Pousser' mais tag 'Préparation Poussée') : cette
// table fait le pont. Une famille/branche absente de la table, ou sans tag
// correspondant en base, ressort simplement une liste vide -- honnête,
// plutôt que de forcer un rapprochement qui n'existe pas encore (Sylvain
// enrichira au cas par cas plus tard, à la main).
const ALIAS_FAMILLE_VERS_TAG: Record<string, string[]> = {
  'Tirer': ['tirer'],
  'Pousser': ['poussee', 'push-up'],
  'Pont': ['pont'],
  'L-sit': ['l-sit'],
  'Handstand': ['handstand'],
  'Floor work': ['floor work'],
  'Squats unilatéraux': ['squat', 'sissy squat'],
  'Jefferson curl': ['chaine posterieure'],
  'Stretch actif': ['stretch actif'],
};
const ALIAS_BRANCHE_VERS_TAG: Record<string, string[]> = {
  'Figures': ['figures'],
  'Locomotion': ['locomotion'],
  'Flexibilité': ['flexibilite'],
};

// Texte d'intro affiché UNE FOIS au-dessus de la liste "Zones à travailler",
// avant les outils eux-mêmes -- pas un extrait sous chaque outil. Décrit le
// rôle général de cette catégorie d'outils pour cet objectif, en s'appuyant
// sur le raisonnement de Sylvain (interdépendances protraction/rétraction,
// rotation externe, hollow, mobilité de hanche/cheville...).
const INTRO_ZONES_FAMILLE: Record<string, string> = {
  'Tirer': "Le travail scapulaire (protraction, rétraction) construit la fixation d'omoplate qui donne une structure stable pour développer la force de tirage.",
  'Pousser': "La protraction des omoplates est la base du travail de poussée : elle construit la stabilité scapulaire nécessaire aux push-up, aux dips et aux figures de poussée.",
  'Handstand': "La flexion d'épaule (trap raise, Y raise) et la rotation externe donnent l'amplitude et la stabilité d'épaule nécessaires à un bon alignement en renversement.",
  'Pont': "La flexion d'épaule est particulièrement utile ici : la poussée du pont se fait justement en fin de flexion d'épaule.",
  'L-sit': "Le hollow et une sangle abdominale bien engagée soutiennent la fermeture du corps que demande le L-sit.",
  'Floor work': "La force de poussée et de tirage, comme la sangle abdominale (hollow), se retrouvent constamment sollicitées dans le travail au sol.",
  'Squats unilatéraux': "La mobilité de cheville et de hanche conditionnent la profondeur et la qualité du squat — un point faible ici limite tout le reste, même avec de bons quadriceps.",
  'Jefferson curl': "La chaîne postérieure travaille en complément de la chaîne antérieure : les deux ensemble donnent un bas du corps fonctionnel.",
  'Stretch actif': "Une amplitude active, construite par un engagement musculaire réel et pas juste un relâchement, soutient la fluidité de tout le reste de la pratique.",
};
const INTRO_ZONES_BRANCHE: Record<string, string> = {
  'Figures': "Les figures s'appuient directement sur la force construite en Armure Organique — protraction/rétraction pour la stabilité scapulaire, hollow pour la sangle abdominale, rotation externe pour la santé d'épaule.",
  'Locomotion': "La locomotion profite de la force générale et de la sangle abdominale (hollow) construites en Armure Organique, sollicitées en continu dans le mouvement.",
  'Flexibilité': "La mobilité générale (hanche, cheville, épaule) construite en Armure Organique conditionne l'amplitude et la qualité d'exécution ici.",
};

function zonesATravailler(selection: Objectif, objectifs: Objectif[]): { intro: string | null; outils: Objectif[] } {
  const aliasFamille = selection.famille ? ALIAS_FAMILLE_VERS_TAG[selection.famille] : undefined;
  const aliasBranche = ALIAS_BRANCHE_VERS_TAG[selection.branche];
  const motsCles = aliasFamille ?? aliasBranche ?? [];
  if (motsCles.length === 0) return { intro: null, outils: [] };
  const outils = objectifs.filter((o) => {
    if (o.branche !== 'Armure Organique' || !o.tags) return false;
    const tags = sansAccents(o.tags.toLowerCase());
    return motsCles.some((m) => tags.includes(m));
  });
  const intro = (selection.famille && INTRO_ZONES_FAMILLE[selection.famille]) || INTRO_ZONES_BRANCHE[selection.branche] || null;
  return { intro, outils };
}

// Position d'un objectif au sein de sa famille — volontairement minimaliste
// par défaut (juste avant/après), la chaîne complète restant repliée. Un
// élève qui cherche à savoir "par quoi je continue" n'a pas besoin qu'on
// lui déballe 10 vidéos d'un coup. Disposition en 3 colonnes (avant / ici /
// après) pour que la séquence soit lisible d'un coup d'œil, pas juste
// déductible du texte.
function PositionDansFamille({ selection, objectifs, choisir }: { selection: Objectif; objectifs: Objectif[]; choisir: (id: string) => void }) {
  const [ouvert, setOuvert] = useState(false);

  const memeFamille = useMemo(() => {
    if (!selection.famille || selection.niveau === null) return [];
    return objectifs
      .filter((o) => o.branche === selection.branche && o.famille === selection.famille && o.niveau !== null)
      .sort((a, b) => (a.niveau ?? 0) - (b.niveau ?? 0));
  }, [selection, objectifs]);

  if (memeFamille.length <= 1) return null;

  const index = memeFamille.findIndex((o) => o.id === selection.id);
  const precedent = index > 0 ? memeFamille[index - 1] : null;
  const suivant = index < memeFamille.length - 1 ? memeFamille[index + 1] : null;
  const niveauMax = Math.max(...memeFamille.map((o) => o.niveau ?? 0));

  return (
    <div style={{ background: 'rgba(255,0,170,0.04)', border: `1px solid rgba(255,0,170,0.35)`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <p style={{ fontSize: 11, opacity: 0.6, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {selection.famille}{selection.niveau ? ` — Niveau ${selection.niveau}/${niveauMax}` : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        <div>
          <p style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 3px' }}>Régression</p>
          <button
            type="button" onClick={() => precedent && choisir(precedent.id)} disabled={!precedent}
            style={{
              width: '100%', textAlign: 'left', fontSize: 12.5, padding: '9px 12px', borderRadius: 8, minHeight: 40,
              border: `1px solid ${COULEURS.bordure}`, background: precedent ? COULEURS.surfaceForte : 'transparent',
              color: precedent ? COULEURS.texteAtt : COULEURS.texteFaible, cursor: precedent ? 'pointer' : 'default',
              opacity: precedent ? 1 : 0.4,
            }}
          >
            {precedent ? `↑ ${formatTitre(precedent.titre)}` : '↑ — début de la famille —'}
          </button>
        </div>

        <div>
          <p style={{ fontSize: 11, color: '#f0a', textTransform: 'uppercase', letterSpacing: 0.5, margin: '3px 0 3px', fontWeight: 700 }}>Objectif</p>
          <div style={{ textAlign: 'center', fontSize: 13, padding: '10px 12px', borderRadius: 8, border: `1px solid #f0a`, background: 'rgba(255,0,170,0.1)', color: COULEURS.texte, fontWeight: 700 }}>
            {formatTitre(selection.titre)} <span style={{ fontWeight: 400, opacity: 0.6 }}>(ici)</span>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, margin: '3px 0 3px' }}>Progression</p>
          <button
            type="button" onClick={() => suivant && choisir(suivant.id)} disabled={!suivant}
            style={{
              width: '100%', textAlign: 'left', fontSize: 12.5, padding: '9px 12px', borderRadius: 8, minHeight: 40,
              border: `1px solid ${COULEURS.bordure}`, background: suivant ? COULEURS.surfaceForte : 'transparent',
              color: suivant ? COULEURS.texteAtt : COULEURS.texteFaible, cursor: suivant ? 'pointer' : 'default',
              opacity: suivant ? 1 : 0.4,
            }}
          >
            {suivant ? `↓ ${formatTitre(suivant.titre)}` : '↓ — fin de la famille —'}
          </button>
        </div>
      </div>

      <button
        type="button" onClick={() => setOuvert((o) => !o)}
        style={{ marginTop: 10, fontSize: 11, background: 'none', border: 'none', color: COULEURS.texteFaible, cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        {ouvert ? 'Replier' : `Voir toute la progression (${memeFamille.length})`}
      </button>

      {ouvert && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {memeFamille.map((o) => (
            <button
              key={o.id} type="button" onClick={() => choisir(o.id)}
              disabled={o.id === selection.id}
              style={{
                textAlign: 'left', fontSize: 12, padding: '4px 0', background: 'none', border: 'none',
                color: o.id === selection.id ? COULEURS.texte : COULEURS.texteAtt,
                fontWeight: o.id === selection.id ? 700 : 400,
                cursor: o.id === selection.id ? 'default' : 'pointer',
              }}
            >
              {o.niveau ? `${o.niveau}. ` : ''}{formatTitre(o.titre)}{o.id === selection.id ? ' (ici)' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ObjectifsExplorer({ objectifs, relations }: { objectifs: Objectif[]; relations: Relation[] }) {
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = useState('');
  const [selectionId, setSelectionId] = useState<string | null>(null);

  const parId = useMemo(() => new Map(objectifs.map((o) => [o.id, o])), [objectifs]);
  const selection = selectionId ? parId.get(selectionId) : null;

  // Arrivée directe depuis une quête de l'arbre ("Éclairer le chemin") :
  // ouvre directement la bonne fiche sans repasser par la recherche.
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && parId.has(id)) setSelectionId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Recherche volontairement stricte (sous-chaîne, pas de recherche floue) :
  // ne matche que sur le titre et les mots-clés que Sylvain a lui-même
  // validés pour chaque objectif — pas de suggestion inventée.
  // Deux niveaux : correspondance directe (le titre contient le mot cherché,
  // c'est de ça que parle l'élève) et mention associée (seulement dans les
  // mots-clés — un outil qui EN PARLE sans être LE sujet). Sans cette
  // distinction, un outil d'épaule qui mentionne juste "push-up" en mot-clé
  // ressort au même niveau qu'une vraie vidéo de push-up, ce qui noie le
  // résultat que l'élève cherche vraiment.
  const { reponsePrincipale, correspondances, mentions } = useMemo(() => {
    if (!recherche.trim()) return { reponsePrincipale: null as Objectif | null, correspondances: [] as Objectif[], mentions: [] as Objectif[] };
    const termes = elargirRecherche(recherche);
    const titreCanonique = termes.map((t) => REPONSE_CANONIQUE[t]).find(Boolean);
    const reponsePrincipale = titreCanonique ? objectifs.find((o) => o.titre === titreCanonique) ?? null : null;
    const correspondances: Objectif[] = [];
    const mentions: Objectif[] = [];
    for (const o of objectifs) {
      if (reponsePrincipale && o.id === reponsePrincipale.id) continue; // déjà mise en avant, pas la reciter dans la liste
      if (termes.some((q) => motCorrespond(o.titre, q))) correspondances.push(o);
      else if (termes.some((q) => motCorrespond(o.mots_cles ?? '', q))) mentions.push(o);
    }
    // Priorité aux objectifs qui ont une vraie place dans une progression
    // (famille + niveau) plutôt qu'aux orphelins et compilations (comme
    // "FORCE - PUSH UP", explicitement hors progression) qui, sans ce tri,
    // ne remontaient en tête que par hasard alphabétique -- une très
    // mauvaise porte d'entrée pour l'élève.
    const rang = (o: Objectif) => (o.famille && o.niveau !== null ? 0 : o.famille ? 1 : 2);
    correspondances.sort((a, b) => rang(a) - rang(b) || (a.niveau ?? 99) - (b.niveau ?? 99));
    return { reponsePrincipale, correspondances: correspondances.slice(0, 20), mentions: mentions.slice(0, 10) };
  }, [recherche, objectifs]);

  function choisir(id: string) {
    setSelectionId(id);
    setRecherche('');
  }

  if (selection) {
    const zones = zonesATravailler(selection, objectifs);
    const labelSection: React.CSSProperties = { fontSize: 11, opacity: 0.6, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 };

    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
        <button type="button" onClick={() => setSelectionId(null)} style={{ background: 'none', border: 'none', fontSize: 13, color: COULEURS.texteFaible, cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          ← Nouvelle recherche
        </button>

        <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.5, textTransform: 'uppercase', margin: '0 0 4px' }}>
          {selection.branche}{selection.sous_groupe ? ` · ${selection.sous_groupe}` : ''}
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 30px)', letterSpacing: 0.3, margin: '0 0 8px' }}>{formatTitre(selection.titre)}</h1>

        {selection.descriptif && (
          <p style={{ fontSize: 13.5, color: COULEURS.texteAtt, lineHeight: 1.6, margin: '0 0 10px' }}>{selection.descriptif}</p>
        )}

        {selection.video_url && (
          <a
            href={selection.video_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', fontSize: 13, color: '#f0a', textDecoration: 'underline', textUnderlineOffset: 2, marginBottom: 16 }}
          >
            ▶ Voir la vidéo de référence →
          </a>
        )}

        <PositionDansFamille key={selection.id} selection={selection} objectifs={objectifs} choisir={choisir} />

        {selection.note && (
          <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <p style={labelSection}>Note</p>
            <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{selection.note}</p>
          </div>
        )}

        {zones.outils.length > 0 && (
          <div style={{ background: 'rgba(139,92,246,0.06)', border: `1px solid #8B5CF6`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, margin: '0 0 4px' }}>🧭 Zones à travailler</p>
            {zones.intro && (
              <p style={{ fontSize: 13, color: COULEURS.texteAtt, lineHeight: 1.6, margin: '0 0 10px' }}>{zones.intro}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {zones.outils.map((o) => (
                <button
                  key={o.id} type="button" onClick={() => choisir(o.id)}
                  style={{ fontSize: 12.5, padding: '6px 12px', borderRadius: 999, border: `1px solid rgba(139,92,246,0.4)`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}
                >
                  {formatTitre(o.titre)}
                </button>
              ))}
            </div>
          </div>
        )}

        {!selection.descriptif && zones.outils.length === 0 && selection.niveau === null && (
          <p style={{ fontSize: 12, color: COULEURS.texteFaible }}>Pas encore de contenu renseigné pour cet objectif.</p>
        )}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        <span style={GRADIENT_TEXTE}>OBJECTIFS</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 20px' }}>
        Cherche un objectif (ex. "traction", "handstand", "épaule") pour comprendre à quoi il sert, sur quoi il
        repose, et par quoi le remplacer si besoin.
      </p>

      <input
        type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher un objectif..."
        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte, fontSize: 14 }}
        autoFocus
      />

      {recherche.trim() && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reponsePrincipale ? (
            <button
              type="button" onClick={() => choisir(reponsePrincipale.id)}
              style={{ textAlign: 'left', padding: '16px 18px', borderRadius: 10, border: `1px solid #f0a`, background: 'rgba(255,0,170,0.1)', color: COULEURS.texte, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 11, color: '#f0a', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Réponse</span>
              <span style={{ display: 'block', fontSize: 18, fontWeight: 700, marginTop: 4 }}>{formatTitre(reponsePrincipale.titre)}</span>
              <span style={{ display: 'block', fontSize: 12, color: COULEURS.texteFaible, marginTop: 4 }}>Variantes, régressions et progressions sur sa fiche →</span>
            </button>
          ) : correspondances.length === 0 && mentions.length === 0 ? (
            <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>
              Rien ne correspond. Tu ne trouves pas ce que tu cherches ? Demande à Sylvain de l'ajouter.
            </p>
          ) : (
            <>
              {correspondances.map((o) => (
                <button
                  key={o.id} type="button" onClick={() => choisir(o.id)}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 14 }}>{formatTitre(o.titre)}</span>
                  <span style={{ display: 'block', fontSize: 11, color: COULEURS.texteFaible, marginTop: 2 }}>{o.branche}{o.sous_groupe ? ` · ${o.sous_groupe}` : ''}</span>
                </button>
              ))}

              {mentions.length > 0 && (
                <>
                  <p style={{ fontSize: 11, color: COULEURS.texteFaible, textTransform: 'uppercase', letterSpacing: 0.5, margin: '10px 0 2px' }}>
                    En parlent aussi
                  </p>
                  {mentions.map((o) => (
                    <button
                      key={o.id} type="button" onClick={() => choisir(o.id)}
                      style={{ textAlign: 'left', padding: '8px 14px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 13 }}>{formatTitre(o.titre)}</span>
                      <span style={{ display: 'block', fontSize: 11, color: COULEURS.texteFaible, marginTop: 2 }}>{o.branche}{o.sous_groupe ? ` · ${o.sous_groupe}` : ''}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
