import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import { FORMULES, BRANCHES_MENTORAT } from '@/lib/formules';
import { accepterCandidature, refuserCandidature, remettreEnAttente } from './actions';

export const dynamic = 'force-dynamic';

const NIVEAU_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

const NOM_BRANCHE = Object.fromEntries(BRANCHES_MENTORAT.map((b) => [b.cle, b.nom]));

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
  duree: string | null;
  nombre_branches: number | null;
  branches: string | null;
  objectifs: string;
  statut: 'nouvelle' | 'acceptee' | 'refusee';
  cree_le: string;
};

function libelleBranches(c: Candidature): string {
  if (!c.branches) return 'non précisé';
  return c.branches.split(',').map((cle) => NOM_BRANCHE[cle] ?? cle).join(' + ');
}

function libelleFormule(c: Candidature): string {
  if (!c.nombre_branches || !c.duree) return 'non précisée';
  const cle = `mentorship_${c.nombre_branches === 2 ? '2branches' : '1branche'}_${c.duree}`;
  return `${FORMULES[cle]?.prixIndicatif ?? '?'} €`;
}

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

  // Pour chaque candidature, on regarde si un compte existe déjà avec cet
  // email (comparaison insensible à la casse), et s'il a déjà une formule
  // Mentorat active — pour savoir en un coup d'œil quoi faire ensuite.
  const emails = candidatures.map((c) => c.email.toLowerCase());
  const { data: profilsData } = emails.length
    ? await admin.from('profiles').select('email, formule_nom, abonnement_actif').in('email', emails)
    : { data: [] };
  const profilParEmail = new Map(
    (profilsData ?? []).map((p: any) => [p.email?.toLowerCase(), p])
  );

  function infoCompte(email: string): { aUnCompte: boolean; aDejaUneFormule: boolean } {
    const p = profilParEmail.get(email.toLowerCase());
    if (!p) return { aUnCompte: false, aDejaUneFormule: false };
    const formule = p.formule_nom ? FORMULES[p.formule_nom] : null;
    return { aUnCompte: true, aDejaUneFormule: !!(formule?.categorie === 'coaching' && p.abonnement_actif) };
  }

  const nouvelles = candidatures.filter((c) => c.statut === 'nouvelle');
  const traitees = candidatures.filter((c) => c.statut !== 'nouvelle');

  function CarteCandidature({ c }: { c: Candidature }) {
    const style = STATUT_STYLE[c.statut];
    const compte = infoCompte(c.email);
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
          <strong>Branche(s) :</strong> {libelleBranches(c)}
          {' · '}
          <strong>Durée :</strong> {c.duree ? `${c.duree} mois` : 'non précisée'}
          {' · '}
          <strong>Tarif :</strong> {libelleFormule(c)}
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0' }}>
          {compte.aUnCompte ? (
            <span style={{ color: '#9ef29e' }}>✓ A déjà un compte sur le site</span>
          ) : (
            <span style={{ color: '#ffb4b4' }}>⚠ Pas encore de compte — à créer avant de pouvoir attribuer une formule</span>
          )}
          {compte.aDejaUneFormule && (
            <span style={{ color: '#ffcf6b' }}> · a déjà une formule coaching/Mentorat active</span>
          )}
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
