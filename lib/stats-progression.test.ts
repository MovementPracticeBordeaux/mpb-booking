import { describe, it, expect } from 'vitest';
import { calculerStatsProgression } from './stats-progression';

const aujourdhui = new Date();
function ilYA(jours: number): string {
  const d = new Date(aujourdhui);
  d.setDate(d.getDate() - jours);
  return d.toISOString();
}

describe('calculerStatsProgression', () => {
  it("compte les jours actifs sur les 30 derniers jours, sans doublon si plusieurs entrées le même jour", () => {
    const force = [
      { exercice: 'Dips', reps_par_set: '10,10,8', cree_le: ilYA(1) },
      { exercice: 'Traction', reps_par_set: '5,5', cree_le: ilYA(1) }, // même jour que l'entrée précédente
    ];
    const stats = calculerStatsProgression(force, [], []);
    expect(stats.joursActifs30j).toBe(1);
  });

  it('ignore les entrées de plus de 30 jours pour la régularité', () => {
    const force = [{ exercice: 'Dips', reps_par_set: '10', cree_le: ilYA(45) }];
    const stats = calculerStatsProgression(force, [], []);
    expect(stats.joursActifs30j).toBe(0);
  });

  it('calcule le volume total (reps) par exercice pour identifier les points forts', () => {
    const force = [
      { exercice: 'Dips', reps_par_set: '10,10,10', cree_le: ilYA(1) },
      { exercice: 'Dips', reps_par_set: '10,10', cree_le: ilYA(3) },
      { exercice: 'Pompes', reps_par_set: '5', cree_le: ilYA(2) },
    ];
    const stats = calculerStatsProgression(force, [], []);
    const dips = stats.forcePointsForts.find((p) => p.nom === 'Dips');
    expect(dips?.total).toBe(50);
  });

  it("ne remonte pas 'points faibles' en dessous de 6 exercices distincts (pas assez de variété)", () => {
    const force = [
      { exercice: 'Dips', reps_par_set: '10', cree_le: ilYA(1) },
      { exercice: 'Pompes', reps_par_set: '5', cree_le: ilYA(1) },
    ];
    const stats = calculerStatsProgression(force, [], []);
    expect(stats.forcePointsFaibles).toEqual([]);
    expect(stats.forcePointsForts.length).toBe(2);
  });

  it('calcule le temps de tenue total (secondes) et la meilleure tentative par figure', () => {
    const figures = [
      { figure: 'Handstand', tentatives: '10,15,12', cree_le: ilYA(1) },
      { figure: 'Handstand', tentatives: '20', cree_le: ilYA(2) },
    ];
    const stats = calculerStatsProgression([], figures, []);
    const hs = stats.figuresMeilleures.find((p) => p.nom === 'Handstand');
    expect(hs?.meilleurTempsSec).toBe(20); // la meilleure tentative, pas la somme
  });

  it('regroupe le volume Force par semaine (lundi comme clé)', () => {
    // Deux entrées la même semaine doivent se cumuler dans le même point
    const lundi = new Date(aujourdhui);
    lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7)); // lundi de cette semaine
    const mardi = new Date(lundi);
    mardi.setDate(mardi.getDate() + 1);

    const force = [
      { exercice: 'Dips', reps_par_set: '10', cree_le: lundi.toISOString() },
      { exercice: 'Dips', reps_par_set: '15', cree_le: mardi.toISOString() },
    ];
    const stats = calculerStatsProgression(force, [], []);
    expect(stats.volumeForceParSemaine.length).toBe(1);
    expect(stats.volumeForceParSemaine[0].total).toBe(25);
  });

  it('ignore les valeurs non numériques dans reps_par_set sans planter', () => {
    const force = [{ exercice: 'Dips', reps_par_set: '10,,8', cree_le: ilYA(1) }];
    const stats = calculerStatsProgression(force, [], []);
    expect(stats.forcePointsForts[0].total).toBe(18);
  });

  it('renvoie des statistiques vides sans erreur quand il n\'y a aucune donnée', () => {
    const stats = calculerStatsProgression([], [], []);
    expect(stats.joursActifs30j).toBe(0);
    expect(stats.volumeForceParSemaine).toEqual([]);
    expect(stats.forcePointsForts).toEqual([]);
  });
});
