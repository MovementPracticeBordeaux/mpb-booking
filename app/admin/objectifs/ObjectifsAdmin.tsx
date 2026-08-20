'use client';

import { useState, useMemo } from 'react';

type Objectif = {
  id: string; titre: string; branche: string; sous_groupe: string | null;
  video_url: string | null; mots_cles: string | null; note: string | null;
};
type Relation = { id: string; objectif_source_id: string; objectif_cible_id: string };

// Petit champ de recherche instantanée pour choisir l'objectif cible d'une
// relation "sert à" — évite de scroller dans un menu déroulant de 333
// entrées pour en retrouver une précise.
function SelecteurCible({
  objectifs, excludeId, sourceId, ajouterRelation,
}: {
  objectifs: Objectif[];
  excludeId: string;
  sourceId: string;
  ajouterRelation: (formData: FormData) => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [cibleId, setCibleId] = useState<string | null>(null);

  const resultats = recherche.trim()
    ? objectifs
        .filter((o) => o.id !== excludeId && `${o.titre} ${o.branche} ${o.sous_groupe ?? ''}`.toLowerCase().includes(recherche.toLowerCase()))
        .slice(0, 10)
    : [];
  const cibleChoisie = cibleId ? objectifs.find((o) => o.id === cibleId) : null;

  if (cibleChoisie) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <span style={{ fontSize: 12 }}>{cibleChoisie.titre}</span>
        <button type="button" onClick={() => setCibleId(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 11 }}>changer</button>
        <form action={ajouterRelation} style={{ marginLeft: 'auto' }}>
          <input type="hidden" name="source_id" value={sourceId} />
          <input type="hidden" name="cible_id" value={cibleChoisie.id} />
          <button type="submit" style={{ fontSize: 12, padding: '4px 10px' }}>+ Ajouter</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', marginTop: 6 }}>
      <input
        type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
        placeholder="Chercher une vidéo à ajouter..."
        style={{ fontSize: 12, padding: '5px 8px', width: '100%' }}
      />
      {resultats.length > 0 && (
        <div style={{ border: '1px solid #333', borderRadius: 6, marginTop: 4, maxHeight: 180, overflowY: 'auto', background: '#111' }}>
          {resultats.map((o) => (
            <button
              key={o.id} type="button"
              onClick={() => { setCibleId(o.id); setRecherche(''); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: 12, background: 'none', border: 'none', borderBottom: '1px solid #222', color: 'inherit', cursor: 'pointer' }}
            >
              {o.titre} <span style={{ opacity: 0.5 }}>· {o.branche}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ObjectifsAdmin({
  objectifs, relations, ajouterRelation, supprimerRelation, mettreAJourObjectif,
}: {
  objectifs: Objectif[];
  relations: Relation[];
  ajouterRelation: (formData: FormData) => void;
  supprimerRelation: (formData: FormData) => void;
  mettreAJourObjectif: (formData: FormData) => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [ouvertId, setOuvertId] = useState<string | null>(null);

  const parId = useMemo(() => new Map(objectifs.map((o) => [o.id, o])), [objectifs]);

  const filtres = objectifs.filter((o) =>
    `${o.titre} ${o.branche} ${o.sous_groupe ?? ''}`.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div>
      <input
        type="text" placeholder="Rechercher un objectif (nom, branche, sous-groupe)..."
        value={recherche} onChange={(e) => setRecherche(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', marginBottom: 12 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 600, overflowY: 'auto' }}>
        {filtres.map((o) => {
          const sertA = relations.filter((r) => r.objectif_source_id === o.id);
          const reposeSur = relations.filter((r) => r.objectif_cible_id === o.id);
          const ouvert = ouvertId === o.id;

          return (
            <div key={o.id} style={{ border: '1px solid #333', borderRadius: 8, padding: 10 }}>
              <button
                type="button" onClick={() => setOuvertId(ouvert ? null : o.id)}
                style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0 }}
              >
                <span style={{ fontSize: 11, opacity: 0.5 }}>{o.branche} {o.sous_groupe ? `· ${o.sous_groupe}` : ''}{!o.video_url ? ' · ⚠️ pas de vidéo' : ''}</span>
                <br />
                <strong>{o.titre}</strong>
                {(sertA.length > 0 || reposeSur.length > 0) && (
                  <span style={{ fontSize: 11, opacity: 0.6 }}> — {reposeSur.length} en amont, {sertA.length} en aval</span>
                )}
              </button>

              {ouvert && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {o.video_url && (
                    <a href={o.video_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#f0a' }}>▶ Voir la vidéo</a>
                  )}

                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>Repose sur (en amont)</p>
                    {reposeSur.length === 0 ? (
                      <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Aucun — ou modifie-le depuis la fiche de l'objectif source.</p>
                    ) : (
                      reposeSur.map((r) => (
                        <p key={r.id} style={{ fontSize: 12, margin: '2px 0' }}>← {parId.get(r.objectif_source_id)?.titre ?? '?'}</p>
                      ))
                    )}
                  </div>

                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 4px' }}>Sert à (en aval)</p>
                    {sertA.map((r) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, margin: '2px 0' }}>
                        <span>→ {parId.get(r.objectif_cible_id)?.titre ?? '?'}</span>
                        <form action={supprimerRelation}>
                          <input type="hidden" name="relation_id" value={r.id} />
                          <button type="submit" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 11 }}>✕</button>
                        </form>
                      </div>
                    ))}
                    <SelecteurCible objectifs={objectifs} excludeId={o.id} sourceId={o.id} ajouterRelation={ajouterRelation} />
                  </div>

                  <form action={mettreAJourObjectif} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input type="hidden" name="objectif_id" value={o.id} />
                    <label style={{ fontSize: 11, opacity: 0.7 }}>
                      Mots-clés de recherche (séparés par des virgules)
                      <input type="text" name="mots_cles" defaultValue={o.mots_cles ?? ''} placeholder="ex. pull up, tirage" style={{ width: '100%', fontSize: 12, padding: '4px 6px', marginTop: 2 }} />
                    </label>
                    <label style={{ fontSize: 11, opacity: 0.7 }}>
                      Note (fragments, amplification...)
                      <textarea name="note" defaultValue={o.note ?? ''} rows={2} style={{ width: '100%', fontSize: 12, padding: '4px 6px', marginTop: 2 }} />
                    </label>
                    <button type="submit" style={{ fontSize: 12, padding: '6px 12px', alignSelf: 'flex-start' }}>Enregistrer</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
