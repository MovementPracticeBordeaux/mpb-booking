import { supabaseAdmin } from '@/lib/supabase-server';
import { attribuerFormule, suspendreAcces, decompterCoaching, modifierQuotaRestant, modifierExpiration, gelerPass, degelerPass, definirDateReprise, modifierPrenomEleveAdmin, modifierTelephoneEleveAdmin, rembourserPaiement, creerEleve } from '../actions';
import { FORMULES } from '@/lib/formules';
import ListeElevesRepliable from '../ListeElevesRepliable';
import ListePaiementsRepliable from '../ListePaiementsRepliable';

export const dynamic = 'force-dynamic';

export default async function AdminElevesPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();

  const { data: eleves } = await admin
    .from('profiles')
    .select('id, nom, email, telephone, created_at')
    .order('nom', { ascending: true, nullsFirst: false });

  // Un élève peut avoir plusieurs abonnements actifs (planning + coaching +
  // mentorat en parallèle) — chaque ligne d'abonnements représente une
  // formule active dans une catégorie précise.
  const { data: abonnementsBrut } = await admin
    .from('abonnements')
    .select('*')
    .eq('abonnement_actif', true)
    .order('categorie');

  // Pour classer chaque élève (jamais eu de formule / ancien client sans
  // rien d'actif / actif) — nécessaire pour les filtres de la liste et le
  // nettoyage automatique des comptes fantômes. On ne récupère que les
  // eleve_id, pas les lignes complètes, pour rester léger même avec
  // beaucoup d'inscrits.
  const { data: tousAbonnementsIds } = await admin.from('abonnements').select('eleve_id');
  const { data: tousPaiementsIds } = await admin.from('paiements').select('eleve_id');
  const idsAyantDejaEuFormule = new Set([
    ...(tousAbonnementsIds ?? []).map((a) => a.eleve_id),
    ...(tousPaiementsIds ?? []).map((p) => p.eleve_id),
  ]);

  const { data: paiements } = await admin
    .from('paiements')
    .select('*, profiles!paiements_eleve_id_fkey(email)')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ maxWidth: 1160, margin: '0 auto', padding: 20 }}>
      <h1>Élèves</h1>

      <div className="deux-colonnes">
      <section style={{ marginBottom: 32 }}>
        <h2>Ajouter un élève par email</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Pour créer directement le compte de quelqu'un qui paye en présentiel et n'a jamais utilisé le site —
          il/elle pourra se connecter plus tard avec ce même email via le lien magique habituel.
        </p>
        <form action={creerEleve} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
          <input type="email" name="email" placeholder="Adresse email" required />
          <input type="tel" name="telephone" placeholder="Téléphone (optionnel)" />
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
            <optgroup label="Coaching individuel">
              {Object.entries(FORMULES).filter(([, f]) => f.categorie === 'coaching').map(([cle, f]) => (
                <option key={cle} value={cle}>{f.nom} ({f.quota ? `${f.quota} ${f.unite}s` : 'illimité'}, {f.validiteMois} mois)</option>
              ))}
            </optgroup>
            <optgroup label="Mentorat">
              {Object.entries(FORMULES).filter(([, f]) => f.categorie === 'mentorat' && !f.retiree).map(([cle, f]) => (
                <option key={cle} value={cle}>{f.nom} ({f.quota ? `${f.quota} ${f.unite}s` : 'illimité'}, {f.validiteMois} mois)</option>
              ))}
            </optgroup>
          </select>
          <select name="moyen_paiement" defaultValue="especes">
            <option value="especes">💶 Espèces</option>
            <option value="virement">🏦 Virement</option>
            <option value="carte">💳 Carte (TPE)</option>
            <option value="offert">🎁 Offert</option>
          </select>
          <input type="number" step="0.01" min="0" name="montant" placeholder="Montant reçu (€)" />
          <button type="submit">Attribuer</button>
        </form>
      </section>
      </div>

      <section style={{ marginBottom: 32 }}>
        <ListeElevesRepliable
          eleves={(eleves ?? []).map((e) => ({ id: e.id, nom: e.nom, email: e.email, telephone: e.telephone, createdAt: e.created_at }))}
          abonnements={(abonnementsBrut ?? []).map((a) => ({
            ...a,
            formuleAffichage: FORMULES[a.formule_nom] ?? null,
          }))}
          idsAyantDejaEuFormule={[...idsAyantDejaEuFormule]}
          suspendreAcces={suspendreAcces}
          modifierQuotaRestant={modifierQuotaRestant}
          modifierExpiration={modifierExpiration}
          gelerPass={gelerPass}
          degelerPass={degelerPass}
          definirDateReprise={definirDateReprise}
          modifierPrenomEleveAdmin={modifierPrenomEleveAdmin}
          modifierTelephoneEleveAdmin={modifierTelephoneEleveAdmin}
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
