"use server";

export type QuizLeadState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitQuizLead(input: {
  nom: string;
  email: string;
  classification: string;
  score: number;
  objectifLabel: string;
  formuleNom: string | null;
}): Promise<QuizLeadState> {
  const nom = input.nom.trim();
  const email = input.email.trim();

  if (!nom || !email) {
    return { status: "error", message: "Merci de renseigner ton prénom et ton email." };
  }

  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("N8N_LEAD_WEBHOOK_URL n'est pas configuré — prospect du quiz non transmis.");
    return {
      status: "error",
      message: "Le quiz n'est pas encore branché. Contacte-nous directement par email en attendant.",
    };
  }

  const message = [
    `Résultat du quiz bilan forme :`,
    `Niveau d'activité : ${input.classification}`,
    `Objectif : ${input.objectifLabel}`,
    input.formuleNom ? `Formule recommandée automatiquement : ${input.formuleNom}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nom,
        email,
        telephone: "",
        formule: input.formuleNom ?? "",
        message,
        source: "Quiz bilan forme",
      }),
    });
    if (!res.ok) throw new Error(`Webhook -> ${res.status}`);
  } catch (err) {
    console.error("Échec de l'envoi du prospect (quiz) au webhook n8n", err);
    return {
      status: "error",
      message: "Une erreur est survenue. Merci de réessayer dans quelques instants.",
    };
  }

  return { status: "success" };
}
