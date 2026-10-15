import Stripe from "stripe";

export function stripeDisponible() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY manquant dans l'environnement.");
  if (!client) client = new Stripe(apiKey);
  return client;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Session Stripe Checkout pour le TOUT PREMIER paiement d'un abonnement : le patient paie le
 * montant dû, et sa carte est enregistrée automatiquement (setup_future_usage: "off_session")
 * pour les prélèvements suivants. Aucune donnée de carte ne transite par nos serveurs.
 */
export async function creerSessionPremierPaiement({
  abonnementId,
  patientId,
  patientEmail,
  montant,
  formule,
  stripeCustomerId,
}: {
  abonnementId: string;
  patientId: string;
  patientEmail: string | null;
  montant: number;
  formule: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : (patientEmail ?? undefined),
    customer_creation: stripeCustomerId ? undefined : "always",
    payment_intent_data: {
      setup_future_usage: "off_session",
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(montant * 100),
          product_data: { name: formule },
        },
        quantity: 1,
      },
    ],
    metadata: { abonnementId, patientId, kind: "premier_paiement" },
    success_url: `${appUrl()}/portail/paiement?succes=1`,
    cancel_url: `${appUrl()}/portail/paiement?annule=1`,
  });

  if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  return session.url;
}

/** Session Stripe Checkout en mode "setup" seul, pour mettre à jour la carte sans repayer. */
export async function creerSessionMiseAJourCarte({
  abonnementId,
  patientId,
  stripeCustomerId,
}: {
  abonnementId: string;
  patientId: string;
  stripeCustomerId: string;
}): Promise<string> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: stripeCustomerId,
    metadata: { abonnementId, patientId, kind: "maj_carte" },
    success_url: `${appUrl()}/portail/paiement?succes=1`,
    cancel_url: `${appUrl()}/portail/paiement?annule=1`,
  });

  if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  return session.url;
}

export interface ResultatPrelevement {
  succes: boolean;
  enAttente: boolean;
  stripePaymentIntentId: string;
  motifEchec: string | null;
}

/**
 * Prélève automatiquement (off_session) le moyen de paiement déjà enregistré pour un abonnement.
 * Jamais de nouveau montant inventé : le montant provient toujours de l'Abonnement en base.
 */
export async function prelieverAbonnement({
  stripeCustomerId,
  stripePaymentMethodId,
  montant,
  formule,
  abonnementId,
  patientId,
}: {
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  montant: number;
  formule: string;
  abonnementId: string;
  patientId: string;
}): Promise<ResultatPrelevement> {
  const stripe = getStripeClient();

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(montant * 100),
      currency: "eur",
      customer: stripeCustomerId,
      payment_method: stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: formule,
      metadata: { abonnementId, patientId, kind: "prelevement_recurrent" },
    });

    if (intent.status === "succeeded") {
      return { succes: true, enAttente: false, stripePaymentIntentId: intent.id, motifEchec: null };
    }
    if (intent.status === "processing") {
      // Cas SEPA : la confirmation définitive arrive plus tard via webhook.
      return { succes: false, enAttente: true, stripePaymentIntentId: intent.id, motifEchec: null };
    }
    return {
      succes: false,
      enAttente: false,
      stripePaymentIntentId: intent.id,
      motifEchec: `Statut inattendu : ${intent.status}`,
    };
  } catch (e) {
    if (e instanceof Stripe.errors.StripeCardError) {
      return {
        succes: false,
        enAttente: false,
        stripePaymentIntentId: e.payment_intent?.id ?? "",
        motifEchec: e.message || "Carte refusée",
      };
    }
    throw e;
  }
}

export function verifierSignatureWebhook(payload: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET manquant dans l'environnement.");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function recupererMoyenPaiement(stripeCustomerId: string, stripePaymentMethodId: string) {
  const stripe = getStripeClient();
  return stripe.paymentMethods.retrieve(stripePaymentMethodId);
}

export async function recupererPaymentIntent(id: string) {
  return getStripeClient().paymentIntents.retrieve(id);
}

export async function recupererSetupIntent(id: string) {
  return getStripeClient().setupIntents.retrieve(id);
}
