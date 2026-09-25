export type Sexe = "H" | "F";

export function calculerIMC(poidsKg: number, tailleCm: number) {
  const tailleM = tailleCm / 100;
  return poidsKg / (tailleM * tailleM);
}

export function classifierIMC(imc: number) {
  if (imc < 18.5) return "Maigreur";
  if (imc < 25) return "Corpulence normale";
  if (imc < 30) return "Surpoids";
  if (imc < 35) return "Obésité modérée (classe I)";
  if (imc < 40) return "Obésité sévère (classe II)";
  return "Obésité morbide (classe III)";
}

export function calculerMetabolismeBase(poidsKg: number, tailleCm: number, age: number, sexe: Sexe) {
  const base = 10 * poidsKg + 6.25 * tailleCm - 5 * age;
  return sexe === "H" ? base + 5 : base - 161;
}

export const NIVEAUX_ACTIVITE = [
  { value: 1.2, label: "Sédentaire (peu ou pas d'exercice)" },
  { value: 1.375, label: "Modérément actif (1-3 séances/sem.)" },
  { value: 1.55, label: "Actif (3-5 séances/sem.)" },
  { value: 1.725, label: "Très actif (6-7 séances/sem.)" },
  { value: 1.9, label: "Extrêmement actif (physique + sport intense)" },
] as const;

export const OBJECTIFS_PONDERAUX = [
  { value: "prise_masse", label: "Prise de masse progressive (+10%)", coefficient: 1.1 },
  { value: "maintien", label: "Maintien du poids", coefficient: 1.0 },
  { value: "perte_moderee", label: "Perte de poids modérée (-10%)", coefficient: 0.9 },
  { value: "perte_progressive", label: "Perte de poids progressive (-15%)", coefficient: 0.85 },
] as const;

export type ObjectifPonderal = (typeof OBJECTIFS_PONDERAUX)[number]["value"];

export function coefficientObjectif(objectif: string) {
  return OBJECTIFS_PONDERAUX.find((o) => o.value === objectif)?.coefficient ?? 1.0;
}

export interface BilanNutritionnelResultat {
  imc: number;
  classificationIMC: string;
  metabolismeBase: number;
  depenseTotale: number;
  apportCalorique: number;
  apportProteines: number;
  apportLipides: number;
  apportGlucides: number;
  hydratation: number;
}

export function calculerBilanNutritionnel(params: {
  poidsKg: number;
  tailleCm: number;
  age: number;
  sexe: Sexe;
  nap: number;
  objectifPonderal: string;
  gProteinesParKg?: number;
}): BilanNutritionnelResultat {
  const { poidsKg, tailleCm, age, sexe, nap, objectifPonderal } = params;
  const gProteinesParKg = params.gProteinesParKg ?? 1.2;

  const imc = calculerIMC(poidsKg, tailleCm);
  const metabolismeBase = calculerMetabolismeBase(poidsKg, tailleCm, age, sexe);
  const depenseTotale = metabolismeBase * nap;
  const apportCalorique = depenseTotale * coefficientObjectif(objectifPonderal);

  const apportProteines = gProteinesParKg * poidsKg;
  const kcalProteines = apportProteines * 4;
  const kcalLipides = apportCalorique * 0.35;
  const apportLipides = kcalLipides / 9;
  const apportGlucides = Math.max(0, (apportCalorique - kcalProteines - kcalLipides) / 4);

  const hydratation = (poidsKg * 35) / 1000;

  return {
    imc,
    classificationIMC: classifierIMC(imc),
    metabolismeBase,
    depenseTotale,
    apportCalorique,
    apportProteines,
    apportLipides,
    apportGlucides,
    hydratation,
  };
}

const MET_COEFFICIENTS = {
  marche: 3.3,
  moderee: 4.0,
  vigoureuse: 8.0,
} as const;

export function calculerScoreIPAQ(params: {
  marcheJours: number;
  marcheMinutes: number;
  modJours: number;
  modMinutes: number;
  vigJours: number;
  vigMinutes: number;
}) {
  const score =
    MET_COEFFICIENTS.marche * params.marcheJours * params.marcheMinutes +
    MET_COEFFICIENTS.moderee * params.modJours * params.modMinutes +
    MET_COEFFICIENTS.vigoureuse * params.vigJours * params.vigMinutes;

  let classification: string;
  if (score < 600) classification = "Faible / Sédentaire";
  else if (score < 3000) classification = "Modéré";
  else classification = "Élevé";

  return { scoreTotal: Math.round(score), classification };
}

export const TESTS_PASS = [
  {
    key: "tm6Distance",
    label: "Test de Marche 6 min (TM6) — Distance",
    unite: "m",
    dimension: "Endurance aérobie",
  },
  {
    key: "tm6Borg",
    label: "Échelle de Borg (perception de l'effort, 6-20)",
    unite: "/20",
    dimension: "Endurance (fatigue)",
  },
  { key: "tm6FCMax", label: "Fréquence cardiaque max (TM6)", unite: "bpm", dimension: "Endurance (FC)" },
  { key: "tm6SpO2", label: "SpO2 minimale (TM6)", unite: "%", dimension: "Endurance (saturation)" },
  {
    key: "tugTemps",
    label: "Timed Up and Go (TUG)",
    unite: "s",
    dimension: "Mobilité fonctionnelle",
    alerteSeuil: 12,
    alerteMessage: "Seuil > 12s = risque de chute accru",
  },
  { key: "equilibreYO", label: "Test unipodal — yeux ouverts", unite: "s", dimension: "Équilibre postural" },
  { key: "equilibreYF", label: "Test unipodal — yeux fermés", unite: "s", dimension: "Équilibre postural" },
  { key: "leversChaise", label: "Levers de chaise (30s)", unite: "rép.", dimension: "Force membres inférieurs" },
  { key: "handgrip", label: "Handgrip (dynamométrie)", unite: "kg", dimension: "Force de préhension" },
  { key: "pompesMur", label: "Pompes contre le mur (30s)", unite: "rép.", dimension: "Force membres supérieurs" },
  { key: "flexionTronc", label: "Flexion du tronc", unite: "cm", dimension: "Souplesse globale" },
] as const;

export type TestPassKey = (typeof TESTS_PASS)[number]["key"];

/** true si une amélioration correspond à une baisse de la valeur (ex: temps, distance doigts-sol) */
export function testBaisseEstAmelioration(key: TestPassKey) {
  return key === "tugTemps" || key === "flexionTronc" || key === "tm6Borg";
}

export function progressionTest(key: TestPassKey, t0: number | null | undefined, t2: number | null | undefined) {
  if (t0 === null || t0 === undefined || t2 === null || t2 === undefined) return null;
  const delta = t2 - t0;
  const ameliore = testBaisseEstAmelioration(key) ? delta < 0 : delta > 0;
  return { delta, ameliore };
}
