import { COULEURS, GRADIENT, GRADIENT_TEXTE, POLICE_DISPLAY, POLICE_CORPS } from '@/lib/theme';
import { FORMULES } from '@/lib/formules';

const DISCIPLINES = [
  { nom: 'Handstand', icone: '/disciplines/handstand.png', desc: "Équilibre sur les mains, du gainage aux figures libres." },
  { nom: 'Calisthenics', icone: '/disciplines/calisthenics.png', desc: 'Force au poids de corps : tractions, dips, éléments statiques.' },
  { nom: 'Mobilité', icone: '/disciplines/mobilite.png', desc: 'Amplitude articulaire et contrôle, pour bouger sans limite.' },
  { nom: 'Locomotion', icone: '/disciplines/locomotion.png', desc: 'Déplacements au sol, quadrupédie, transitions fluides.' },
  { nom: 'Arm Balance', icone: '/disciplines/arm-balance.png', desc: 'Équilibres sur les bras, entre force et précision.' },
  { nom: 'Altinha', icone: '/disciplines/altinha.png', desc: 'Jonglerie au pied façon futevôlei, coordination et jeu.' },
];

const FORMULES_TEASER = ['cours_decouverte', 'illimite', 'mensuel_8', 'mensuel_4', 'carnet_10', 'carnet_5'];

const FAQ = [
  { q: "C'est adapté aux débutants ?", r: 'Oui. Les séances sont accessibles à tous niveaux, avec des options et progressions individuelles.' },
  { q: 'Vous proposez quels cours ?', r: 'Handstand, calisthenics, mobilité, mouvement au sol, arm balance et altinha.' },
  { q: 'Où ont lieu les cours ?', r: 'À Bordeaux rive droite, en extérieur sur les quais ou en intérieur dans Darwin.' },
  { q: 'Faut-il être souple ou déjà fort pour venir ?', r: 'Non, aucun prérequis. Le but est justement de développer force, mobilité et aisance corporelle.' },
  { q: 'Comment réserver une place ?', r: 'Directement depuis la page Planning : choisis ta formule, ton créneau, tu réserves, c\'est instantané.' },
];

