'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { COULEURS, GRADIENT } from '@/lib/theme';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { BRANCHES_MENTORAT } from '@/lib/formules';
import { EditeurNote, RenduNote, contenuAEnregistrer, type FormatNote } from './NoteJournal';

type Entree = { id: string; branche: string; contenu: string; cree_le: string; format: string | null; sujet: string | null };

const OPTIONS_BRANCHE = [{ cle: 'tronc', nom: 'Armure Organique (tronc commun)' }, ...BRANCHES_MENTORAT];
const NOM_BRANCHE = Object.fromEntries(OPTIONS_BRANCHE.map((b) => [b.cle, b.nom]));
const COLONNES = 'id, branche, contenu, cree_le, format, sujet';

function cleJour(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function libelleJour(iso: string) {
  const d = new Date(iso);
  const auj = new Date();
  const hier = new Date(); hier.setDate(auj.getDate() - 1);
  if (cleJour(d.toISOString()) === cleJour(auj.toISOString())) return "Aujourd'hui";
  if (cleJour(d.toISOString()) === cleJour(hier.toISOString())) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function JournalComplet() {
  const [entrees, setEntrees] = useState<Entree[] | null>(null);
  const [branche, setBranche] = useState('');
  const [sujet, setSujet] = useState('');
  const [format, setFormat] = useState<FormatNote>('texte');
  const [texte, setTexte] = useState('');
  const [points, setPoints] = useState<string[]>(['']);
  const [vue, setVue] = useState<'jour' | 'sujet'>('jour');
  const [sujetFiltre, setSujetFiltre] = useState<string | null>(null);
  const [editionSujet, setEditionSujet] = useState<{ id: string; valeur: string } | null>(null);
  const refFormulaire = useRef<HTMLDivElement | null>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    let annule = false;
    supabase
      .from('journal_entrainement')
      .select(COLONNES)
      .order('cree_le', { ascending: false })
      .limit(300)
      .then(({ data }) => { if (!annule) setEntrees((data as Entree[]) ?? []); });
    return () => { annule = true; };
  }, []);

  const sujetsExistants = useMemo(
    () => [...new Set((entrees ?? []).map((e) => e.sujet?.trim()).filter((s): s is string => !!s))].sort((a, b) => a.localeCompare(b, 'fr')),
    [entrees]
  );

  const contenu = contenuAEnregistrer(format, texte, points);
  const peutAjouter = !!branche && !!contenu;

  async function ajouter() {
    if (!peutAjouter) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('journal_entrainement')
      .insert({ eleve_id: user.id, branche, contenu, format, sujet: sujet.trim() || null })
      .select(COLONNES)
      .single();
    if (data) setEntrees((prev) => [data as Entree, ...(prev ?? [])]);
    setTexte('');
    setPoints(['']);
  }

  async function supprimer(id: string) {
    setEntrees((prev) => (prev ?? []).filter((e) => e.id !== id));
    await supabase.from('journal_entrainement').delete().eq('id', id);
  }

  async function enregistrerSujet(id: string, valeur: string) {
    const nouveau = valeur.trim() || null;
    setEntrees((prev) => (prev ?? []).map((e) => (e.id === id ? { ...e, sujet: nouveau } : e)));
    setEditionSujet(null);
    await supabase.from('journal_entrainement').update({ sujet: nouveau }).eq('id', id);
  }

  // Prépare une nouvelle note dans le même sujet (et la même branche).
  function continuerSujet(e: Entree) {
    setBranche(e.branche);
    setSujet(e.sujet ?? '');
    refFormulaire.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const champStyle: React.CSSProperties = { background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 14, fontFamily: 'inherit' };
  const ongletVue = (actif: boolean): React.CSSProperties => ({
    fontSize: 13, padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${actif ? '#f0a' : COULEURS.bordure}`, background: actif ? 'rgba(255,0,170,0.12)' : 'transparent', color: actif ? '#f0a' : COULEURS.texteFaible,
  });

  const visibles = (entrees ?? []).filter((e) => !sujetFiltre || (e.sujet ?? '') === sujetFiltre);

  // Regroupement : par jour (ordre chronologique inverse) ou par sujet
  // (sujets triés par note la plus récente, « Sans sujet » à la fin).
  const groupes: { cle: string; titre: string; entrees: Entree[] }[] = [];
  if (vue === 'jour') {
    for (const e of visibles) {
      const cle = cleJour(e.cree_le);
      let g = groupes.find((x) => x.cle === cle);
      if (!g) { g = { cle, titre: libelleJour(e.cree_le), entrees: [] }; groupes.push(g); }
      g.entrees.push(e);
    }
  } else {
    for (const e of visibles) {
      const cle = e.sujet?.trim() || '';
      let g = groupes.find((x) => x.cle === cle);
      if (!g) { g = { cle, titre: cle || 'Sans sujet', entrees: [] }; groupes.push(g); }
      g.entrees.push(e);
    }
    groupes.sort((a, b) => (a.cle === '' ? 1 : b.cle === '' ? -1 : 0));
    for (const g of groupes) g.entrees.sort((a, b) => a.cree_le.localeCompare(b.cree_le));
  }

  return (
    <div>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 20px' }}>
        Garde une trace de tes séances, en texte libre ou en liste de points. Donne un sujet à tes notes pour
        relier celles qui parlent de la même chose, le même jour ou sur plusieurs semaines.
      </p>

      <div ref={refFormulaire} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        <select value={branche} onChange={(e) => setBranche(e.target.value)} style={champStyle}>
          <option value="" disabled>Quelle branche ?</option>
          {OPTIONS_BRANCHE.map((b) => <option key={b.cle} value={b.cle}>{b.nom}</option>)}
        </select>
        <input
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          list="sujets-journal"
          placeholder="Sujet (facultatif) — ex. Progression muscle up"
          style={champStyle}
        />
        <datalist id="sujets-journal">
          {sujetsExistants.map((s) => <option key={s} value={s} />)}
        </datalist>
        <EditeurNote format={format} setFormat={setFormat} texte={texte} setTexte={setTexte} points={points} setPoints={setPoints} lignesTexte={7} />
        <button
          type="button"
          onClick={ajouter}
          disabled={!peutAjouter}
          style={{ alignSelf: 'flex-start', background: peutAjouter ? GRADIENT : COULEURS.surfaceForte, color: peutAjouter ? 'white' : COULEURS.texteFaible, border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: peutAjouter ? 'pointer' : 'not-allowed' }}
        >
          Ajouter au journal
        </button>
      </div>

      {entrees === null ? null : entrees.length === 0 ? (
        <p style={{ color: COULEURS.texteFaible, fontSize: 13 }}>Pas encore d'entrée — note ta première séance ci-dessus.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <button type="button" onClick={() => setVue('jour')} style={ongletVue(vue === 'jour')}>Par jour</button>
            <button type="button" onClick={() => setVue('sujet')} style={ongletVue(vue === 'sujet')}>Par sujet</button>
            {sujetFiltre !== null && (
              <button type="button" onClick={() => setSujetFiltre(null)} style={{ ...ongletVue(true), marginLeft: 'auto' }}>
                Sujet : {sujetFiltre || 'Sans sujet'} ×
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {groupes.map((g) => (
              <section key={g.cle || '__sans'}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: vue === 'jour' ? 'capitalize' : 'none', color: vue === 'sujet' && g.cle ? '#f0a' : COULEURS.texteAtt, margin: '0 0 8px' }}>
                  {g.titre}
                  <span style={{ fontWeight: 400, color: COULEURS.texteFaible }}> · {g.entrees.length} note{g.entrees.length > 1 ? 's' : ''}</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {g.entrees.map((e) => (
                    <div key={e.id} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#f0a', fontWeight: 700 }}>{NOM_BRANCHE[e.branche] ?? e.branche}</span>
                        <span style={{ fontSize: 11, color: COULEURS.texteFaible }}>
                          {vue === 'sujet'
                            ? new Date(e.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : new Date(e.cree_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <RenduNote contenu={e.contenu} format={e.format} />

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 10 }}>
                        {editionSujet?.id === e.id ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flex: '1 1 220px' }}>
                            <input
                              autoFocus
                              value={editionSujet.valeur}
                              list="sujets-journal"
                              onChange={(ev) => setEditionSujet({ id: e.id, valeur: ev.target.value })}
                              onKeyDown={(ev) => { if (ev.key === 'Enter') enregistrerSujet(e.id, editionSujet.valeur); if (ev.key === 'Escape') setEditionSujet(null); }}
                              placeholder="Sujet"
                              style={{ ...champStyle, padding: '6px 10px', fontSize: 13, flex: 1, minWidth: 0 }}
                            />
                            <button type="button" onClick={() => enregistrerSujet(e.id, editionSujet.valeur)} style={{ fontSize: 12, color: '#f0a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>OK</button>
                          </span>
                        ) : e.sujet ? (
                          <button type="button" onClick={() => setSujetFiltre(e.sujet ?? '')} title="Voir toutes les notes de ce sujet" style={{ fontSize: 12, color: '#f0a', background: 'rgba(255,0,170,0.1)', border: '1px solid rgba(255,0,170,0.4)', borderRadius: 999, padding: '3px 10px', cursor: 'pointer' }}>
                            # {e.sujet}
                          </button>
                        ) : null}
                        {editionSujet?.id !== e.id && (
                          <button type="button" onClick={() => setEditionSujet({ id: e.id, valeur: e.sujet ?? '' })} style={{ fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {e.sujet ? 'Changer de sujet' : 'Ajouter un sujet'}
                          </button>
                        )}
                        <button type="button" onClick={() => continuerSujet(e)} style={{ fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {e.sujet ? 'Nouvelle note dans ce sujet' : 'Nouvelle note sur cette branche'}
                        </button>
                        <button type="button" onClick={() => supprimer(e.id)} style={{ fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
