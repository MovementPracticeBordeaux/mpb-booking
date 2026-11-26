// Aperçu de l'arbre de compétences pour la page de présentation du Mentorat :
// une version statique de l'arbre (mêmes illustrations que dans l'espace
// élève) qui montre le chemin de progression — l'Armure Organique d'abord,
// puis les cinq branches qui s'ouvrent ensemble, niveau par niveau.
import { DOMAINE_COULEURS, DOMAINE_LABELS, type Domaine } from '@/lib/mentorship-modules';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';

const ORDRE: Domaine[] = ['connexion', 'flexibilite', 'force', 'figures', 'locomotion'];
const COULEUR_ARMURE = '#ff00aa';

// Intensité par niveau : le niveau 1 est « allumé », les suivants restent à
// conquérir — pour donner à voir le chemin, du bas vers le haut.
const ECLAT: Record<1 | 2 | 3, number> = { 1: 1, 2: 0.55, 3: 0.3 };

function Pastille({ src, couleur, eclat, taille }: { src: string; couleur: string; eclat: number; taille: number | string }) {
  return (
    <span style={{
      display: 'block', width: taille, height: taille, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: `2px solid ${couleur}`, boxShadow: `0 0 ${eclat > 0.9 ? 14 : 6}px ${couleur}${eclat > 0.9 ? 'aa' : '55'}`,
      opacity: 0.35 + eclat * 0.65, background: '#05070d',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: eclat < 0.9 ? 'grayscale(0.5)' : 'none' }} />
    </span>
  );
}

export default function ApercuArbre() {
  const taille = 'clamp(40px, 12vw, 64px)';
  const trait = (couleur: string, eclat: number): React.CSSProperties => ({ width: 2, height: 22, background: couleur, opacity: 0.25 + eclat * 0.6, margin: '0 auto' });

  return (
    <div>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', gap: 'clamp(6px, 2vw, 14px)' }}>
        {/* Repères de niveau */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 34, paddingBottom: 6, fontSize: 10, color: COULEURS.texteFaible, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, minWidth: 0 }}>
          <span>Niv. 3</span><span>Niv. 2</span><span>Niv. 1</span>
        </div>
        <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'clamp(4px, 1.5vw, 12px)' }}>
          {ORDRE.map((d) => {
            const c = DOMAINE_COULEURS[d];
            return (
              <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(9px, 2.6vw, 12px)', letterSpacing: 0.3, color: c, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {DOMAINE_LABELS[d]}
                </span>
                {([3, 2, 1] as const).map((nv, idx) => (
                  <div key={nv} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {idx > 0 && <span style={trait(c, ECLAT[nv])} />}
                    <Pastille src={`/mentorship/${d}-${nv}.png`} couleur={c} eclat={ECLAT[nv]} taille={taille} />
                  </div>
                ))}
                <span style={{ ...trait(COULEUR_ARMURE, 1), height: 26 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Racines : l'Armure Organique */}
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ width: '82%', height: 2, background: COULEUR_ARMURE, opacity: 0.85 }} />
        <span style={{ width: 2, height: 18, background: COULEUR_ARMURE, opacity: 0.85 }} />
        <Pastille src="/mentorship/armure-organique.jpg" couleur={COULEUR_ARMURE} eclat={1} taille={84} />
        <span style={{ fontFamily: POLICE_DISPLAY, fontSize: 13, letterSpacing: 0.5, color: COULEUR_ARMURE, textTransform: 'uppercase', marginTop: 8 }}>Armure Organique</span>
        <span style={{ fontSize: 12, color: COULEURS.texteFaible }}>3 niveaux de fondations</span>
      </div>

    </div>
  );
}
