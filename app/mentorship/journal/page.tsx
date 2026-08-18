import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { BRANCHES_MENTORAT } from '@/lib/formules';
import { ajouterEntreeJournal, supprimerEntreeJournal } from './actions';

export const dynamic = 'force-dynamic';

const OPTIONS_BRANCHE = [{ cle: 'tronc', nom: 'Armure Organique (tronc commun)' }, ...BRANCHES_MENTORAT];
const NOM_BRANCHE = Object.fromEntries(OPTIONS_BRANCHE.map((b) => [b.cle, b.nom]));

type Entree = { id: string; branche: string; contenu: string; cree_le: string };

export default async function JournalPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: aboMentorat } = await supabase
    .from('abonnements')
    .select('gele')
    .eq('eleve_id', user.id)
    .eq('categorie', 'mentorat')
    .eq('abonnement_actif', true)
    .maybeSingle();
  const accesAutorise = !!aboMentorat && !aboMentorat.gele;

  if (!accesAutorise) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28 }}>JOURNAL D'ENTRAÎNEMENT</h1>
        <p style={{ color: COULEURS.texteAtt }}>Cette page est réservée aux élèves ayant le Mentorat actif.</p>
      </main>
    );
  }

  const { data: entreesData } = await supabase
    .from('journal_entrainement')
    .select('id, branche, contenu, cree_le')
    .order('cree_le', { ascending: false })
    .limit(100);
  const entrees = (entreesData ?? []) as Entree[];

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px' }}>
      <a href="/mentorship" style={{ fontSize: 13, color: COULEURS.texteFaible, textDecoration: 'none' }}>← Retour au Mentorat</a>

      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(24px, 7vw, 32px)', letterSpacing: 0.5, margin: '8px 0 4px' }}>
        JOURNAL <span style={GRADIENT_TEXTE}>D'ENTRAÎNEMENT</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, margin: '0 0 24px' }}>
        Garde une trace rapide de tes séances, même sans vidéo à soumettre — utile sur les objectifs qui
        prennent du temps, pour voir ta progression réelle plutôt que seulement l'étape encore verrouillée.
      </p>

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}

      <form action={ajouterEntreeJournal} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <select
          name="branche"
          required
          defaultValue=""
          style={{ background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 14 }}
        >
          <option value="" disabled>Quelle branche ?</option>
          {OPTIONS_BRANCHE.map((b) => (
            <option key={b.cle} value={b.cle}>{b.nom}</option>
          ))}
        </select>
        <textarea
          name="contenu"
          required
          rows={3}
          placeholder="Ex. : 3 tractions strictes aujourd'hui, ressenti correct, encore un peu de tremblement en fin de série."
          style={{ background: COULEURS.surfaceForte, border: `1px solid ${COULEURS.bordure}`, borderRadius: 8, padding: '10px 12px', color: COULEURS.texte, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
        />
        <button
          type="submit"
          style={{ alignSelf: 'flex-start', background: GRADIENT, color: 'white', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Ajouter au journal
        </button>
      </form>

      {entrees.length === 0 ? (
        <p style={{ color: COULEURS.texteFaible, fontSize: 13 }}>Pas encore d'entrée — note ta première séance ci-dessus.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entrees.map((e) => (
            <div key={e.id} style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#f0a', fontWeight: 700 }}>
                  {NOM_BRANCHE[e.branche] ?? e.branche}
                </span>
                <span style={{ fontSize: 11, color: COULEURS.texteFaible }}>
                  {new Date(e.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: 14, color: COULEURS.texte, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{e.contenu}</p>
              <form action={supprimerEntreeJournal}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" style={{ fontSize: 12, color: COULEURS.texteFaible, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
