'use client';

import { useState, useMemo } from 'react';

type Objectif = {
  id: string; titre: string; branche: string; sous_groupe: string | null;
  video_url: string | null; mots_cles: string | null; note: string | null;
};
type Relation = { id: string; objectif_source_id: string; objectif_cible_id: string };

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

  const branchesTriees = useMemo(() => {
    const parBranche = new Map<string, Objectif[]>();
    for (const o of objectifs) {
      const liste = parBranche.get(o.branche) ?? [];
      liste.push(o);
      parBranche.set(o.branche, liste);
    }
    return [...parBranche.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [objectifs]);

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
                    <form action={ajouterRelation} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input type="hidden" name="source_id" value={o.id} />
                      <select name="cible_id" style={{ flexGrow: 1, fontSize: 12, padding: '4px 6px' }}>
                        {branchesTriees.map(([branche, liste]) => (
                          <optgroup key={branche} label={branche}>
                            {liste.filter((x) => x.id !== o.id).map((x) => (
                              <option key={x.id} value={x.id}>{x.titre}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <button type="submit" style={{ fontSize: 12, padding: '4px 10px' }}>+ Ajouter</button>
                    </form>
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
