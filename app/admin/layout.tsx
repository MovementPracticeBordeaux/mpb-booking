import { Suspense } from 'react';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';
import AdminNav from './AdminNav';
import AdminRetours from './AdminRetours';

// Charte commune à tout l'admin. Les règles ne ciblent que les éléments
// SANS style propre (:not([style])) pour ne jamais écraser un bouton ou un
// champ volontairement coloré ailleurs.
const CSS_ADMIN = `
  .zone-admin { color-scheme: dark; }
  .zone-admin h1 { font-family: ${POLICE_DISPLAY}; letter-spacing: 0.5px; font-weight: 400; font-size: 34px; margin: 8px 0 16px; }
  .zone-admin h2 { font-family: ${POLICE_DISPLAY}; letter-spacing: 0.5px; font-weight: 400; font-size: 24px; margin: 0 0 12px; }
  /* Pages en pleine largeur, sections séparées par un simple filet plutôt
     qu'enfermées dans des boîtes qui compressaient l'affichage. */
  .zone-admin main > section { margin: 0 0 28px; padding: 0 0 24px; border-bottom: 1px solid ${COULEURS.bordure}; }
  .zone-admin main > section:last-child { border-bottom: none; }
  /* Sur grand écran, les formulaires ne s'étirent pas sur 1100px de large :
     au-delà de cette largeur, un champ texte devient illisible. */
  .zone-admin main form { max-width: 720px; }
  /* Formulaire et liste côte à côte sur grand écran, empilés sur téléphone. */
  .zone-admin .deux-colonnes {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
    gap: 0 40px; align-items: start; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid ${COULEURS.bordure};
  }
  .zone-admin .deux-colonnes > section { min-width: 0; margin: 0 0 24px; }
  .zone-admin main > .deux-colonnes:last-child { border-bottom: none; }
  .zone-admin select:not([style]),
  .zone-admin textarea:not([style]),
  .zone-admin input:not([style]):not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=submit]) {
    background: ${COULEURS.surfaceForte}; color: ${COULEURS.texte}; border: 1px solid ${COULEURS.bordure};
    border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; box-sizing: border-box;
  }
  .zone-admin select:focus, .zone-admin input:focus, .zone-admin textarea:focus {
    outline: none; border-color: #FF2D78;
  }
  .zone-admin select option, .zone-admin select optgroup { background: #151518; color: ${COULEURS.texte}; }
  .zone-admin button:not([style]) {
    background: none; color: #FF2D78; border: 1px solid #FF2D78; border-radius: 999px;
    padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
  }
  .zone-admin button:not([style]):hover { background: rgba(255,45,120,0.12); }
  .zone-admin details > summary { cursor: pointer; }

  .nav-admin { max-width: 1200px; margin: 16px auto 0; padding: 0 20px; box-sizing: border-box; }
  .nav-admin-pastilles, .nav-admin-sous {
    display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px;
  }
  .nav-admin-pastilles::-webkit-scrollbar, .nav-admin-sous::-webkit-scrollbar { display: none; }
  .pastille {
    flex-shrink: 0; font-size: 14px; font-weight: 600; padding: 8px 14px; border-radius: 999px; text-decoration: none;
    color: inherit; border: 1px solid ${COULEURS.bordure}; background: ${COULEURS.surface}; display: inline-flex; align-items: center; gap: 6px;
  }
  .pastille-active { border-color: #FF2D78; color: #FF2D78; background: rgba(255,45,120,0.12); }
  .nav-admin-sous { margin-top: 10px; gap: 16px; border-bottom: 1px solid ${COULEURS.bordure}; }
  .sous-onglet {
    flex-shrink: 0; font-size: 13px; padding: 6px 0; text-decoration: none; color: ${COULEURS.texteAtt};
    border-bottom: 2px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 6px;
  }
  .sous-onglet-actif { color: ${COULEURS.texte}; border-bottom-color: #FF2D78; }
  .pastille-badge {
    font-size: 11px; font-weight: 700; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
    background: #FF2D78; color: white; display: inline-flex; align-items: center; justify-content: center;
  }

  .bulle-admin {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(20px + env(safe-area-inset-bottom));
    z-index: 1000; max-width: min(520px, calc(100vw - 32px)); padding: 12px 16px; border-radius: 12px;
    font-size: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); cursor: pointer; animation: bulle-entree 0.2s ease-out;
  }
  .bulle-admin-succes { background: #173d28; color: #b4ffcc; border: 1px solid #2f7a4f; }
  .bulle-admin-erreur { background: #4a1818; color: #ffc4c4; border: 1px solid #8a3030; }
  @keyframes bulle-entree { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profil || profil.role !== 'admin') {
    return <main style={{ padding: 20 }}>Accès réservé à l'admin.</main>;
  }

  // Pastilles de rappel sur les onglets : ce qui attend une action de Sylvain.
  const admin = supabaseAdmin();
  const [{ count: soumissions }, { count: candidatures }, { data: defiActuel }] = await Promise.all([
    admin.from('mentorship_progression').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    admin.from('mentorat_candidatures').select('*', { count: 'exact', head: true }).eq('statut', 'nouvelle'),
    admin.from('defis_mensuels').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const { count: defisEnAttente } = defiActuel
    ? await admin.from('defi_participations').select('*', { count: 'exact', head: true }).eq('defi_id', defiActuel.id).eq('valide', false)
    : { count: 0 };

  const badges: Record<string, number> = {
    '/admin/mentorship': soumissions ?? 0,
    '/admin/candidatures': candidatures ?? 0,
    '/admin/defis': defisEnAttente ?? 0,
  };

  return (
    <div className="zone-admin">
      <style>{CSS_ADMIN}</style>
      <AdminNav badges={badges} />
      {children}
      <Suspense fallback={null}>
        <AdminRetours />
      </Suspense>
    </div>
  );
}
