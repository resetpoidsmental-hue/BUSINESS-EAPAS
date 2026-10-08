import Anthropic from "@anthropic-ai/sdk";
import { isFicheSeance, type FicheSeance } from "./fiche-seance";

export function assistantIADisponible() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquant dans l'environnement.");
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé (EAPAS) / coach
nutrition indépendant. Tu l'aides à préparer des fiches de séance détaillées pour ses patients.

Règles impératives, toujours respectées :
- Tu proposes, le coach décide. Ce que tu écris n'est qu'un brouillon : rien n'est enregistré
  dans le dossier du patient sans relecture et validation explicite du coach.
- Tu ne poses aucun diagnostic médical. Si le profil mentionne une douleur, une pathologie ou
  un antécédent préoccupant, adapte la séance avec prudence et rappelle, dans les consignes de
  sécurité de l'exercice concerné, qu'un avis médical est recommandé en cas de doute.
- Tu n'inventes aucun chiffre nutritionnel (calories, macronutriments). Ce n'est pas ton rôle ici.
- Adapte systématiquement les exercices aux limitations, douleurs, niveau et matériel disponible
  décrits dans le profil du patient fourni.
- Pour chaque exercice, donne : un nom clair, le détail séries/répétitions ou durée si pertinent,
  un RPE cible (échelle d'effort perçu sur 10), le matériel nécessaire ("Aucun" si rien), un temps
  de récupération entre séries si la structure de l'exercice en comporte (null sinon), comment le
  réaliser, des consignes de sécurité concrètes, une variante adaptée au profil du patient, une
  consigne de respiration, et un point de vigilance à observer pendant l'exécution.
- Réponds UNIQUEMENT avec du JSON brut valide, sans texte autour, sans balises de code, en suivant
  exactement le schéma donné dans la demande.`;

const FICHE_SEANCE_SCHEMA = `{
  "titre": string (ex: "Séance 5 — phase 1 (fondations)"),
  "dureeTotale": string (ex: "40 min"),
  "objectifs": string[] (2 à 4 objectifs concrets pour cette séance précise),
  "materielNecessaire": string[] (liste courte et agrégée, ex: ["Chaise stable", "Tapis de sol"] ; [] si aucun matériel),
  "phases": [
    {
      "nom": string (ex: "Échauffement", "Corps de séance", "Retour au calme"),
      "duree": string (ex: "8 min"),
      "exercices": [
        {
          "nom": string,
          "detailSeries": string | null (ex: "3 séries × 10 répétitions"),
          "rpe": string (ex: "5-6/10"),
          "materiel": string (ex: "Chaise stable sans roulettes", ou "Aucun"),
          "recuperation": string | null (ex: "45 sec entre les séries" ; null si continu / non applicable),
          "commentFaire": string,
          "securite": string,
          "variante": string | null,
          "respiration": string,
          "vigilance": string
        }
      ]
    }
  ]
}`;

export interface GenererFicheSeanceParams {
  /** Contexte patient déjà anonymisé (pas de nom, pas de coordonnées) assemblé par l'appelant. */
  patientContext: string;
  /** Instruction libre du coach pour cette séance. */
  consigne: string;
}

function messageErreurAPI(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) {
    return "La clé API Anthropic est invalide ou a expiré. Vérifie ANTHROPIC_API_KEY dans le fichier .env.";
  }
  if (e instanceof Anthropic.RateLimitError) {
    return "Trop de demandes envoyées à l'assistant IA d'un coup. Réessaie dans quelques instants.";
  }
  if (e instanceof Anthropic.PermissionDeniedError) {
    return "La clé API Anthropic n'a pas les droits nécessaires pour cette demande.";
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return "Impossible de joindre le service de l'assistant IA (connexion réseau).";
  }
  if (e instanceof Anthropic.APIError) {
    return "Le service de l'assistant IA a renvoyé une erreur. Réessaie dans quelques instants.";
  }
  return "Erreur inattendue lors de l'appel à l'assistant IA.";
}

export async function genererFicheSeance({
  patientContext,
  consigne,
}: GenererFicheSeanceParams): Promise<FicheSeance> {
  const client = getClient();

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Profil du patient (anonymisé) :\n${patientContext}\n\nDemande du coach : ${consigne}\n\nSchéma JSON attendu :\n${FICHE_SEANCE_SCHEMA}\n\nRéponds uniquement avec le JSON, sans aucun texte autour.`,
        },
      ],
    });
  } catch (e) {
    throw new Error(messageErreurAPI(e));
  }

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Réponse inattendue de l'assistant IA.");
  }

  const cleaned = block.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("L'assistant IA n'a pas renvoyé un JSON valide. Réessaie, ou reformule ta demande.");
  }

  if (!isFicheSeance(parsed)) {
    throw new Error("La réponse de l'assistant IA ne correspond pas au format attendu.");
  }

  return parsed;
}
