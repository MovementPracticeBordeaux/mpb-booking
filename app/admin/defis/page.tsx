import { supabaseAdmin } from '@/lib/supabase-server';
import { creerDefiMensuel, modifierDefiMensuel, supprimerDefiMensuel, validerParticipationDefi, invaliderParticipationDefi } from '../actions';

export const dynamic = 'force-dynamic';

const LABEL_NIVEAU: Record<string, string> = { facile: '🥉 Bronze', moyen: '🥈 Argent', dur: '🥇 Or' };

export default async function AdminDefisPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();
  const { data: defis } = await admin
    .from('defis_mensuels')
    .select('*')
    .order('created_at', { ascending: false });

  const defiActuel = defis?.[0] ?? null;

  // Participations au défi actuel, avec le nom de l'élève.
  const { data: participationsBrut } = defiActuel
    ? await admin
        .from('defi_participations')
        .select('*, profiles(nom, email)')
        .eq('defi_id', defiActuel.id)
        .order('created_at', { ascending: true })
    : { data: [] as any[] };

  const enAttente = (participationsBrut ?? []).filter((p) => !p.valide);
  const validees = (participationsBrut ?? []).filter((p) => p.valide);

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <h1>Défi du mois</h1>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        Un défi partagé par tous, avec 3 niveaux de difficulté que chaque élève choisit lui-même selon sa
        fréquentation. Visible via le lien "🏆 Défi du mois" dans le menu principal du site (pas seulement sur leur
        profil). L'envoi de la vidéo se fait par WhatsApp — valide ici la participation une fois la vidéo reçue,
        l'élève gagne alors son étoile (colorée selon le niveau choisi) dans le classement public.
      </p>

      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>⚠️ {searchParams.erreur}</p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>✅ {searchParams.succes}</p>
      )}

      {defiActuel && (
        <div style={{ border: '1px solid #f0a', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, margin: '0 0 6px', textTransform: 'uppercase' }}>
            Défi actuellement affiché — {(participationsBrut ?? []).length} participation{(participationsBrut ?? []).length !== 1 ? 's' : ''} en cours
          </p>

          <details style={{ marginBottom: 12 }}>
            <summary style={{ fontSize: 13, cursor: 'pointer', color: '#f0a' }}>✏️ Modifier ce défi</summary>
            <form action={modifierDefiMensuel} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 460, marginTop: 10 }}>
              <input type="hidden" name="defi_id" value={defiActuel.id} />
              <input name="titre" defaultValue={defiActuel.titre} required />
              <input name="question_niveau" defaultValue={defiActuel.question_niveau} required />
              <label style={{ fontSize: 12, opacity: 0.7 }}>🥉 Version accessible</label>
              <textarea name="description_facile" defaultValue={defiActuel.description_facile} rows={2} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
              <label style={{ fontSize: 12, opacity: 0.7 }}>🥈 Version intermédiaire</label>
              <textarea name="description_moyen" defaultValue={defiActuel.description_moyen} rows={2} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
              <label style={{ fontSize: 12, opacity: 0.7 }}>🥇 Version corsée</label>
              <textarea name="description_dur" defaultValue={defiActuel.description_dur} rows={2} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
              <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>
                Les niveaux déjà choisis et les étoiles déjà validées par les élèves sont conservés — seul le texte change.
              </p>
              <button type="submit">Enregistrer les modifications</button>
            </form>
          </details>

          <h3 style={{ margin: '0 0 6px' }}>{defiActuel.titre}</h3>
          <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 10px', fontStyle: 'italic' }}>{defiActuel.question_niveau}</p>
          <p style={{ fontSize: 12, margin: '4px 0' }}><strong>🥉 Bronze :</strong> {defiActuel.description_facile}</p>
          <p style={{ fontSize: 12, margin: '4px 0' }}><strong>🥈 Argent :</strong> {defiActuel.description_moyen}</p>
          <p style={{ fontSize: 12, margin: '4px 0' }}><strong>🥇 Or :</strong> {defiActuel.description_dur}</p>

          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 12, cursor: 'pointer', color: '#f88' }}>🗑️ Supprimer ce défi</summary>
            <p style={{ fontSize: 12, opacity: 0.7, margin: '8px 0' }}>
              ⚠️ Supprime aussi définitivement les {(participationsBrut ?? []).length} participation{(participationsBrut ?? []).length !== 1 ? 's' : ''}
              {' '}liée{(participationsBrut ?? []).length !== 1 ? 's' : ''} à ce défi, y compris les étoiles déjà validées. Si tu veux juste corriger
              une faute, utilise plutôt "Modifier ce défi" ci-dessus.
            </p>
            <form action={supprimerDefiMensuel}>
              <input type="hidden" name="defi_id" value={defiActuel.id} />
              <button type="submit" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid #a44', background: 'none', color: '#f88', cursor: 'pointer' }}>
                Confirmer la suppression définitive
              </button>
            </form>
          </details>

          <h4 style={{ marginTop: 16, marginBottom: 8 }}>En attente de validation ({enAttente.length})</h4>
          {enAttente.length === 0 && <p style={{ fontSize: 12, opacity: 0.5 }}>Personne pour l'instant.</p>}
          {enAttente.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #333' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{p.profiles?.nom || p.profiles?.email}</span>
              <span style={{ fontSize: 12 }}>{LABEL_NIVEAU[p.niveau]}</span>
              <form action={validerParticipationDefi}>
                <input type="hidden" name="participation_id" value={p.id} />
                <button type="submit" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid #4a4', background: 'none', color: '#8f8', cursor: 'pointer' }}>
                  ✓ Valider
                </button>
              </form>
            </div>
          ))}

          <h4 style={{ marginTop: 16, marginBottom: 8 }}>Validés ({validees.length})</h4>
          {validees.length === 0 && <p style={{ fontSize: 12, opacity: 0.5 }}>Personne pour l'instant.</p>}
          {validees.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #333' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{p.profiles?.nom || p.profiles?.email}</span>
              <span style={{ fontSize: 12 }}>{LABEL_NIVEAU[p.niveau]}</span>
              <form action={invaliderParticipationDefi}>
                <input type="hidden" name="participation_id" value={p.id} />
                <button type="submit" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '1px solid #666', background: 'none', color: '#999', cursor: 'pointer' }}>
                  Annuler
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2>Publier un nouveau défi</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>Remplace immédiatement celui affiché sur le site (les participations au précédent restent conservées dans son historique).</p>
        <form action={creerDefiMensuel} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 460 }}>
          <input name="titre" placeholder="Titre (ex. Dead hang)" required />
          <input name="question_niveau" placeholder="Question posée à l'élève (ex. Tu viens régulièrement à ce cours ?)" required />
          <label style={{ fontSize: 12, opacity: 0.7 }}>🥉 Version accessible (peu régulier)</label>
          <textarea name="description_facile" placeholder="ex. Tiens 30 secondes en suspension à la barre" rows={2} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
          <label style={{ fontSize: 12, opacity: 0.7 }}>🥈 Version intermédiaire</label>
          <textarea name="description_moyen" placeholder="ex. Tiens 60 secondes en suspension à la barre" rows={2} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
          <label style={{ fontSize: 12, opacity: 0.7 }}>🥇 Version corsée (très régulier)</label>
          <textarea name="description_dur" placeholder="ex. Tiens 90 secondes en suspension à la barre" rows={2} required style={{ fontFamily: 'inherit', fontSize: 14, padding: 8 }} />
          <button type="submit">Publier ce défi</button>
        </form>
      </section>

      <section>
        <h2>Historique</h2>
        {(defis ?? []).length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Aucun défi publié pour le moment.</p>}
        {(defis ?? []).map((d, i) => (
          <details key={d.id} style={{ borderBottom: '1px solid #333', padding: '10px 0' }}>
            <summary style={{ fontSize: 13, cursor: 'pointer' }}>
              {new Date(d.created_at).toLocaleDateString('fr-FR')} · {d.titre}
              {i === 0 && ' · (actuel)'}
            </summary>
            <p style={{ fontSize: 12, margin: '8px 0 4px' }}>🥉 {d.description_facile}</p>
            <p style={{ fontSize: 12, margin: '4px 0' }}>🥈 {d.description_moyen}</p>
            <p style={{ fontSize: 12, margin: '4px 0 8px' }}>🥇 {d.description_dur}</p>
            {i !== 0 && (
              <form action={supprimerDefiMensuel}>
                <input type="hidden" name="defi_id" value={d.id} />
                <button type="submit" style={{ fontSize: 12, color: '#f88' }}>Supprimer de l'historique</button>
              </form>
            )}
          </details>
        ))}
      </section>
    </main>
  );
}
