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

async function appelerClaudeJSON({
  system,
  userContent,
  maxTokens,
}: {
  system: string;
  userContent: string;
  maxTokens: number;
}): Promise<unknown> {
  const client = getClient();

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    });
  } catch (e) {
    throw new Error(messageErreurAPI(e));
  }

  const block = message.content.find((b) => b.type === "text");
  if (!block) {
    throw new Error("Réponse inattendue de l'assistant IA.");
  }

  const cleaned = block.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("L'assistant IA n'a pas renvoyé un JSON valide. Réessaie, ou reformule ta demande.");
  }
}

/** Comme appelerClaudeJSON, mais pour une réponse en texte libre (pas de schéma JSON à respecter). */
async function appelerClaudeTexte({
  system,
  userContent,
  maxTokens,
}: {
  system: string;
  userContent: string;
  maxTokens: number;
}): Promise<string> {
  const client = getClient();

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    });
  } catch (e) {
    throw new Error(messageErreurAPI(e));
  }

  const block = message.content.find((b) => b.type === "text");
  if (!block || !block.text.trim()) {
    throw new Error("Réponse inattendue de l'assistant IA.");
  }

  return block.text.trim();
}

export async function genererFicheSeance({
  patientContext,
  consigne,
}: GenererFicheSeanceParams): Promise<FicheSeance> {
  const parsed = await appelerClaudeJSON({
    system: SYSTEM_PROMPT,
    userContent: `Profil du patient (anonymisé) :\n${patientContext}\n\nDemande du coach : ${consigne}\n\nSchéma JSON attendu :\n${FICHE_SEANCE_SCHEMA}\n\nRéponds uniquement avec le JSON, sans aucun texte autour.`,
    maxTokens: 8000,
  });

  if (!isFicheSeance(parsed)) {
    throw new Error("La réponse de l'assistant IA ne correspond pas au format attendu.");
  }

  return parsed;
}

const OBJECTIF_SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé (EAPAS) / coach
nutrition indépendant. Tu l'aides à traduire l'objectif exprimé par un patient, dans ses propres mots, en un
objectif SMART (Spécifique, Mesurable, Atteignable, Réaliste, Temporellement défini).

Règles impératives, toujours respectées :
- Tu proposes, le coach décide. Rien n'est enregistré dans le dossier du patient sans relecture et validation
  explicite du coach.
- Reste fidèle à l'intention du patient : ne change pas la nature de son objectif, rends-le seulement concret,
  mesurable et borné dans le temps.
- Adapte l'ambition et l'échéance au profil fourni (âge, limitations, pathologie, dernier bilan clinique s'il
  existe). Si aucun bilan clinique n'est disponible, reste particulièrement prudent dans l'échéance proposée
  (plutôt plus longue que trop courte) et dans l'intensité implicite de l'objectif.
- Sois concis : "texteSMART" tient en UNE seule phrase courte (15-20 mots maximum), sans énumération ni
  sous-critères entre parenthèses. Garde uniquement l'essentiel : l'action concrète, la mesure/quantité, et
  l'échéance — pas de justification ni de détail du contexte dans le texte lui-même.