export default function AccueilPage() {
  return (
    <main>
      <style>{`
        @keyframes defiler { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-piste { display: flex; width: max-content; animation: defiler 22s linear infinite; }
        details > summary { cursor: pointer; list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* HERO */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: COULEURS.texteFaible, marginBottom: 16 }}>
          BORDEAUX RIVE DROITE · DARWIN &amp; LES QUAIS
        </p>
        <img
          src="/logo.png"
          alt="Movement Practice Bordeaux"
          style={{ height: 96, margin: '0 auto 20px', display: 'block' }}
        />
        <h1 style={{ fontFamily: POLICE_DISPLAY, fontSize: 'clamp(32px, 9vw, 76px)', lineHeight: 1.02, letterSpacing: 0.5, margin: '0 0 20px', whiteSpace: 'nowrap' }}>
          MOVEMENT <span style={GRADIENT_TEXTE}>PRACTICE</span>
        </h1>
        <p style={{ fontSize: 18, color: COULEURS.texteAtt, maxWidth: 520, margin: '0 auto 32px' }}>
          Ton corps n'est pas fait pour choisir. Calisthenics, handstand, mobilité et locomotion réunis
          dans une pratique complète, ouverte à tous les niveaux.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/planning" style={{ background: GRADIENT, color: 'white', fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
            Voir le planning
          </a>
          <a href="/tarifs" style={{ border: `1px solid ${COULEURS.bordure}`, color: COULEURS.texte, fontWeight: 600, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>
            Découvrir les tarifs
          </a>
        </div>
      </section>

      {/* MARQUEE SIGNATURE */}
      <div style={{ overflow: 'hidden', borderTop: `1px solid ${COULEURS.bordure}`, borderBottom: `1px solid ${COULEURS.bordure}`, padding: '18px 0' }}>
        <div className="marquee-piste">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex' }}>
              {DISCIPLINES.map((d) => (
                <span key={d.nom + i} style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, letterSpacing: 1, padding: '0 28px', whiteSpace: 'nowrap', ...GRADIENT_TEXTE }}>
                  {d.nom.toUpperCase()} ✦
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PHOTO D'ACTION */}
      <div style={{ maxHeight: 420, overflow: 'hidden' }}>
        <img
          src="/sylvain-handstand-spot.png"
          alt="Handstand en pratique du mouvement à Bordeaux"
          style={{ width: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
      </div>

      {/* MÉTHODE */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 20px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>LA MÉTHODE</p>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 32, letterSpacing: 0.5, margin: '0 0 16px' }}>
          Un corps polyvalent, pas un corps spécialisé
        </h2>
        <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 12 }}>
          La pratique combine calisthenics, mobilité, force, locomotion et travail sur les mains pour
          construire une base solide et adaptable. On part des fondamentaux, et chacun progresse à son
          rythme vers des enchaînements plus complexes.
        </p>
        <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6 }}>
          Bien plus qu'un entraînement physique : patience, concentration et conscience corporelle se
          construisent séance après séance.
        </p>
      </section>

      {/* DISCIPLINES */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {DISCIPLINES.map((d) => (
            <div key={d.nom} style={{ border: `1px solid ${COULEURS.bordure}`, background: COULEURS.surface, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <img src={d.icone} alt={d.nom} style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 12 }} />
              <h3 style={{ fontFamily: POLICE_DISPLAY, fontSize: 20, letterSpacing: 0.5, margin: '0 0 8px' }}>{d.nom.toUpperCase()}</h3>
              <p style={{ fontSize: 14, color: COULEURS.texteAtt, margin: 0, lineHeight: 1.5 }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TÉMOIGNAGE */}
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 64px', textAlign: 'center' }}>
        <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 24, lineHeight: 1.4, letterSpacing: 0.3 }}>
          « Une vraie réappropriation de ma mobilité, et une réconciliation avec le sport. »
        </p>
        <p style={{ color: COULEURS.texteFaible, fontSize: 14, marginTop: 12 }}>— Florence, élève</p>
      </section>

      {/* QUI EST SYLVAIN */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 64px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <img
          src="/sylvain-portrait.jpg"
          alt="Sylvain Noury, coach Movement Practice Bordeaux"
          style={{ width: 220, height: 280, objectFit: 'cover', borderRadius: 16, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>QUI EST SYLVAIN ?</p>
          <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6, marginBottom: 12 }}>
            Movement Practice Bordeaux existe depuis 2018. Sylvain Noury, coach BPJEPS et ancien
            instructeur de kung-fu, y enseigne une approche du mouvement construite à partir de ses
            propres années de pratique et de recherche — loin d'un programme standardisé.
          </p>
          <p style={{ color: COULEURS.texteAtt, lineHeight: 1.6 }}>
            Débutants, passionnés ou professionnels en quête de force et de mobilité : son enseignement
            s'adresse à tous, y compris en intervention dans des studios de yoga. Son travail a été
            présenté dans plusieurs podcasts et un reportage TF1 en 2024.
          </p>
        </div>
      </section>

      {/* FORMULES TEASER */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>FORMULES &amp; TARIFS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FORMULES_TEASER.map((cle) => {
            const f = FORMULES[cle];
            return (
              <div key={cle} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${COULEURS.bordure}`, padding: '10px 0' }}>
                <span>{f.nom}</span>
                <span style={{ color: COULEURS.texteAtt }}>{f.prixIndicatif} €</span>
              </div>
            );
          })}
        </div>
        <a href="/tarifs" style={{ display: 'inline-block', marginTop: 16, color: '#FF2D78', textDecoration: 'none', fontWeight: 600 }}>
          Voir toutes les formules →
        </a>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <h2 style={{ fontFamily: POLICE_DISPLAY, fontSize: 28, letterSpacing: 0.5, margin: '0 0 16px' }}>FAQ</h2>
        {FAQ.map((item) => (
          <details key={item.q} style={{ borderBottom: `1px solid ${COULEURS.bordure}`, padding: '14px 0' }}>
            <summary style={{ fontWeight: 600 }}>{item.q}</summary>
            <p style={{ color: COULEURS.texteAtt, marginTop: 8, lineHeight: 1.5 }}>{item.r}</p>
          </details>
        ))}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COULEURS.bordure}`, padding: '32px 20px', fontSize: 13, color: COULEURS.texteFaible }}>
        <p style={{ margin: '0 0 6px' }}>Amplitude Mouvement — Darwin écosystème, 87 Quai des Queyries, 33100 Bordeaux</p>
        <p style={{ margin: 0 }}>Lun · Mer · Ven, 9h–21h</p>
      </footer>
    </main>
  );
}
