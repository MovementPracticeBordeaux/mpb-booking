'use client';

import { useState } from 'react';
import { COULEURS, POLICE_DISPLAY } from '@/lib/theme';

const TEMOIGNAGES = [
  {
    nom: 'Florence',
    note: 5,
    texte: "Une réelle réappropriation de ma mobilité et une réconciliation avec le sport. Chaque session est différente et hyper épanouissante : générosité, bienveillance, bonne humeur.",
  },
  {
    nom: 'Camille',
    note: 5,
    texte: "Belle discipline, à la fois physique et spirituelle. Sylvain est un excellent pédagogue qui s'adapte à tous les niveaux et à tous les profils, et en plus, il y a une super ambiance !",
  },
  {
    nom: 'Miguel',
    note: 5,
    texte: 'Excellent ! Sylvain maîtrise son sujet et il est très pédagogue. Les cours sont ludiques, conviviaux et efficaces. La progression est en rendez-vous.',
  },
  {
    nom: 'Jems',
    note: 5,
    texte: "L'enseignement de Sylvain me permet d'aborder les arts martiaux sous un angle nouveau, en développant ma pratique martiale. C'est la réappropriation de son corps. 100% convaincu !",
  },
  {
    nom: 'Hugo',
    note: 5,
    texte: "Excellente approche du sport et de l'activité en général. Je recommande Sylvain à quiconque est curieux d'en apprendre plus sur ce dont son propre corps est capable.",
  },
  {
    nom: 'Guillaume',
    note: 5,
    texte: 'Enfin du Mouvement à Bordeaux ! Merci Sylvain pour la qualité des cours et la bonne humeur contagieuse. À quand 5 fois par semaine ? J\'ai hâte !',
  },
];

export default function Temoignages() {
  const [index, setIndex] = useState(0);
  const total = TEMOIGNAGES.length;
  const actuel = TEMOIGNAGES[index];

  const precedent = () => setIndex((i) => (i - 1 + total) % total);
  const suivant = () => setIndex((i) => (i + 1) % total);

  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 64px', textAlign: 'center', position: 'relative' }}>
      <p style={{ fontSize: 12, letterSpacing: 2, color: COULEURS.texteFaible, marginBottom: 10 }}>TÉMOIGNAGES</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <button
          onClick={precedent}
          aria-label="Témoignage précédent"
          style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 22, cursor: 'pointer', padding: 8, flexShrink: 0 }}
        >
          ‹
        </button>

        <div style={{ flex: 1, minHeight: 190 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{actuel.nom}</p>
          <p style={{ color: '#FF8A00', letterSpacing: 2, marginBottom: 12, fontSize: 14 }}>
            {'★'.repeat(actuel.note)}
          </p>
          <p style={{ fontFamily: POLICE_DISPLAY, fontSize: 22, lineHeight: 1.4, letterSpacing: 0.3 }}>
            « {actuel.texte} »
          </p>
        </div>

        <button
          onClick={suivant}
          aria-label="Témoignage suivant"
          style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 22, cursor: 'pointer', padding: 8, flexShrink: 0 }}
        >
          ›
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        {TEMOIGNAGES.map((t, i) => (
          <button
            key={t.nom}
            onClick={() => setIndex(i)}
            aria-label={`Voir le témoignage de ${t.nom}`}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === index ? COULEURS.texte : COULEURS.texteFaible,
            }}
          />
        ))}
      </div>
    </section>
  );
}