- Tu ne poses aucun diagnostic médical et n'inventes aucun chiffre nutritionnel.
- Réponds UNIQUEMENT avec du JSON brut valide, sans texte autour, sans balises de code, en suivant exactement le
  schéma donné dans la demande.`;

const OBJECTIF_SCHEMA = `{
  "texteSMART": string (UNE phrase courte, 15-20 mots max, ex: "Perdre 6 kg d'ici le 29 mars 2027, par une activité physique régulière"),
  "dateCible": string (format AAAA-MM-JJ, échéance réaliste calculée à partir de la date du jour donnée)
}`;

export interface GenererObjectifSMARTParams {
  /** Contexte patient déjà anonymisé (pas de nom, pas de coordonnées) assemblé par l'appelant. */
  patientContext: string;
  /** Objectif du patient, dans ses propres mots. */
  texteOriginal: string;
}

export interface ObjectifSMARTSuggestion {
  texteSMART: string;
  dateCible: string | null;
}

function estDateValide(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());
}

function parseObjectifSuggestion(parsed: unknown): ObjectifSMARTSuggestion {
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("texteSMART" in parsed) ||
    typeof (parsed as Record<string, unknown>).texteSMART !== "string" ||
    !(parsed as Record<string, unknown>).texteSMART
  ) {
    throw new Error("La réponse de l'assistant IA ne correspond pas au format attendu.");
  }
  const dateCibleRaw = (parsed as Record<string, unknown>).dateCible;
  return {
    texteSMART: (parsed as { texteSMART: string }).texteSMART,
    dateCible: estDateValide(dateCibleRaw) ? dateCibleRaw : null,
  };
}

export async function genererObjectifSMART({
  patientContext,
  texteOriginal,
}: GenererObjectifSMARTParams): Promise<ObjectifSMARTSuggestion> {
  const aujourdhui = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

  const parsed = await appelerClaudeJSON({
    system: OBJECTIF_SYSTEM_PROMPT,
    userContent: `Profil du patient (anonymisé) :\n${patientContext}\n\nDate du jour : ${aujourdhui}\n\nObjectif du patient, dans ses mots : « ${texteOriginal} »\n\nSchéma JSON attendu :\n${OBJECTIF_SCHEMA}\n\nRéponds uniquement avec le JSON, sans aucun texte autour.`,
    maxTokens: 2000,
  });

  return parseObjectifSuggestion(parsed);
}

const PLANNING_SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé (EAPAS) / coach
nutrition indépendant. Tu l'aides à planifier les prochaines séances d'un patient, à partir d'un objectif SMART déjà
validé par le coach et du profil du patient (bilan clinique initial obligatoire, déjà vérifié par l'appelant).

Règles impératives, toujours respectées :
- Tu proposes, le coach décide. Rien n'est créé dans le dossier du patient sans relecture et validation explicite
  du coach — tu ne fais que proposer une liste, qu'il pourra modifier ou raccourcir avant de créer quoi que ce soit.
- Ne propose JAMAIS plus de 8 séances, et ne dépasse jamais les 3 prochaines semaines à partir de la date du jour
  donnée. Ce n'est qu'un premier lot : la suite sera redemandée plus tard, au fil du suivi — n'essaie pas de
  planifier tout le programme d'un coup.
- Adapte la fréquence et l'intensité au profil fourni (âge, limitations, pathologie, dernier bilan clinique). En cas
  de risque de chute (TUG > 12s) ou de profil fragile, reste prudent sur la fréquence et la progression.
- Pour chaque séance, donne uniquement : une date et heure réaliste (jours ouvrés ou weekend selon ce qui est
  usuel, à heure fixe raisonnable), un type court (ex: "Renforcement doux", "Cardio léger", "Point d'étape"), et
  une note d'UNE ligne (pas de détail d'exercices — ça, c'est le rôle d'un autre assistant, séance par séance,
  plus tard).
- Termine si pertinent par une séance "Point d'étape" ou "Bilan intermédiaire" en fin de période.
- Tu ne poses aucun diagnostic médical et n'inventes aucun chiffre nutritionnel.
- Réponds UNIQUEMENT avec du JSON brut valide, sans texte autour, sans balises de code, en suivant exactement le
  schéma donné dans la demande.`;

const PLANNING_SCHEMA = `{
  "rationale": string (une phrase expliquant brièvement la logique du planning proposé),
  "seances": [
    {
      "dateHeure": string (format AAAA-MM-JJTHH:MM, ex: "2026-10-14T10:00"),
      "type": string (court, ex: "Renforcement doux"),
      "note": string (une ligne, ex: "Prise de repères, intensité modérée")
    }
  ] (2 à 8 séances maximum, sur 3 semaines maximum à partir de la date du jour)
}`;

export interface GenererPlanningParams {
  /** Contexte patient déjà anonymisé (pas de nom, pas de coordonnées) assemblé par l'appelant. */
  patientContext: string;
  /** Formulation SMART de l'objectif déjà validé par le coach. */
  objectifTexteSMART: string;
}

export interface SeancePlanifieeSuggestion {
  dateHeure: string;
  type: string;
  note: string;
}

export interface PlanningSuggestion {
  rationale: string;
  seances: SeancePlanifieeSuggestion[];
}

function estDateHeureValide(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());
}

function parsePlanningSuggestion(parsed: unknown): PlanningSuggestion {
  if (typeof parsed !== "object" || parsed === null || !("seances" in parsed) || !Array.isArray((parsed as Record<string, unknown>).seances)) {
    throw new Error("La réponse de l'assistant IA ne correspond pas au format attendu.");
  }
  const rationaleRaw = (parsed as Record<string, unknown>).rationale;
  const rationale = typeof rationaleRaw === "string" ? rationaleRaw : "";

  const seances: SeancePlanifieeSuggestion[] = [];
  for (const item of (parsed as Record<string, unknown>).seances as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const dateHeure = (item as Record<string, unknown>).dateHeure;
    const type = (item as Record<string, unknown>).type;
    const note = (item as Record<string, unknown>).note;
    if (!estDateHeureValide(dateHeure)) continue;
    if (typeof type !== "string" || !type) continue;
    seances.push({ dateHeure, type, note: typeof note === "string" ? note : "" });
  }

  if (seances.length === 0) {
    throw new Error("L'assistant IA n'a proposé aucune séance exploitable. Réessaie.");
  }

  return { rationale, seances: seances.slice(0, 8) };
}

