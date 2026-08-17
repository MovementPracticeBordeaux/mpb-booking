import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { TRONC, BRANCHES, TOUS_LES_NOEUDS, STRUCTURE_SEANCE, noeudSansReponses, statutXP, xpGagneParNoeud, niveauGlobal, courbeXPParJour, estNoeudAcquisDepuisProgression, xpNoeudExercices, pourcentageFlammeNoeud, badgeEleve } from '@/lib/mentorship-modules';
import { CLES_ACCES_MENTORAT } from '@/lib/formules';
import { COULEURS, GRADIENT_TEXTE, POLICE_DISPLAY } from '@/lib/theme';
import ArbreCompetences from './ArbreCompetences';

export const dynamic = 'force-dynamic';

type Progression = {
  module_id: string;
  statut: 'en_attente' | 'acquis' | 'refuse' | null;
  quiz_reussi: boolean;
  quiz_score: number | null;
  quiz_valide_le: string | null;
  reviewed_at: string | null;
  video_url: string | null;
  commentaire_coach: string | null;
};

export default async function MentorshipPage({ searchParams }: { searchParams: { erreur?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const accesAutorise = CLES_ACCES_MENTORAT.includes(profil?.formule_nom ?? '')
    && profil?.abonnement_actif && !profil?.gele;

  if (!accesAutorise) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, letterSpacing: 0.5 }}>MENTORAT</h1>
        <p style={{ color: COULEURS.texteAtt }}>
          Cette page est réservée aux élèves ayant le Mentorat actif.
          {' '}Rends-toi sur <a href="/mentorat/candidature" style={{ color: '#f0a' }}>la page de candidature</a> pour
          demander à rejoindre le programme, ou contacte Sylvain si tu penses qu'il y a une erreur.
        </p>
      </main>
    );
  }

  const [{ data: progressionData }, { data: suiviData }, { data: defisAujourdhuiData }, { data: defisHistoriqueData }] = await Promise.all([
    supabase
      .from('mentorship_progression')
      .select('module_id, statut, quiz_reussi, quiz_score, quiz_valide_le, reviewed_at, video_url, commentaire_coach')
      .eq('eleve_id', user.id),
    supabase
      .from('mentorship_suivi_competence')
      .select('domaine, exercice_ou_theme, statut, commentaire, updated_at')
      .eq('eleve_id', user.id),
    supabase
      .from('mentorship_defi_valide')
      .select('noeud_id')
      .eq('eleve_id', user.id)
      .eq('jour', new Date().toISOString().slice(0, 10)),
    supabase
      .from('mentorship_defi_valide')
      .select('jour')
      .eq('eleve_id', user.id),
  ]);

  const progression = new Map<string, Progression>((progressionData ?? []).map((p: Progression) => [p.module_id, p]));

  // Calcul de l'XP total à partir de la progression réelle (pas de colonne
  // dédiée à maintenir : le total se recalcule à chaque affichage). Les
  // nœuds à exercices indépendants (modèle v4) utilisent leur propre calcul
  // (une part d'XP par exercice + bonus par progression validée).
  const idsModulesAcquis = new Set(
    (progressionData ?? []).filter((p: Progression) => p.statut === 'acquis').map((p: Progression) => p.module_id)
  );
  const estModuleAcquis = (id: string) => idsModulesAcquis.has(id);

  let xpTotal = 0;
  for (const noeud of TOUS_LES_NOEUDS) {
    if (noeud.exercices && noeud.exercices.length > 0) {
      xpTotal += xpNoeudExercices(noeud, estModuleAcquis);
    } else {
      const p = progression.get(noeud.id);
      xpTotal += xpGagneParNoeud(noeud, statutXP(p?.statut ?? null, p?.quiz_reussi ?? false));
    }
  }
  const niveau = niveauGlobal(xpTotal);
  const courbeXP = courbeXPParJour(progressionData ?? [], defisHistoriqueData ?? []);

  // Badge élève (dépassement) : % de nœuds acquis dont la flamme est
  // Légendaire ou plus — recalculé en continu à chaque affichage.
  const noeudsAcquis = TOUS_LES_NOEUDS.filter((n) => estNoeudAcquisDepuisProgression(n, estModuleAcquis));
  const flammesNoeudsAcquis = noeudsAcquis.map((n) => pourcentageFlammeNoeud(n, estModuleAcquis));
  const badge = badgeEleve(flammesNoeudsAcquis);

  // Les nœuds envoyés au client n'ont jamais les bonnes réponses du QCM.
  const troncPublic = TRONC.map(noeudSansReponses);
  const branchesPublic = BRANCHES.map(noeudSansReponses);
  const defisValidesAujourdhui = new Set((defisAujourdhuiData ?? []).map((d) => d.noeud_id));

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(28px, 7vw, 40px)', letterSpacing: 0.5, marginBottom: 4 }}>
        LE <span style={GRADIENT_TEXTE}>MENTORAT</span>
      </h1>
      <p style={{ color: COULEURS.texteFaible, fontSize: 13, marginBottom: 8 }}>
        Le tronc — l'Armure Organique — se gravit seul, niveau après niveau. Une fois validé en entier,
        les cinq branches s'ouvrent et progressent chacune à son rythme.
      </p>
      <a href="/mentorship/journal" style={{ display: 'inline-block', fontSize: 13, color: '#f0a', marginBottom: 24, textDecoration: 'none' }}>
        📓 Mon journal d'entraînement →
      </a>

      {searchParams.erreur && (
        <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{searchParams.erreur}</p>
      )}

      <ArbreCompetences
        tronc={troncPublic}
        branches={branchesPublic}
        progression={progression}
        bilan={suiviData ?? []}
        xpTotal={xpTotal}
        niveau={niveau}
        badge={badge}
        defisValidesAujourdhui={defisValidesAujourdhui}
        courbeXP={courbeXP}
        structureSeance={STRUCTURE_SEANCE}
        estAdmin={profil?.role === 'admin'}
      />
    </main>
  );
}
