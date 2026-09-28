"use server";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const formule = String(formData.get("formule") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!nom || !email) {
    return { status: "error", message: "Merci de renseigner au moins ton nom et ton email." };
  }

  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("N8N_LEAD_WEBHOOK_URL n'est pas configuré — prospect non transmis.");
    return {
      status: "error",
      message: "Le formulaire n'est pas encore branché. Contacte-nous directement par email en attendant.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nom, email, telephone, formule, message, source: "Site vitrine" }),
    });
    if (!res.ok) throw new Error(`Webhook -> ${res.status}`);
  } catch (err) {
    console.error("Échec de l'envoi du prospect au webhook n8n", err);
    return {
      status: "error",
      message: "Une erreur est survenue. Merci de réessayer dans quelques instants.",
    };
  }

  return {
    status: "success",
    message: "Merci ! Ta demande a bien été envoyée, on te recontacte sous 48h.",
  };
}
