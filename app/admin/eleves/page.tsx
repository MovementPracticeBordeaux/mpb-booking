import { supabaseAdmin } from '@/lib/supabase-server';
import { attribuerFormule, suspendreAcces, decompterCoaching, modifierQuotaRestant, modifierExpiration, gelerPass, degelerPass, definirDateReprise, rembourserPaiement, creerEleve } from '../actions';
import { FORMULES } from '@/lib/formules';
import ListeElevesRepliable from '../ListeElevesRepliable';
import ListePaiementsRepliable from '../ListePaiementsRepliable';

export const dynamic = 'force-dynamic';

export default async function AdminElevesPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();

  const { data: eleves } = await admin
    .from('profiles')
    .select('*')
    .order('email');

  const { data: paiements } = await admin
    .from('paiements')
    .select('*, profiles!paiements_eleve_id_fkey(email)')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1>Élèves & paiements</h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}
      {searchParams.succes && (
        <p style={{ background: '#1a4d2e', color: '#b4ffcc', padding: 12, borderRadius: 8 }}>
          ✅ {searchParams.succes}
        </p>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2>Ajouter un élève par email</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Pour créer directement le compte de quelqu'un qui paye en présentiel et n'a jamais utilisé le site —
          il/elle pourra se connecter plus tard avec ce même email via le lien magique habituel.
        </p>
        <form action={creerEleve} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <input type="email" name="email" placeholder="Adresse email" required />
          <input type="text" name="nom" placeholder="Nom (optionnel)" />
          <button type="submit">Créer le compte</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Attribuer une formule à un élève</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Utile pour offrir un cours d'essai, un geste commercial, ou un paiement reçu en dehors du site (liquide, virement...).
          Décoche "Payé" si c'est offert.
        </p>
        <form action={attribuerFormule} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <select name="eleve_id" required>
            <option value="">-- Choisir un élève --</option>
            {(eleves ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.nom ?? e.email}</option>
            ))}
          </select>
          <select name="formule_nom" required defaultValue="illimite">
            <optgroup label="Cours collectifs">
              {Object.entries(FORMULES).filter(([, f]) => f.categorie === 'planning').map(([cle, f]) => (
                <option key={cle} value={cle}>{f.nom} ({f.quota ? `${f.quota} ${f.unite}s` : 'illimité'}, {f.validiteMois} mois)</option>
              ))}
            </optgroup>
            <optgroup label="Coaching & Mentorship">
              {Object.entries(FORMULES).filter(([, f]) => f.categorie === 'coaching').map(([cle, f]) => (
                <option key={cle} value={cle}>{f.nom} ({f.quota ? `${f.quota} ${f.unite}s` : 'illimité'}, {f.validiteMois} mois)</option>
              ))}
            </optgroup>
          </select>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" name="paye" defaultChecked /> Payé
          </label>
          <input type="number" step="0.01" name="montant" placeholder="Montant reçu (€) — laisser vide si offert" />
          <button type="submit">Attribuer</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <ListeElevesRepliable
          eleves={(eleves ?? []).map((e) => ({
            ...e,
            formuleAffichage: e.formule_nom ? FORMULES[e.formule_nom] ?? null : null,
          }))}
          suspendreAcces={suspendreAcces}
          modifierQuotaRestant={modifierQuotaRestant}
          modifierExpiration={modifierExpiration}
          gelerPass={gelerPass}
          degelerPass={degelerPass}
          definirDateReprise={definirDateReprise}
          decompterCoaching={decompterCoaching}
        />
      </section>

      <section>
        <ListePaiementsRepliable
          paiements={(paiements ?? []).map((p: any) => ({
            ...p,
            email: p.profiles?.email ?? null,
            formuleNom: FORMULES[p.formule_nom]?.nom ?? p.formule_nom,
          }))}
          rembourserPaiement={rembourserPaiement}
        />
      </section>
    </main>
  );
}
