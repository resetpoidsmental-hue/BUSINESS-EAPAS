import { describe, it, expect } from "vitest";
import {
  calculerIMC,
  classifierIMC,
  calculerMetabolismeBase,
  calculerBilanNutritionnel,
  calculerScoreIPAQ,
  testBaisseEstAmelioration,
  progressionTest,
} from "./calculs";

describe("calculerIMC", () => {
  it("calcule l'IMC à partir du poids (kg) et de la taille (cm)", () => {
    expect(calculerIMC(70, 175)).toBeCloseTo(22.857, 3);
  });
});

describe("classifierIMC", () => {
  it.each([
    [18.4, "Maigreur"],
    [18.5, "Corpulence normale"],
    [24.9, "Corpulence normale"],
    [25, "Surpoids"],
    [29.9, "Surpoids"],
    [30, "Obésité modérée (classe I)"],
    [35, "Obésité sévère (classe II)"],
    [40, "Obésité morbide (classe III)"],
  ])("classe %f comme %s", (imc, attendu) => {
    expect(classifierIMC(imc)).toBe(attendu);
  });
});

describe("calculerMetabolismeBase (Mifflin-St Jeor)", () => {
  it("ajoute +5 pour un homme", () => {
    expect(calculerMetabolismeBase(70, 175, 30, "H")).toBeCloseTo(1648.75, 2);
  });

  it("soustrait 161 pour une femme, à poids/taille/âge identiques", () => {
    expect(calculerMetabolismeBase(70, 175, 30, "F")).toBeCloseTo(1482.75, 2);
  });
});

describe("calculerBilanNutritionnel", () => {
  it("produit des résultats cohérents entre eux (régression sur les relations, pas des constantes magiques)", () => {
    const params = {
      poidsKg: 70,
      tailleCm: 175,
      age: 30,
      sexe: "H" as const,
      nap: 1.55,
      objectifPonderal: "maintien",
    };
    const r = calculerBilanNutritionnel(params);

    expect(r.imc).toBeCloseTo(calculerIMC(params.poidsKg, params.tailleCm), 6);
    expect(r.classificationIMC).toBe(classifierIMC(r.imc));
    expect(r.depenseTotale).toBeCloseTo(r.metabolismeBase * params.nap, 6);
    // Objectif "maintien" = coefficient 1.0 : apport calorique == dépense totale
    expect(r.apportCalorique).toBeCloseTo(r.depenseTotale, 6);
    expect(r.hydratation).toBeCloseTo((params.poidsKg * 35) / 1000, 6);

    // La somme des calories des 3 macronutriments doit reconstituer l'apport calorique total
    const kcalRecalcule = r.apportProteines * 4 + r.apportLipides * 9 + r.apportGlucides * 4;
    expect(kcalRecalcule).toBeCloseTo(r.apportCalorique, 1);
  });

  it("applique le coefficient de l'objectif pondéral (perte progressive = -15%)", () => {
    const base = calculerBilanNutritionnel({
      poidsKg: 70,
      tailleCm: 175,
      age: 30,
      sexe: "H",
      nap: 1.55,
      objectifPonderal: "maintien",
    });
    const pertePro = calculerBilanNutritionnel({
      poidsKg: 70,
      tailleCm: 175,
      age: 30,
      sexe: "H",
      nap: 1.55,
      objectifPonderal: "perte_progressive",
    });
    expect(pertePro.apportCalorique).toBeCloseTo(base.apportCalorique * 0.85, 2);
  });

  it("ne renvoie jamais un apport en glucides négatif", () => {
    const r = calculerBilanNutritionnel({
      poidsKg: 50,
      tailleCm: 160,
      age: 25,
      sexe: "F",
      nap: 1.2,
      objectifPonderal: "perte_progressive",
      gProteinesParKg: 3, // volontairement excessif pour tester le garde-fou Math.max(0, ...)
    });
    expect(r.apportGlucides).toBeGreaterThanOrEqual(0);
  });
});

describe("calculerScoreIPAQ", () => {
  it("calcule le score MET-minutes et sa classification", () => {
    const r = calculerScoreIPAQ({
      marcheJours: 5,
      marcheMinutes: 30,
      modJours: 2,
      modMinutes: 20,
      vigJours: 1,
      vigMinutes: 15,
    });
    // 3.3*5*30 + 4.0*2*20 + 8.0*1*15 = 495 + 160 + 120 = 775
    expect(r.scoreTotal).toBe(775);
    expect(r.classification).toBe("Modéré");
  });

  it("classe un score nul comme Faible / Sédentaire", () => {
    const r = calculerScoreIPAQ({
      marcheJours: 0,
      marcheMinutes: 0,
      modJours: 0,
      modMinutes: 0,
      vigJours: 0,
      vigMinutes: 0,
    });
    expect(r.scoreTotal).toBe(0);
    expect(r.classification).toBe("Faible / Sédentaire");
  });

  it("classe un score élevé (≥3000) comme Élevé", () => {
    const r = calculerScoreIPAQ({
      marcheJours: 7,
      marcheMinutes: 60,
      modJours: 5,
      modMinutes: 60,
      vigJours: 5,
      vigMinutes: 60,
    });
    expect(r.classification).toBe("Élevé");
  });
});

describe("testBaisseEstAmelioration", () => {
  it("considère qu'une baisse est une amélioration pour TUG, flexion du tronc et Borg", () => {
    expect(testBaisseEstAmelioration("tugTemps")).toBe(true);
    expect(testBaisseEstAmelioration("flexionTronc")).toBe(true);
    expect(testBaisseEstAmelioration("tm6Borg")).toBe(true);
  });

  it("considère qu'une hausse est une amélioration pour les autres tests (ex: distance TM6)", () => {
    expect(testBaisseEstAmelioration("tm6Distance")).toBe(false);
    expect(testBaisseEstAmelioration("leversChaise")).toBe(false);
  });
});

describe("progressionTest", () => {
  it("signale une amélioration quand le TUG (risque de chute) diminue", () => {
    const r = progressionTest("tugTemps", 15, 11);
    expect(r).toEqual({ delta: -4, ameliore: true });
  });

  it("signale une amélioration quand la distance TM6 augmente", () => {
    const r = progressionTest("tm6Distance", 300, 350);
    expect(r).toEqual({ delta: 50, ameliore: true });
  });

  it("renvoie null si une des deux valeurs est absente", () => {
    expect(progressionTest("tugTemps", null, 11)).toBeNull();
    expect(progressionTest("tugTemps", 15, undefined)).toBeNull();
  });
});
