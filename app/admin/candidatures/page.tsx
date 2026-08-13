import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { FORMULES } from '@/lib/formules';
import { accepterCandidature, refuserCandidature, remettreEnAttente } from './actions';

export const dynamic = 'force-dynamic';

const NIVEAU_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

const STATUT_STYLE: Record<string, { label: string; couleur: string; fond: string }> = {
  nouvelle: { label: 'Nouvelle', couleur: '#f0a', fond: 'rgba(255,0,170,0.12)' },
  acceptee: { label: 'Acceptée', couleur: '#9ef29e', fond: 'rgba(80,200,120,0.15)' },
  refusee: { label: 'Refusée', couleur: '#ff6b6b', fond: 'rgba(255,107,107,0.1)' },
};

type Candidature = {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  niveau: string;
  formule_souhaitee: string | null;
  objectifs: string;
  statut: 'nouvelle' | 'acceptee' | 'refusee';
  cree_le: string;
};

export default async function AdminCandidaturesPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') {
    return <main style={{ padding: 20 }}>Accès réservé à l'admin.</main>;
  }

  const admin = supabaseAdmin();
  const { data: candidaturesData } = await admin
    .from('mentorat_candidatures')
    .select('*')
    .order('cree_le', { ascending: false });

  const candidatures = (candidaturesData ?? []) as Candidature[];
  const nouvelles = candidatures.filter((c) => c.statut === 'nouvelle');
  const traitees = candidatures.filter((c) => c.statut !== 'nouvelle');

  function CarteCandidature({ c }: { c: Candidature }) {
    const style = STATUT_STYLE[c.statut];
    return (
      <section
        key={c.id}
        style={{ border: `1px solid ${COULEURS.bordure}`, borderRadius: 12, padding: 20, marginBottom: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.3, margin: '0 0 2px' }}>{c.nom}</h2>
            <p style={{ fontSize: 12, color: COULEURS.texteFaible, margin: 0 }}>
              {c.email}{c.telephone ? ` · ${c.telephone}` : ''}
            </p>
          </div>
          <span
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: 999, color: style.couleur, background: style.fond,
            }}
          >
            {style.label}
          </span>
        </div>

        <p style={{ fontSize: 13, color: COULEURS.texteAtt, margin: '12px 0 4px' }}>
          <strong>Niveau :</strong> {NIVEAU_LABELS[c.niveau] ?? c.niveau}
          {' · '}
          <strong>Durée souhaitée :</strong> {c.formule_souhaitee ? FORMULES[c.formule_souhaitee]?.nom ?? c.formule_souhaitee : 'non précisée'}
        </p>
        <p style={{ fontSize: 13, color: COULEURS.texte, whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{c.objectifs}</p>

        <p style={{ fontSize: 11, color: COULEURS.texteFaible, margin: '10px 0 0' }}>
          Reçue le {new Date(c.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {c.statut === 'nouvelle' && (
            <>
              <form action={accepterCandidature}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" style={boutonStyle('#4caf7d', 'rgba(80,200,120,0.15)', '#9ef29e')}>✓ Accepter</button>
              </form>
              <form action={refuserCandidature}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" style={boutonStyle('#ff6b6b', 'rgba(255,107,107,0.1)', '#ff6b6b')}>Refuser</button>
              </form>
            </>
          )}
          {c.statut === 'acceptee' && (
            <a href="/admin/eleves" style={{ fontSize: 13, color: '#f0a', alignSelf: 'center' }}>
              → Attribuer la formule depuis Élèves &amp; paiements
            </a>
          )}
          {c.statut !== 'nouvelle' && (
            <form action={remettreEnAttente}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" style={boutonStyle('#666', 'transparent', COULEURS.texteFaible)}>Remettre en attente</button>
            </form>
          )}
        </div>
      </section>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        CANDIDATURES <span style={GRADIENT_TEXTE}>MENTORAT</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 24 }}>
        {nouvelles.length} nouvelle{nouvelles.length !== 1 ? 's' : ''} candidature{nouvelles.length !== 1 ? 's' : ''} en attente de traitement.
      </p>

      {searchParams.erreur && (
        <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 16 }}>{searchParams.erreur}</p>
      )}

      {nouvelles.length === 0 ? (
        <p style={{ color: COULEURS.texteAtt, marginBottom: 24 }}>Aucune candidature en attente pour le moment.</p>
      ) : (
        nouvelles.map((c) => <CarteCandidature key={c.id} c={c} />)
      )}

      {traitees.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ fontSize: 13, color: COULEURS.texteAtt, cursor: 'pointer', marginBottom: 12 }}>
            Candidatures déjà traitées ({traitees.length})
          </summary>
          {traitees.map((c) => <CarteCandidature key={c.id} c={c} />)}
        </details>
      )}
    </main>
  );
}

function boutonStyle(bordure: string, fond: string, couleur: string): React.CSSProperties {
  return {
    fontSize: 13, padding: '8px 16px', borderRadius: 999,
    border: `1px solid ${bordure}`, background: fond, color: couleur, cursor: 'pointer',
  };
}
