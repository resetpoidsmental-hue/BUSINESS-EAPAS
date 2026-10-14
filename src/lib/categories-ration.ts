/** Référentiel partagé (coach + patient) pour le tableau de ration : catégories d'aliments avec
 * leurs valeurs moyennes pour 100 g (table de composition simplifiée), et les 4 moments de la
 * journée utilisés pour la répartition et le menu type. Les chiffres restent toujours calculés à
 * partir de ces valeurs de référence — jamais estimés ou inventés par l'IA. */

export interface CategorieRation {
  key: string;
  label: string;
  /** Protéines, lipides, glucides en grammes pour 100 g de référence. */
  p: number;
  l: number;
  g: number;
  /** Alcool pur en grammes pour 100 g de référence — ne contribue pas aux colonnes P/L/G,
   * seulement à l'énergie (7 kcal/g, facteur d'Atwater standard). */
  a?: number;
}

export const CATEGORIES_RATION: CategorieRation[] = [
  { key: "lait", label: "Lait ½ écrémé", p: 3.2, l: 1.6, g: 5 },
  { key: "yaourt", label: "Yaourt nature", p: 4, l: 2.3, g: 4.8 },
  { key: "fromage", label: "Fromage (moyen)", p: 24, l: 28, g: 0 },
  { key: "vpo", label: "Viande / Poisson / Œuf", p: 18, l: 10, g: 0 },
  { key: "pain", label: "Pain", p: 8, l: 1, g: 55 },
  { key: "legsec", label: "Légumineuses crues", p: 23, l: 1, g: 50 },
  { key: "feculent", label: "Féculents cuits", p: 2, l: 0, g: 20 },
  { key: "legume", label: "Légumes frais", p: 1.5, l: 0, g: 5 },
  { key: "fruit", label: "Fruits frais", p: 0, l: 0, g: 12 },
  { key: "beurre", label: "Beurre", p: 0, l: 82, g: 0 },
  { key: "oleagineux", label: "Fruits oléagineux", p: 18, l: 60, g: 10 },
  { key: "huile", label: "Huile", p: 0, l: 100, g: 0 },
  { key: "sucre", label: "Sucre", p: 0, l: 0, g: 100 },
  { key: "alcool", label: "Alcool", p: 0, l: 0, g: 0, a: 100 },
];

export const MEAL_KEYS = ["pd", "dej", "col", "din"] as const;
export type MealKey = (typeof MEAL_KEYS)[number];

export const MEAL_LABELS: Record<MealKey, string> = {
  pd: "Petit déjeuner",
  dej: "Déjeuner",
  col: "Collation",
  din: "Dîner",
};

export type RationQuantites = Record<string, number>;
export type RepartitionRepas = Record<MealKey, number>;
export type Repartition = Record<string, RepartitionRepas>;
export type MenuType = Record<MealKey, string>;

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export interface LigneRationCalculee {
  key: string;
  label: string;
  qty: number;
  p: number;
  l: number;
  g: number;
  aet: number;
}

export function calculerLigneRation(cat: CategorieRation, qty: number): LigneRationCalculee {
  const q = Number(qty) || 0;
  const p = round1((cat.p * q) / 100);
  const l = round1((cat.l * q) / 100);
  const g = round1((cat.g * q) / 100);
  const a = ((cat.a ?? 0) * q) / 100;
  const aet = Math.round(4 * p + 9 * l + 4 * g + 7 * a);
  return { key: cat.key, label: cat.label, qty: q, p, l, g, aet };
}

/** 1 kcal = 4,184 kJ (facteur standard). */
export function kcalVersMJ(kcal: number): number {
  return (kcal * 4.184) / 1000;
}

export interface TotauxRation {
  totalQty: number;
  totalP: number;
  totalL: number;
  totalG: number;
  totalAet: number;
  pctP: number;
  pctL: number;
  pctG: number;
}

