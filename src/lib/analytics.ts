/** Analytique multi-patients (Priorité ⑤c) : agrégats et classement par patient, entièrement
 * calculés à partir des données déjà saisies — aucune IA, aucune valeur estimée. Chaque indicateur
 * est filtré par la date de l'événement qui le produit (séance, entrée de journal, bilan, paiement,
 * échéance d'objectif…) tombant dans la période sélectionnée ; pour « Depuis le début », la période
 * couvre tout l'historique. */

import { CATEGORIES_RATION, MEAL_KEYS, type MealKey, type Repartition } from "./categories-ration";

export type PeriodeKey = "semaine" | "mois" | "tout";

export const PERIODE_LABELS: Record<PeriodeKey, string> = {
  semaine: "Semaine",
  mois: "Mois",
  tout: "Depuis le début",
};

export function periodeDebut(periode: PeriodeKey, now: Date): Date {
  if (periode === "semaine") return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  if (periode === "mois") return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  return new Date(0);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function moyenne(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function dansPeriode(date: Date, start: Date, now: Date) {
  return date >= start && date <= now;
}

function joursDistincts(dates: Date[]): number {
  return new Set(dates.map((d) => d.toISOString().slice(0, 10))).size;
}

function respectRationPct(
  repartition: Repartition,
  entries: { date: Date; repasStructure: string | null }[],
  start: Date,
  now: Date
): number | null {
  const categoriesAllouees = CATEGORIES_RATION.filter((cat) =>
    MEAL_KEYS.some((m) => (repartition[cat.key]?.[m] ?? 0) > 0)
  );
  if (categoriesAllouees.length === 0) return null;

  const denom = Math.max(1, Math.round((now.getTime() - start.getTime()) / (24 * 3600 * 1000)));
  const joursParCategorie = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (entry.date < start || entry.date > now || !entry.repasStructure) continue;
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

  const pcts = categoriesAllouees.map((cat) => {
    const logged = joursParCategorie.get(cat.key)?.size ?? 0;
    return Math.min(100, Math.round((logged / denom) * 100));
  });
  return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length);
}

export interface PatientAnalyticsInput {
  id: string;
  nom: string;
  prenom: string;
  seances: { date: Date; statut: string; borgRessenti: number | null }[];
  journalEntrees: { date: Date; repasStructure: string | null }[];
  bilansNutrition: { date: Date; poids: number }[];
  bilansCliniques: { date: Date; tugTemps: number | null }[];
  objectifs: { dateCible: Date | null; createdAt: Date; atteint: boolean }[];
  repartitionRation: Repartition | null;
  factures: { statut: string; total: number; createdAt: Date; datePaiement: Date | null }[];
  devis: { statut: string; total: number; date: Date }[];
}

export interface AnalytiquePatientRow {
  id: string;
  nom: string;
  prenom: string;
  assiduitePct: number | null;
  ressentiMoyen: number | null;
  journalJours: number;
  deltaPoids: number | null;
  respectRationPct: number | null;
  objectifsAtteints: number;
  objectifsTotal: number;
  deltaTug: number | null;
  impayesMontant: number;
}

export interface AnalytiqueResultat {
  patients: AnalytiquePatientRow[];
  cohortes: {
    assiduite: { tauxPct: number | null; ressentiMoyen: number | null; journalRempliCount: number; journalRempliTotal: number };
    nutrition: { suivisCount: number; suivisTotal: number; deltaPoidsMoyen: number | null; respectRationMoyenPct: number | null };
    objectifs: { atteints: number; total: number; tauxPct: number | null; deltaTugMoyen: number | null };
    commercial: { caEncaisse: number; impayesMontant: number; impayesCount: number; devisEnCoursMontant: number; devisEnCoursCount: number };
  };
}

export function calculerAnalytique(periode: PeriodeKey, now: Date, patients: PatientAnalyticsInput[]): AnalytiqueResultat {
  const start = periodeDebut(periode, now);

  let ressentisPool: number[] = [];
  let faitesTotal = 0;
  let annuleesTotal = 0;
  let journalRempliCount = 0;
  let suivisCount = 0;
  const deltaPoidsPool: number[] = [];
  const respectRationPool: number[] = [];
  let objectifsAtteintsTotal = 0;
  let objectifsTotal = 0;
  const deltaTugPool: number[] = [];
  let caEncaisse = 0;
  let impayesMontantTotal = 0;
  let impayesCountTotal = 0;
  let devisEnCoursMontant = 0;
  let devisEnCoursCount = 0;

  const rows: AnalytiquePatientRow[] = patients.map((p) => {
    const seancesPeriode = p.seances.filter((s) => dansPeriode(s.date, start, now));
    const faites = seancesPeriode.filter((s) => s.statut === "Faite").length;
    const annulees = seancesPeriode.filter((s) => s.statut === "Annulée").length;
    const assiduitePct = faites + annulees > 0 ? Math.round((faites / (faites + annulees)) * 100) : null;
    faitesTotal += faites;
    annuleesTotal += annulees;

    const ressentis = seancesPeriode.filter((s) => s.statut === "Faite" && s.borgRessenti !== null).map((s) => s.borgRessenti as number);
    ressentisPool = ressentisPool.concat(ressentis);
    const ressentiMoyen = moyenne(ressentis);
    const ressentiMoyenArrondi = ressentiMoyen !== null ? round1(ressentiMoyen) : null;

    const journalPeriode = p.journalEntrees.filter((j) => dansPeriode(j.date, start, now));
    const journalJours = joursDistincts(journalPeriode.map((j) => j.date));
    if (journalJours > 0) journalRempliCount += 1;

    const bilansNutritionPeriode = [...p.bilansNutrition]
      .filter((b) => dansPeriode(b.date, start, now))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (p.bilansNutrition.length > 0) suivisCount += bilansNutritionPeriode.length > 0 ? 1 : 0;
    const deltaPoids =
      bilansNutritionPeriode.length >= 2
        ? round1(bilansNutritionPeriode[bilansNutritionPeriode.length - 1].poids - bilansNutritionPeriode[0].poids)
        : null;
    if (deltaPoids !== null) deltaPoidsPool.push(deltaPoids);

    const respectPct = p.repartitionRation ? respectRationPct(p.repartitionRation, p.journalEntrees, start, now) : null;
    if (respectPct !== null) respectRationPool.push(respectPct);

    // Les objectifs SMART sont des engagements à échéance future, pas des événements passés : on
    // montre toujours leur état actuel (indépendant de la période), jamais filtré par date.
    const objectifsAtteints = p.objectifs.filter((o) => o.atteint).length;
    objectifsAtteintsTotal += objectifsAtteints;
    objectifsTotal += p.objectifs.length;

    const bilansCliniquesPeriode = [...p.bilansCliniques]
      .filter((b) => b.tugTemps !== null && dansPeriode(b.date, start, now))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const deltaTug =
      bilansCliniquesPeriode.length >= 2
        ? round1((bilansCliniquesPeriode[bilansCliniquesPeriode.length - 1].tugTemps as number) - (bilansCliniquesPeriode[0].tugTemps as number))
        : null;
    if (deltaTug !== null) deltaTugPool.push(deltaTug);

    const facturesPayeesPeriode = p.factures.filter(
      (f) => f.statut === "Payée" && f.datePaiement && dansPeriode(f.datePaiement, start, now)
    );
    caEncaisse += facturesPayeesPeriode.reduce((s, f) => s + f.total, 0);

    const facturesImpayeesPeriode = p.factures.filter((f) => f.statut === "Impayée" && dansPeriode(f.createdAt, start, now));
    const impayesMontant = facturesImpayeesPeriode.reduce((s, f) => s + f.total, 0);
    impayesMontantTotal += impayesMontant;
    impayesCountTotal += facturesImpayeesPeriode.length;

    const devisEnCoursPeriode = p.devis.filter((d) => d.statut === "Envoyé" && dansPeriode(d.date, start, now));
    devisEnCoursMontant += devisEnCoursPeriode.reduce((s, d) => s + d.total, 0);
    devisEnCoursCount += devisEnCoursPeriode.length;

    return {
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      assiduitePct,
      ressentiMoyen: ressentiMoyenArrondi,
      journalJours,
      deltaPoids,
      respectRationPct: respectPct,
      objectifsAtteints,
      objectifsTotal: p.objectifs.length,
      deltaTug,
      impayesMontant,
    };
  });

  const assiduiteCohortePct = faitesTotal + annuleesTotal > 0 ? Math.round((faitesTotal / (faitesTotal + annuleesTotal)) * 100) : null;
  const ressentiCohorteMoyen = moyenne(ressentisPool);

  return {
    patients: rows,
    cohortes: {
      assiduite: {
        tauxPct: assiduiteCohortePct,
        ressentiMoyen: ressentiCohorteMoyen !== null ? round1(ressentiCohorteMoyen) : null,
        journalRempliCount,
        journalRempliTotal: patients.length,
      },
      nutrition: {
        suivisCount,
        suivisTotal: patients.length,
        deltaPoidsMoyen: (() => {
          const m = moyenne(deltaPoidsPool);
          return m !== null ? round1(m) : null;
        })(),
        respectRationMoyenPct: (() => {
          const m = moyenne(respectRationPool);
          return m !== null ? Math.round(m) : null;
        })(),
      },
      objectifs: {
        atteints: objectifsAtteintsTotal,
        total: objectifsTotal,
        tauxPct: objectifsTotal > 0 ? Math.round((objectifsAtteintsTotal / objectifsTotal) * 100) : null,
        deltaTugMoyen: (() => {
          const m = moyenne(deltaTugPool);
          return m !== null ? round1(m) : null;
        })(),
      },
      commercial: {
        caEncaisse,
        impayesMontant: impayesMontantTotal,
        impayesCount: impayesCountTotal,
        devisEnCoursMontant,
        devisEnCoursCount,
      },
    },
  };
}
