import { Resend } from "resend";

export function emailDisponible() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

let client: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY manquant dans l'environnement.");
  if (!client) client = new Resend(apiKey);
  return client;
}

/**
 * Envoie un reçu de prélèvement par email, avec le PDF de la facture en pièce jointe.
 * N'est appelé qu'après un prélèvement RÉUSSI — jamais de relance automatique en cas d'échec,
 * et jamais d'envoi sans que la facture corresponde à un vrai paiement confirmé par Stripe.
 */
export async function envoyerRecuFacture({
  destinataire,
  nomPatient,
  numeroFacture,
  montant,
  pdfBuffer,
}: {
  destinataire: string;
  nomPatient: string;
  numeroFacture: string;
  montant: number;
  pdfBuffer: Buffer;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL manquant dans l'environnement.");

  const resend = getResendClient();
  const montantFormate = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montant);

  const { error } = await resend.emails.send({
    from: `Santé & Co <${from}>`,
    to: destinataire,
    subject: `Reçu de paiement — ${numeroFacture}`,
    text: `Bonjour ${nomPatient},\n\nTon prélèvement mensuel de ${montantFormate} a bien été reçu. Tu trouveras la facture ${numeroFacture} en pièce jointe.\n\nÀ bientôt,\nSanté & Co`,
    attachments: [{ filename: `facture-${numeroFacture}.pdf`, content: pdfBuffer }],
  });

  if (error) throw new Error(`Échec de l'envoi de l'email : ${error.message}`);
}

/**
 * Prévient un patient par email (changement de séance, réponse à un ticket SAV…). N'est appelé
 * qu'à la suite d'une action explicite du coach — jamais automatiquement.
 */
export async function envoyerNotificationPatient({
  destinataire,
  nomPatient,
  sujet,
  texte,
}: {
  destinataire: string;
  nomPatient: string;
  sujet: string;
  texte: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL manquant dans l'environnement.");

  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: `Santé & Co <${from}>`,
    to: destinataire,
    subject: sujet,
    text: `Bonjour ${nomPatient},\n\n${texte}\n\nÀ bientôt,\nSanté & Co`,
  });

  if (error) throw new Error(`Échec de l'envoi de l'email : ${error.message}`);
}
