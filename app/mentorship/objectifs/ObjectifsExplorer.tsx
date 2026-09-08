'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';

type Objectif = {
  id: string; titre: string; branche: string; sous_groupe: string | null;
  video_url: string | null; mots_cles: string | null; note: string | null;
  famille: string | null; niveau: number | null;
};
type Relation = { id: string; objectif_source_id: string; objectif_cible_id: string; type: string };

function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? m[1] : null;
}

// Un mot du titre/mots-clés DOIT COMMENCER par la recherche pour matcher —
// pas juste la contenir n'importe où. Sans ça, chercher "traction" ressort
// aussi "PROtraction", ce qui n'a aucun sens pour l'élève.
function motCorrespond(texte: string, q: string): boolean {
  return texte
    .toLowerCase()
    .split(/[^a-zàâäéèêëïîôöùûüç0-9]+/)
    .some((mot) => mot.startsWith(q));
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
    if (!selection.famille) return [];
    return objectifs
      .filter((o) => o.branche === selection.branche && o.famille === selection.famille)
      .sort((a, b) => (a.niveau ?? 0) - (b.niveau ?? 0));
  }, [selection, objectifs]);

  if (memeFamille.length <= 1) return null;

  const index = memeFamille.findIndex((o) => o.id === selection.id);
  const precedent = index > 0 ? memeFamille[index - 1] : null;
  const suivant = index < memeFamille.length - 1 ? memeFamille[index + 1] : null;
  const niveauMax = Math.max(...memeFamille.map((o) => o.niveau ?? 0));

  return (
    <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <p style={{ fontSize: 11, opacity: 0.6, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {selection.famille}{selection.niveau ? ` — Niveau ${selection.niveau}/${niveauMax}` : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        <button
          type="button" onClick={() => precedent && choisir(precedent.id)} disabled={!precedent}
          style={{
            textAlign: 'left', fontSize: 12.5, padding: '9px 12px', borderRadius: 8, minHeight: 40,
            border: `1px solid ${COULEURS.bordure}`, background: precedent ? COULEURS.surfaceForte : 'transparent',
            color: precedent ? COULEURS.texteAtt : COULEURS.texteFaible, cursor: precedent ? 'pointer' : 'default',
            opacity: precedent ? 1 : 0.4,
          }}
        >
          {precedent ? `↑ ${precedent.titre}` : '↑ — début de la famille —'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, padding: '10px 12px', borderRadius: 8, border: `1px solid #f0a`, background: 'rgba(255,0,170,0.1)', color: COULEURS.texte, fontWeight: 700 }}>
          {selection.titre} <span style={{ fontWeight: 400, opacity: 0.6 }}>(ici)</span>
        </div>

        <button
          type="button" onClick={() => suivant && choisir(suivant.id)} disabled={!suivant}
          style={{
            textAlign: 'left', fontSize: 12.5, padding: '9px 12px', borderRadius: 8, minHeight: 40,
            border: `1px solid ${suivant ? '#f0a' : COULEURS.bordure}`, background: suivant ? 'rgba(255,0,170,0.06)' : 'transparent',
            color: suivant ? '#f0a' : COULEURS.texteFaible, cursor: suivant ? 'pointer' : 'default', fontWeight: suivant ? 600 : 400,
            opacity: suivant ? 1 : 0.4,
          }}
        >
          {suivant ? `↓ ${suivant.titre}` : '↓ — fin de la famille —'}
        </button>
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
              {o.niveau ? `${o.niveau}. ` : ''}{o.titre}{o.id === selection.id ? ' (ici)' : ''}
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
  const resultats = useMemo(() => {
    if (!recherche.trim()) return [];
    const q = recherche.toLowerCase().trim();
    return objectifs
      .filter((o) => motCorrespond(o.titre, q) || motCorrespond(o.mots_cles ?? '', q))
      .slice(0, 25);
  }, [recherche, objectifs]);

  function choisir(id: string) {
    setSelectionId(id);
    setRecherche('');
  }

  if (selection) {
    const sertA = relations.filter((r) => r.type === 'sert_a' && r.objectif_source_id === selection.id).map((r) => parId.get(r.objectif_cible_id)).filter(Boolean) as Objectif[];
    const reposeSur = relations.filter((r) => r.type === 'sert_a' && r.objectif_cible_id === selection.id).map((r) => parId.get(r.objectif_source_id)).filter(Boolean) as Objectif[];
    const yt = selection.video_url ? idYoutube(selection.video_url) : null;

    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
        <button type="button" onClick={() => setSelectionId(null)} style={{ background: 'none', border: 'none', fontSize: 13, color: COULEURS.texteFaible, cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          ← Nouvelle recherche
        </button>

        <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.5, textTransform: 'uppercase', margin: '0 0 4px' }}>
          {selection.branche}{selection.sous_groupe ? ` · ${selection.sous_groupe}` : ''}
        </p>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 30px)', letterSpacing: 0.3, margin: '0 0 16px' }}>{selection.titre}</h1>

        {yt ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${yt}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <p style={{ fontSize: 13, color: COULEURS.texteFaible, marginBottom: 16 }}>Pas encore de vidéo pour cet objectif.</p>
        )}

        {selection.note && (
          <div style={{ background: COULEURS.surface, border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, opacity: 0.6, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Note</p>
            <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{selection.note}</p>
          </div>
        )}

        <PositionDansFamille key={selection.id} selection={selection} objectifs={objectifs} choisir={choisir} />

        {reposeSur.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Repose sur</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {reposeSur.map((o) => (
                <button key={o.id} type="button" onClick={() => choisir(o.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, border: `1px solid ${COULEURS.bordure}`, background: 'transparent', color: COULEURS.texteAtt, cursor: 'pointer' }}>
                  ← {o.titre}
                </button>
              ))}
            </div>
          </div>
        )}

        {sertA.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Sert à</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sertA.map((o) => (
                <button key={o.id} type="button" onClick={() => choisir(o.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid #f0a', background: 'rgba(255,0,170,0.08)', color: '#f0a', cursor: 'pointer' }}>
                  {o.titre} →
                </button>
              ))}
            </div>
          </div>
        )}

        {reposeSur.length === 0 && sertA.length === 0 && !selection.famille && (
          <p style={{ fontSize: 12, color: COULEURS.texteFaible }}>Pas encore de lien renseigné pour cet objectif.</p>
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
        Cherche un objectif (ex. "traction", "elbow lever", "handstand") pour voir ce sur quoi il repose et ce
        qu'il débloque ensuite.
      </p>

      <input
        type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher un objectif..."
        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surfaceForte, color: COULEURS.texte, fontSize: 14 }}
        autoFocus
      />

      {recherche.trim() && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {resultats.length === 0 ? (
            <p style={{ fontSize: 13, color: COULEURS.texteFaible }}>
              Rien ne correspond. Tu ne trouves pas ce que tu cherches ? Demande à Sylvain de l'ajouter.
            </p>
          ) : (
            resultats.map((o) => (
              <button
                key={o.id} type="button" onClick={() => choisir(o.id)}
                style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, color: COULEURS.texte, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 14 }}>{o.titre}</span>
                <span style={{ display: 'block', fontSize: 11, color: COULEURS.texteFaible, marginTop: 2 }}>{o.branche}{o.sous_groupe ? ` · ${o.sous_groupe}` : ''}</span>
              </button>
            ))
          )}
        </div>
      )}
    </main>
  );
}