export async function genererPlanningSeances({
  patientContext,
  objectifTexteSMART,
}: GenererPlanningParams): Promise<PlanningSuggestion> {
  const maintenant = new Date();
  const aujourdhui = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(maintenant);
  const heureActuelle = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(maintenant);

  const parsed = await appelerClaudeJSON({
    system: PLANNING_SYSTEM_PROMPT,
    userContent: `Profil du patient (anonymisé) :\n${patientContext}\n\nObjectif SMART déjà validé par le coach : ${objectifTexteSMART}\n\nDate et heure actuelles : ${aujourdhui} ${heureActuelle}\n\nSchéma JSON attendu :\n${PLANNING_SCHEMA}\n\nRéponds uniquement avec le JSON, sans aucun texte autour.`,
    maxTokens: 3000,
  });

  return parsePlanningSuggestion(parsed);
}

const MESSAGE_SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé (EAPAS) / coach
nutrition indépendant. Tu rédiges un court message d'attention que le coach pourra envoyer à son patient, qui n'a
pas confirmé une séance planifiée (ni "faite", ni "annulée").

Règles impératives, toujours respectées :
- Le message est un BROUILLON : le coach le relira, pourra le modifier, et décide seul de l'envoyer ou non.
- Ton chaleureux, bref (2 à 4 phrases), jamais culpabilisant. Tu ne devines jamais la raison de l'absence (pas
  d'hypothèse sur une maladie, une rechute, etc.) — reste neutre et ouvert.
- Tu ne poses aucun diagnostic médical, ne donnes aucune consigne médicale, n'inventes aucun chiffre.
- Pas de formule de politesse exagérée ni de ton infantilisant. Signe simplement, sans emoji.
- Réponds UNIQUEMENT avec le texte du message, rien d'autre (pas de guillemets, pas d'explication autour).`;

export interface GenererMessageAttentionParams {
  /** Contexte patient déjà anonymisé assemblé par l'appelant. */
  patientContext: string;
  /** Date (format libre, ex: "6 octobre 2026") et type de la séance non confirmée. */
  dateSeanceManquee: string;
  typeSeanceManquee: string;
}

export async function genererMessageAttention({
  patientContext,
  dateSeanceManquee,
  typeSeanceManquee,
}: GenererMessageAttentionParams): Promise<string> {
  return appelerClaudeTexte({
    system: MESSAGE_SYSTEM_PROMPT,
    userContent: `Profil du patient (anonymisé) :\n${patientContext}\n\nSéance non confirmée : ${typeSeanceManquee} du ${dateSeanceManquee}.\n\nRédige le message.`,
    maxTokens: 1000,
  });
}

const MESSAGE_RELANCE_JOURNAL_SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé (EAPAS) / coach
nutrition indépendant. Tu rédiges un court message d'attention que le coach pourra envoyer à son patient, qui n'a
pas rempli son journal de suivi (repas/activité) depuis plusieurs jours.

Règles impératives, toujours respectées :
- Le message est un BROUILLON : le coach le relira, pourra le modifier, et décide seul de l'envoyer ou non.
- Ton chaleureux, bref (2 à 4 phrases), jamais culpabilisant. Tu ne devines jamais la raison de cette pause (pas
  d'hypothèse sur une maladie, une rechute, un désintérêt, etc.) — reste neutre et ouvert, et ne présente pas le
  rappel comme un reproche.
- Tu ne poses aucun diagnostic médical, ne donnes aucune consigne médicale, n'inventes aucun chiffre.
- Pas de formule de politesse exagérée ni de ton infantilisant. Signe simplement, sans emoji.
- Réponds UNIQUEMENT avec le texte du message, rien d'autre (pas de guillemets, pas d'explication autour).`;

export interface GenererMessageRelanceJournalParams {
  /** Contexte patient déjà anonymisé assemblé par l'appelant. */
  patientContext: string;
  /** Description libre de l'inactivité, ex: "aucune entrée depuis le 9 octobre (5 jours)". */
  inactiviteJournal: string;
}

export async function genererMessageRelanceJournal({
  patientContext,
  inactiviteJournal,
}: GenererMessageRelanceJournalParams): Promise<string> {
  return appelerClaudeTexte({
    system: MESSAGE_RELANCE_JOURNAL_SYSTEM_PROMPT,
    userContent: `Profil du patient (anonymisé) :\n${patientContext}\n\nJournal de suivi : ${inactiviteJournal}.\n\nRédige le message.`,
    maxTokens: 1000,
  });
}

const SUIVI_SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé (EAPAS) / coach
nutrition indépendant. Tu l'aides à repérer des signaux utiles dans le suivi récent d'un patient : séances
manquées, tendance du ressenti d'effort, et journal de bord quotidien (repas/boissons, activité physique,
motivation — rempli par le patient dans ses propres mots).

