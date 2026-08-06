'use client';

import { FORMULES } from '@/lib/formules';

async function acheter(priceId: string, formuleNom: string) {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_id: priceId, formule_nom: formuleNom }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Erreur : ' + (data.error ?? 'réponse inattendue du serveur'));
    }
  } catch (e: any) {
    alert('Erreur réseau : ' + e.message);
  }
}

// ⚠️ Remplace ces price_id par les tiens, créés dans le Dashboard Stripe (Produits > Prix).
// Tous en "Achat ponctuel" (aucun n'est récurrent).
const PRICE_IDS: Record<string, string> = {
  cours_decouverte: 'price_1U0elPA7uUFwYAcPMLZhjc6x',
  mensuel_4: 'price_1U0fdzA7uUFwYAcPnpkuSxMV',
  mensuel_8: 'price_1U0fegA7uUFwYAcPHADTfVBr',
  illimite: 'price_1U0ffOA7uUFwYAcP4TyQfjQO',
  carnet_5: 'price_1U0fo1A7uUFwYAcP2F2YkcDL',
  carnet_10: 'price_1U0fp7A7uUFwYAcPt5947mOo',
  coaching_unite: 'price_1U0fhDA7uUFwYAcPgbsvDXyA',
  coaching_carnet_3h: 'price_1U0fjMA7uUFwYAcPJ1bm09Wq',
  coaching_carnet_4h: 'price_1U0fkNA7uUFwYAcPPB0ftT8Q',
  coaching_online: 'price_1U0frAA7uUFwYAcPc2PhR6B3',
  mentorship: 'price_1U0fs2A7uUFwYAcPtoCTfOc3',
  post_mentorship: 'price_1U0ftFA7uUFwYAcPwzVQnERa',
};

const GROUPES = [
  { titre: 'Cours collectifs', cles: ['cours_decouverte', 'illimite', 'mensuel_8', 'mensuel_4', 'carnet_10', 'carnet_5'] },
  { titre: 'Coaching individuel & Mentorship', cles: ['coaching_unite', 'coaching_carnet_4h', 'coaching_carnet_3h', 'coaching_online', 'mentorship', 'post_mentorship'] },
];

export default function TarifsPage({ searchParams }: { searchParams: { erreur?: string } }) {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1>Tarifs & formules</h1>
      {searchParams.erreur && (
        <p style={{ background: '#5a1a1a', color: '#ffb4b4', padding: 12, borderRadius: 8 }}>
          ⚠️ {searchParams.erreur}
        </p>
      )}
      {GROUPES.map((groupe) => (
        <section key={groupe.titre} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, opacity: 0.7 }}>{groupe.titre}</h2>
          {groupe.cles.map((cle) => {
            const f = FORMULES[cle];
            return (
              <div key={cle} style={{ border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <h3 style={{ margin: '0 0 4px' }}>{f.nom}</h3>
                <p style={{ fontSize: 12, opacity: 0.6, margin: '0 0 12px' }}>
                  {f.quota ? `${f.quota} ${f.unite}${f.quota > 1 ? 's' : ''}` : 'Illimité'} · valable {f.validiteMois} mois
                  {f.categorie === 'coaching' && ' · mise en relation après achat'}
                </p>
                <button onClick={() => acheter(PRICE_IDS[cle], cle)}>Acheter</button>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}