export function calculerRation(quantites: RationQuantites): { lignes: LigneRationCalculee[]; totaux: TotauxRation } {
  const lignes = CATEGORIES_RATION.map((cat) => calculerLigneRation(cat, quantites[cat.key] ?? 0));

  const totalQty = lignes.reduce((s, r) => s + r.qty, 0);
  const totalP = round1(lignes.reduce((s, r) => s + r.p, 0));
  const totalL = round1(lignes.reduce((s, r) => s + r.l, 0));
  const totalG = round1(lignes.reduce((s, r) => s + r.g, 0));
  const totalAet = Math.round(lignes.reduce((s, r) => s + r.aet, 0));

  const pctP = totalAet ? Math.round((4 * totalP * 100) / totalAet) : 0;
  const pctL = totalAet ? Math.round((9 * totalL * 100) / totalAet) : 0;
  const pctG = totalAet ? Math.round((4 * totalG * 100) / totalAet) : 0;

  return { lignes, totaux: { totalQty, totalP, totalL, totalG, totalAet, pctP, pctL, pctG } };
}

/** Énergie (kcal) d'un repas donné, à partir des quantités réparties pour ce repas. */
export function calculerKcalRepas(repartition: Repartition, meal: MealKey): number {
  let kcal = 0;
  for (const cat of CATEGORIES_RATION) {
    const q = repartition[cat.key]?.[meal] ?? 0;
    const p = (cat.p * q) / 100;
    const l = (cat.l * q) / 100;
    const g = (cat.g * q) / 100;
    const a = ((cat.a ?? 0) * q) / 100;
    kcal += 4 * p + 9 * l + 4 * g + 7 * a;
  }
  return Math.round(kcal);
}

export function rationVide(): RationQuantites {
  const q: RationQuantites = {};
  for (const cat of CATEGORIES_RATION) q[cat.key] = 0;
  return q;
}

export function repartitionVide(): Repartition {
  const r: Repartition = {};
  for (const cat of CATEGORIES_RATION) r[cat.key] = { pd: 0, dej: 0, col: 0, din: 0 };
  return r;
}

export function menuTypeVide(): MenuType {
  return { pd: "", dej: "", col: "", din: "" };
}

const LABEL_PAR_CLE = new Map(CATEGORIES_RATION.map((c) => [c.key, c.label]));

export interface EcartCategorie {
  key: string;
  label: string;
  loggedDays: number;
  targetDays: number;
  pct: number;
}

/** Calcul déterministe (jamais l'IA) : pour chaque catégorie prévue dans la ration, combien de
 * jours distincts (sur les entrées de journal fournies) le patient l'a reportée dans son journal,
 * comparé aux 7 jours où elle est censée revenir puisqu'elle fait partie de la ration quotidienne. */
export function calculerEcartsRation(
  repartition: Repartition,
  entries: { date: Date; repasStructure: string | null }[]
): EcartCategorie[] {
  const joursParCategorie = new Map<string, Set<string>>();

  for (const entry of entries) {
    if (!entry.repasStructure) continue;
    let parsed: Partial<Record<MealKey, Record<string, number>>>;
    try {
      parsed = JSON.parse(entry.repasStructure);
    } catch {
      continue;
    }
    const dayKey = entry.date.toISOString().slice(0, 10);
    for (const meal of MEAL_KEYS) {
      const picks = parsed[meal];
      if (!picks) continue;
      for (const catKey of Object.keys(picks)) {
        if (!joursParCategorie.has(catKey)) joursParCategorie.set(catKey, new Set());
        joursParCategorie.get(catKey)!.add(dayKey);
      }
    }
  }

  const result: EcartCategorie[] = [];
  for (const cat of CATEGORIES_RATION) {
    const estPrevue = MEAL_KEYS.some((m) => (repartition[cat.key]?.[m] ?? 0) > 0);
    if (!estPrevue) continue;
    const loggedDays = joursParCategorie.get(cat.key)?.size ?? 0;
    result.push({ key: cat.key, label: cat.label, loggedDays, targetDays: 7, pct: Math.round((loggedDays / 7) * 100) });
  }

  return result.sort((a, b) => a.pct - b.pct);
}

/** Résumé lisible d'un JournalEntree.repasStructure (JSON stocké en base) : "Petit déjeuner (Lait
 * ½ écrémé, Pain) · Déjeuner (...)". Ignore silencieusement les entrées malformées. */
export function formatRepasStructureResume(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<MealKey, Record<string, number>>>;
    const parts: string[] = [];
    for (const meal of MEAL_KEYS) {
      const picks = parsed[meal];
      if (!picks || Object.keys(picks).length === 0) continue;
      const labels = Object.keys(picks).map((key) => LABEL_PAR_CLE.get(key) ?? key);
      parts.push(`${MEAL_LABELS[meal]} (${labels.join(", ")})`);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  } catch {
    return null;
  }
}