Règles impératives, toujours respectées :
- Tu donnes une LECTURE, pas une consigne : 3 à 5 phrases maximum, qui aident le coach à décider lui-même quoi
  faire (contacter le patient, ajuster la prochaine séance, ne rien faire).
- Tu ne poses aucun diagnostic médical.
- Tu n'inventes JAMAIS de chiffre nutritionnel (calories, macronutriments, MET) à partir du texte du journal — tu
  peux commenter qualitativement ce que le patient décrit (ex: "repas qui semblent équilibrés", "hydratation peu
  mentionnée"), jamais produire de valeurs chiffrées.
- Tu peux suggérer un ou deux conseils nutritionnels ou motivationnels qualitatifs pour la prochaine séance, jamais
  prescriptifs, toujours présentés comme une piste à discuter avec le patient.
- Tu ne contactes jamais le patient toi-même et ne proposes aucune action automatique.
- Réponds UNIQUEMENT avec le texte de l'analyse, en prose, rien d'autre (pas de titre, pas de liste à puces, pas
  de JSON).`;

export async function analyserSuivi(contexteSuivi: string): Promise<string> {
  return appelerClaudeTexte({
    system: SUIVI_SYSTEM_PROMPT,
    userContent: `Suivi récent du patient (anonymisé) :\n${contexteSuivi}\n\nDonne ta lecture.`,
    maxTokens: 1500,
  });
}

const PROPOSITION_MENU_SYSTEM_PROMPT = `Tu es l'assistant d'un Enseignant en Activité Physique Adaptée et Santé
(EAPAS) / coach nutrition indépendant. Il a déjà construit et validé lui-même une ration alimentaire chiffrée
(quantités par catégorie d'aliment, réparties par repas) pour son patient — cette ration contient déjà tous les
chiffres nécessaires. Ta tâche est de proposer, pour chaque repas, une composition concrète (des plats, pas des
instructions) qui respecte les catégories déjà allouées à ce repas.

Règles impératives, toujours respectées :
- Tu composes des REPAS, jamais des chiffres : aucune quantité, aucun gramme, aucune calorie, aucun pourcentage
  dans ta réponse. Les quantités existent déjà dans la ration du coach, tu ne les répètes pas et n'en inventes
  aucune nouvelle.
- Pour chaque repas, les catégories d'aliments allouées (données ci-dessous) doivent se retrouver dans ta
  proposition, sous forme de plats ou d'aliments concrets — jamais une catégorie supplémentaire non allouée à ce
  repas, jamais une catégorie absente de ce repas.
- Si des écarts sont signalés (catégories peu retrouvées dans le journal du patient), privilégie des idées de
  plats qui aident à les intégrer plus naturellement, sans jamais le signaler explicitement au patient dans le
  texte (reste naturel, pas de discours sur les manques).
- C'est un BROUILLON : le coach le relira, le modifiera librement, et décide seul de l'envoyer ou non au patient.
- Tu ne poses aucun diagnostic médical, ne donnes aucune consigne médicale.
- Réponds UNIQUEMENT avec du JSON brut valide, sans texte autour, sans balises de code, au format :
{
  "pd": string (idées de plats pour le petit déjeuner, quelques lignes),
  "dej": string (idées de plats pour le déjeuner),
  "col": string (idées de plats pour la collation),
  "din": string (idées de plats pour le dîner)
}`;

export interface GenererPropositionMenuParams {
  /** Contexte patient déjà anonymisé assemblé par l'appelant. */
  patientContext: string;
  /** Texte décrivant, par repas, les catégories allouées (labels), sans aucun chiffre. */
  categoriesParRepas: string;
  /** Texte décrivant les écarts observés dans le journal (ou "Aucun écart notable"). */
  ecartsTexte: string;
}

export interface PropositionMenu {
  pd: string;
  dej: string;
  col: string;
  din: string;
}

function parsePropositionMenu(parsed: unknown): PropositionMenu {
  const p = (parsed ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return { pd: str(p.pd), dej: str(p.dej), col: str(p.col), din: str(p.din) };
}

export async function genererPropositionMenu({
  patientContext,
  categoriesParRepas,
  ecartsTexte,
}: GenererPropositionMenuParams): Promise<PropositionMenu> {
  const parsed = await appelerClaudeJSON({
    system: PROPOSITION_MENU_SYSTEM_PROMPT,
    userContent: `Profil du patient (anonymisé) :\n${patientContext}\n\nCatégories déjà allouées par repas (ne pas chiffrer, ne pas en ajouter) :\n${categoriesParRepas}\n\nÉcarts observés dans le journal du patient sur les 7 derniers jours :\n${ecartsTexte}\n\nPropose le menu.`,
    maxTokens: 2000,
  });

  return parsePropositionMenu(parsed);
}
