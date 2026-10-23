import type { Formule } from "./types";

/**
 * Calcul IPAQ simplifié — mêmes coefficients MET que calculerScoreIPAQ dans
 * l'app principale (src/lib/calculs.ts). Dupliqué ici volontairement : la
 * vitrine est buildée et déployée indépendamment de l'app (images Docker
 * séparées), donc pas d'import cross-app possible.
 */
const MET = { marche: 3.3, moderee: 4.0, vigoureuse: 8.0 } as const;

export type ReponsesQuiz = {
  marcheJours: number;
  marcheMinutes: number;
  modJours: number;
  modMinutes: number;
  vigJours: number;
  vigMinutes: number;
  objectif: ObjectifValue;
};

export type ObjectifValue =
  | "perte_poids"
  | "reprise_pathologie"
  | "prevention_chutes"
  | "bien_etre";

export const OBJECTIFS: { value: ObjectifValue; label: string; emoji: string }[] = [
  { value: "perte_poids", label: "Perdre du poids durablement", emoji: "⚖️" },
  { value: "reprise_pathologie", label: "Reprendre le sport après une pathologie", emoji: "🩺" },
  { value: "prevention_chutes", label: "Prévenir les chutes, rester autonome", emoji: "🛡️" },
  { value: "bien_etre", label: "Améliorer mon énergie et mon bien-être", emoji: "✨" },
];

const OBJECTIF_MESSAGES: Record<ObjectifValue, string> = {
  perte_poids:
    "Pour une perte de poids qui dure, l'activité physique adaptée et le cadrage nutritionnel fonctionnent mieux ensemble qu'isolément.",
  reprise_pathologie:
    "Après une pathologie, une reprise progressive et encadrée réduit le risque de rechute et redonne confiance en son corps.",
  prevention_chutes:
    "Travailler l'équilibre et le renforcement musculaire avant 60 ans est le meilleur levier de prévention des chutes.",
  bien_etre:
    "Un accompagnement régulier, même léger, améliore nettement l'énergie et la qualité du sommeil au quotidien.",
};

export type ClassificationActivite = "Faible / Sédentaire" | "Modéré" | "Élevé";

export function calculerScoreIPAQ(r: ReponsesQuiz) {
  const score = Math.round(
    MET.marche * r.marcheJours * r.marcheMinutes +
      MET.moderee * r.modJours * r.modMinutes +
      MET.vigoureuse * r.vigJours * r.vigMinutes
  );
  let classification: ClassificationActivite;
  if (score < 600) classification = "Faible / Sédentaire";
  else if (score < 3000) classification = "Modéré";
  else classification = "Élevé";
  return { score, classification };
}

export function messagePersonnalise(classification: ClassificationActivite, objectif: ObjectifValue) {
  return `Votre niveau d'activité hebdomadaire se situe dans la catégorie ${classification}. ${OBJECTIF_MESSAGES[objectif]}`;
}

/**
 * Choisit une formule parmi celles réellement actives dans NocoDB (triées par
 * prix), plutôt que de coder en dur des noms de formule : reste correct même
 * si le coach renomme ou réorganise ses formules plus tard.
 */
export function recommanderFormule(
  formules: Formule[],
  classification: ClassificationActivite,
  objectif: ObjectifValue
): Formule | null {
  if (formules.length === 0) return null;
  const triees = [...formules].sort((a, b) => a.Prix - b.Prix);

  const besoinAccompagnementMax = objectif === "reprise_pathologie" || objectif === "prevention_chutes";
  if (besoinAccompagnementMax) return triees[triees.length - 1];
  if (classification === "Élevé") return triees[0];
  return triees[Math.floor(triees.length / 2)];
}

export function objectifLabel(objectif: ObjectifValue) {
  return OBJECTIFS.find((o) => o.value === objectif)?.label ?? objectif;
}
