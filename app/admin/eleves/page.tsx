import { supabaseAdmin } from '@/lib/supabase-server';
import { attribuerFormule, suspendreAcces, decompterCoaching, modifierQuotaRestant, modifierExpiration, gelerPass, degelerPass, definirDateReprise, modifierPrenomEleveAdmin, modifierTelephoneEleveAdmin, rembourserPaiement, creerEleve, encaisserReglement, encaisserSeanceARegler } from '../actions';
import { FORMULES, prixEspeces } from '@/lib/formules';
import { lienWhatsApp } from '@/lib/telephone';
import ListeElevesRepliable from '../ListeElevesRepliable';
import PanneauxActions from '../PanneauxActions';
import ListePaiementsRepliable from '../ListePaiementsRepliable';

export const dynamic = 'force-dynamic';

export default async function AdminElevesPage({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  const admin = supabaseAdmin();

  // Formules attribuées "à régler plus tard", en attente d'encaissement.
  const { data: aEncaisser } = await admin
    .from('paiements')
    .select('id, formule_nom, created_at, profiles(nom, email, telephone)')
    .eq('moyen_paiement', 'a_regler')
    .order('created_at', { ascending: true });

  // Séances suivies sans formule (inscrites depuis le planning), pas encore
  // déduites d'une formule ni réglées à l'unité.
  const { data: seancesARegler } = await admin
    .from('reservations')
    .select('id, date_seance, profiles(nom, email, telephone), cours(discipline)')
    .eq('a_regler', true)
    .eq('statut', 'confirmee')
    .order('date_seance', { ascending: true });

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

      <PanneauxActions
        panneaux={[
          {
            id: 'attribuer',
            libelle: 'Attribuer une formule',
            contenu: (
          <form action={attribuerFormule} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
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
            <option value="a_regler">⏳ À régler plus tard</option>
            <option value="offert">🎁 Offert</option>
          </select>
          <input type="number" step="0.01" min="0" name="montant" placeholder="Montant reçu (€) — vide si à régler ou offert" />
          <button type="submit">Attribuer</button>
        </form>
            ),
          },
          {
            id: 'creer',
            libelle: 'Nouvel élève',
            contenu: (
          <form action={creerEleve} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
          <input type="email" name="email" placeholder="Adresse email" required />
          <input type="tel" name="telephone" placeholder="Téléphone (optionnel)" />
          <input type="text" name="nom" placeholder="Nom (optionnel)" />
          <button type="submit">Créer le compte</button>
        </form>
            ),
          },
        ]}
      />

      {((aEncaisser ?? []).length > 0 || (seancesARegler ?? []).length > 0) && (
        <section className="bloc-encaisser">
          <style>{`
            .zone-admin main > section.bloc-encaisser {
              border: 1px solid rgba(255,138,0,0.35); border-left: 4px solid #FF8A00; border-radius: 14px;
              background: rgba(255,138,0,0.05); padding: 14px 18px 4px;
            }
            .bloc-encaisser h2 { font-size: 20px; margin: 0 0 4px; }
            .ligne-encaisser {
              display: grid; grid-template-columns: minmax(220px, 1fr) auto auto; gap: 8px 16px; align-items: center;
              padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.08);
            }
            .ligne-encaisser form { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
            @media (max-width: 720px) { .ligne-encaisser { grid-template-columns: 1fr; } }
          `}</style>
          <h2>⏳ À encaisser ({(aEncaisser ?? []).length + (seancesARegler ?? []).length})</h2>
          {(aEncaisser ?? []).map((r) => {
            const p = r.profiles as any;
            const formule = FORMULES[r.formule_nom];
            const depuis = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
            const relance = p?.telephone
              ? lienWhatsApp(p.telephone, `Salut ${p.nom ?? ''} ! Petit rappel pour ta formule ${formule?.nom ?? ''} : ${formule?.prixIndicatif} € en ligne depuis ton espace sur le site, ou en espèces au prochain cours. Merci 🙏`)
              : null;
            return (
              <div key={r.id} className="ligne-encaisser">
                <div style={{ fontSize: 14, minWidth: 0 }}>
                  <strong>{p?.nom || p?.email}</strong> — {formule?.nom ?? r.formule_nom}
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {depuis === 0 ? "aujourd'hui" : `depuis ${depuis} jour${depuis > 1 ? 's' : ''}`} · {formule?.prixIndicatif} € en ligne ou {prixEspeces(r.formule_nom)} € en espèces
                  </div>
                </div>
                <form action={encaisserReglement} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="hidden" name="paiement_id" value={r.id} />
                  <select name="moyen_paiement" defaultValue="especes">
                    <option value="especes">💶 Espèces</option>
                    <option value="virement">🏦 Virement</option>
                    <option value="carte">💳 Carte (TPE)</option>
                  </select>
                  <input type="number" name="montant" step="0.01" min="0" defaultValue={prixEspeces(r.formule_nom) ?? ''} style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid #2a2a30', background: '#1a1a1e', color: '#eee', fontSize: 14 }} />
                  <button type="submit">Encaissé</button>
                </form>
                {relance && (
                  <a href={relance} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: '#25D366', textDecoration: 'none' }}>
                    💬 Relancer
                  </a>
                )}
              </div>
            );
          })}
          {(seancesARegler ?? []).map((r) => {
            const p = r.profiles as any;
            const cours = r.cours as any;
            const date = new Date(r.date_seance + 'T12:00:00Z').toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' });
            const relance = p?.telephone
              ? lienWhatsApp(p.telephone, `Salut ${p.nom ?? ''} ! Petit rappel pour le cours de ${cours?.discipline ?? ''} du ${date} : pense à prendre ta formule, en ligne depuis la page Tarifs du site ou en espèces au prochain cours. La séance y sera déduite. Merci 🙏`)
              : null;
            return (
              <div key={r.id} className="ligne-encaisser">
                <div style={{ fontSize: 14, minWidth: 0 }}>
                  <strong>{p?.nom || p?.email}</strong> — séance sans formule
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {cours?.discipline ?? ''} du {date}
                  </div>
                </div>
                <form action={encaisserSeanceARegler} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="hidden" name="reservation_id" value={r.id} />
                  <select name="moyen_paiement" defaultValue="especes">
                    <option value="especes">💶 Espèces</option>
                    <option value="virement">🏦 Virement</option>
                    <option value="carte">💳 Carte (TPE)</option>
                  </select>
                  <input type="number" name="montant" step="0.01" min="0" defaultValue={FORMULES.cours_unite?.prixIndicatif ?? ''} style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid #2a2a30', background: '#1a1a1e', color: '#eee', fontSize: 14 }} />
                  <button type="submit">Réglée à l'unité</button>
                </form>
                {relance && (
                  <a href={relance} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: '#25D366', textDecoration: 'none' }}>
                    💬 Relancer
                  </a>
                )}
              </div>
            );
          })}
        </section>
      )}

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
