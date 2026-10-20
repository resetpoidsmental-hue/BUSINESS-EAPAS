import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { verifierSignatureWebhook, recupererMoyenPaiement, recupererPaymentIntent, recupererSetupIntent } from "@/lib/stripe";
import { envoyerRecuFactureSiPossible } from "@/lib/recus";
import { nextNumero } from "@/lib/numerotation";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Signature manquante", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = verifierSignatureWebhook(payload, signature);
  } catch {
    return new NextResponse("Signature invalide", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await gererCheckoutComplete(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "payment_intent.succeeded") {
      await gererPaymentIntentFinal(event.data.object as Stripe.PaymentIntent, "Réussi");
    } else if (event.type === "payment_intent.payment_failed") {
      await gererPaymentIntentFinal(event.data.object as Stripe.PaymentIntent, "Échec");
    }
  } catch (e) {
    console.error("Erreur webhook Stripe:", e);
    // On répond quand même 200 : Stripe retentera sinon indéfiniment un événement qu'on ne saura
    // jamais traiter (ex. abonnement déjà supprimé) — l'échec est visible dans les logs.
  }

  return NextResponse.json({ received: true });
}

async function gererCheckoutComplete(session: Stripe.Checkout.Session) {
  const abonnementId = session.metadata?.abonnementId;
  const kind = session.metadata?.kind;
  if (!abonnementId) return;

  const abonnement = await prisma.abonnement.findUnique({ where: { id: abonnementId }, include: { patient: true } });
  if (!abonnement) return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  let paymentMethodId: string | null = null;

  if (kind === "maj_carte") {
    const setupIntentId = typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
    if (setupIntentId) {
      // Le setup_intent complet n'est pas inclus dans l'event checkout.session.completed : on le
      // récupère via l'API pour connaître le moyen de paiement enregistré.
      const setupIntent = await recupererSetupIntent(setupIntentId);
      paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : null;
    }
  } else {
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (paymentIntentId) {
      const paymentIntent = await recupererPaymentIntent(paymentIntentId);
      paymentMethodId = typeof paymentIntent.payment_method === "string" ? paymentIntent.payment_method : null;
    }
  }

  const dataCarte: Record<string, unknown> = {};
  if (customerId) dataCarte.stripeCustomerId = customerId;
  if (paymentMethodId) {
    dataCarte.stripePaymentMethodId = paymentMethodId;
    if (customerId) {
      const pm = await recupererMoyenPaiement(customerId, paymentMethodId);
      if (pm.card) {
        dataCarte.cardBrand = pm.card.brand;
        dataCarte.cardLast4 = pm.card.last4;
        dataCarte.cardExpMois = pm.card.exp_month;
        dataCarte.cardExpAnnee = pm.card.exp_year;
      }
    }
  }

  if (kind === "maj_carte") {
    await prisma.abonnement.update({ where: { id: abonnementId }, data: dataCarte });
    return;
  }

  // Premier paiement : enregistre la carte ET crée la facture + le prélèvement correspondants.
  const prochain = new Date();
  prochain.setMonth(prochain.getMonth() + 1);

  await prisma.abonnement.update({
    where: { id: abonnementId },
    data: {
      ...dataCarte,
      dateDernierPaiement: new Date(),
      prochainPaiement: prochain,
      statutPaiement: "À jour",
      prelevementActif: true,
    },
  });

  const numero = await nextNumero("facture");
  const montant = abonnement.montantMensuel;
  const facture = await prisma.facture.create({
    data: {
      numero,
      patientId: abonnement.patientId,
      lignes: JSON.stringify([{ designation: abonnement.formule, quantite: 1, prixUnitaire: montant }]),
      total: montant,
      statut: "Payée",
      datePaiement: new Date(),
    },
  });

  await prisma.prelevement.create({
    data: {
      abonnementId,
      patientId: abonnement.patientId,
      factureId: facture.id,
      montant,
      statut: "Réussi",
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
    },
  });

  await envoyerRecuFactureSiPossible({ factureId: facture.id, patientId: abonnement.patientId, numero, montant });
}

async function gererPaymentIntentFinal(paymentIntent: Stripe.PaymentIntent, resultat: "Réussi" | "Échec") {
  const prelevement = await prisma.prelevement.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { abonnement: true, facture: true },
  });
  // Pas de ligne trouvée : probablement le tout premier paiement, déjà traité par
  // checkout.session.completed — on ignore pour ne jamais créer de doublon.
  if (!prelevement) return;
  if (prelevement.statut === "Réussi") return;

  const motifEchec = resultat === "Échec" ? (paymentIntent.last_payment_error?.message ?? "Paiement refusé") : null;

  await prisma.prelevement.update({
    where: { id: prelevement.id },
    data: { statut: resultat, motifEchec },
  });

  if (prelevement.factureId) {
    await prisma.facture.update({
      where: { id: prelevement.factureId },
      data:
        resultat === "Réussi"
          ? { statut: "Payée", datePaiement: new Date() }
          : { statut: "Impayée" },
    });
  }

  await prisma.abonnement.update({
    where: { id: prelevement.abonnementId },
    data:
      resultat === "Réussi"
        ? (() => {
            const prochain = new Date();
            prochain.setMonth(prochain.getMonth() + 1);
            return { dateDernierPaiement: new Date(), prochainPaiement: prochain, statutPaiement: "À jour" };
          })()
        : { statutPaiement: "Échec paiement" },
  });

  if (resultat === "Réussi" && prelevement.factureId) {
    await envoyerRecuFactureSiPossible({
      factureId: prelevement.factureId,
      patientId: prelevement.patientId,
      numero: prelevement.facture?.numero ?? "",
      montant: prelevement.montant,
    });
  }
}
