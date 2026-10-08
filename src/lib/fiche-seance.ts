export interface ExerciceFiche {
  nom: string;
  detailSeries: string | null;
  rpe: string;
  materiel: string;
  recuperation: string | null;
  commentFaire: string;
  securite: string;
  variante: string | null;
  respiration: string;
  vigilance: string;
}

export interface PhaseFiche {
  nom: string;
  duree: string;
  exercices: ExerciceFiche[];
}

export interface FicheSeance {
  titre: string;
  dureeTotale: string;
  objectifs: string[];
  materielNecessaire: string[];
  phases: PhaseFiche[];
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function isExerciceFiche(v: unknown): v is ExerciceFiche {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return (
    isString(e.nom) &&
    isNullableString(e.detailSeries) &&
    isString(e.rpe) &&
    isString(e.materiel) &&
    isNullableString(e.recuperation) &&
    isString(e.commentFaire) &&
    isString(e.securite) &&
    isNullableString(e.variante) &&
    isString(e.respiration) &&
    isString(e.vigilance)
  );
}

function isPhaseFiche(v: unknown): v is PhaseFiche {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return isString(p.nom) && isString(p.duree) && Array.isArray(p.exercices) && p.exercices.every(isExerciceFiche);
}

export function isFicheSeance(v: unknown): v is FicheSeance {
  if (!v || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  return (
    isString(f.titre) &&
    isString(f.dureeTotale) &&
    Array.isArray(f.objectifs) &&
    f.objectifs.every(isString) &&
    Array.isArray(f.materielNecessaire) &&
    f.materielNecessaire.every(isString) &&
    Array.isArray(f.phases) &&
    f.phases.length > 0 &&
    f.phases.every(isPhaseFiche)
  );
}

/** Parse le champ Seance.contenu : renvoie la fiche structurée si c'est du JSON valide
 * au bon format, sinon null (le contenu est alors affiché comme texte libre). */
export function parseFicheSeance(contenu: string | null | undefined): FicheSeance | null {
  if (!contenu) return null;
  try {
    const parsed = JSON.parse(contenu);
    return isFicheSeance(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Rendu texte brut d'une fiche structurée — utilisé pour l'édition libre et comme
 * contenu de secours si jamais le JSON ne peut pas être affiché en rich text. */
export function ficheSeanceToText(fiche: FicheSeance): string {
  const lignes: string[] = [];
  lignes.push(fiche.titre);
  lignes.push(`Durée totale : ${fiche.dureeTotale}`);
  lignes.push("");

  if (fiche.objectifs.length > 0) {
    lignes.push("Objectifs de la séance :");
    for (const o of fiche.objectifs) lignes.push(`- ${o}`);
    lignes.push("");
  }

  if (fiche.materielNecessaire.length > 0) {
    lignes.push(`Matériel nécessaire : ${fiche.materielNecessaire.join(", ")}`);
    lignes.push("");
  }

  for (const phase of fiche.phases) {
    lignes.push(`${phase.nom.toUpperCase()} (${phase.duree})`);
    for (const ex of phase.exercices) {
      lignes.push(`• ${ex.nom}${ex.detailSeries ? ` · ${ex.detailSeries}` : ""}`);
      lignes.push(`  RPE ${ex.rpe} · Matériel : ${ex.materiel}${ex.recuperation ? ` · Récup : ${ex.recuperation}` : ""}`);
      lignes.push(`  Comment faire : ${ex.commentFaire}`);
      lignes.push(`  Sécurité : ${ex.securite}`);
      if (ex.variante) lignes.push(`  Variante : ${ex.variante}`);
      lignes.push(`  Respiration : ${ex.respiration}`);
      lignes.push(`  Point de vigilance : ${ex.vigilance}`);
    }
    lignes.push("");
  }

  return lignes.join("\n").trim();
}
