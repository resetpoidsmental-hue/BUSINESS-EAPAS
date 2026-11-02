import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { prelieverAbonnement, stripeDisponible } from "@/lib/stripe";
import { nextNumero } from "@/lib/numerotation";
import { envoyerRecuFactureSiPossible } from "@/lib/recus";
import { telegramDisponible, envoyerMessageTelegram } from "@/lib/telegram";
import { ajouterUnMois } from "@/lib/utils";

/**
 * Appelée une fois par jour (cron sur le VPS) : prélève tous les abonnements dont la date de
 * prélèvement est arrivée. Chaque tentative crée sa propre facture + ligne de prélèvement —
 * jamais de montant recalculé ou inventé, toujours celui déjà enregistré sur l'Abonnement.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  if (!stripeDisponible()) {
    return NextResponse.json({ traites: 0, erreurs: ["Stripe non configuré"] });
  }

  const aujourdhui = new Date();
  aujourdhui.setHours(23, 59, 59, 999);

  const abonnementsDus = await prisma.abonnement.findMany({
    where: {
      prelevementActif: true,
      prochainPaiement: { lte: aujourdhui },
      stripeCustomerId: { not: null },
      stripePaymentMethodId: { not: null },
      // Un prélèvement SEPA met plusieurs jours à se résoudre : sans ce filtre, chaque run
      // quotidien tant que la réponse précédente est encore "En attente" recréait un second
      // PaymentIntent bien réel et rechargeait le patient pour la même échéance.
      prelevements: { none: { statut: "En attente" } },
    },
    include: { patient: { select: { id: true, nom: true, prenom: true } } },
  });

  const resultats: { patient: string; statut: string }[] = [];
  const echecs: string[] = [];

  for (const abonnement of abonnementsDus) {
    try {
      // Le prélèvement Stripe est tenté AVANT de créer la moindre ligne en base : s'il lève une
      // erreur technique, rien n'est créé (pas de facture orpheline sans ligne de prélèvement),
      // et comme prochainPaiement n'a pas bougé, demain réessaiera proprement depuis zéro.
      const resultat = await prelieverAbonnement({
        stripeCustomerId: abonnement.stripeCustomerId!,
        stripePaymentMethodId: abonnement.stripePaymentMethodId!,
        montant: abonnement.montantMensuel,
        formule: abonnement.formule,
        abonnementId: abonnement.id,
        patientId: abonnement.patientId,
      });

      const statutPrelevement = resultat.succes ? "Réussi" : resultat.enAttente ? "En attente" : "Échec";
      const numero = await nextNumero("facture");
      const facture = await prisma.facture.create({
        data: {
          numero,
          patientId: abonnement.patientId,
          lignes: JSON.stringify([{ designation: abonnement.formule, quantite: 1, prixUnitaire: abonnement.montantMensuel }]),
          total: abonnement.montantMensuel,
          statut: resultat.succes ? "Payée" : resultat.enAttente ? "Émise" : "Impayée",
          datePaiement: resultat.succes ? new Date() : null,
        },
      });

      await prisma.prelevement.create({
        data: {
          abonnementId: abonnement.id,
          patientId: abonnement.patientId,
          factureId: facture.id,
          montant: abonnement.montantMensuel,
          statut: statutPrelevement,
          motifEchec: resultat.motifEchec,
          stripePaymentIntentId: resultat.stripePaymentIntentId || null,
        },
      });

      if (resultat.succes) {
        const prochain = ajouterUnMois(new Date());
        await prisma.abonnement.update({
          where: { id: abonnement.id },
          data: { dateDernierPaiement: new Date(), prochainPaiement: prochain, statutPaiement: "À jour" },
        });
        await envoyerRecuFactureSiPossible({
          factureId: facture.id,
          patientId: abonnement.patientId,
          numero,
          montant: abonnement.montantMensuel,
        });
      } else if (!resultat.enAttente) {
        await prisma.abonnement.update({ where: { id: abonnement.id }, data: { statutPaiement: "Échec paiement" } });
        echecs.push(`${abonnement.patient.prenom} ${abonnement.patient.nom} — ${resultat.motifEchec ?? "Échec"}`);
      }
      // En attente (SEPA) : la facture reste "Émise", la confirmation arrivera par webhook (voir
      // gererPaymentIntentFinal, qui alerte aussi Telegram en cas d'échec différé).

      resultats.push({ patient: `${abonnement.patient.prenom} ${abonnement.patient.nom}`, statut: statutPrelevement });
    } catch (e) {
      const message = e instanceof Error ? e.message : "inconnue";
      resultats.push({ patient: `${abonnement.patient.prenom} ${abonnement.patient.nom}`, statut: `Erreur : ${message}` });
      echecs.push(`${abonnement.patient.prenom} ${abonnement.patient.nom} — Erreur technique : ${message}`);
    }
  }

  // Seule alerte proactive de l'app qui manquait : jusqu'ici un prélèvement échoué n'était visible
  // que si quelqu'un ouvrait l'app et regardait la cloche ou le Tableau de bord.
  if (echecs.length > 0 && telegramDisponible()) {
    try {
      await envoyerMessageTelegram(`⚠️ ${echecs.length} prélèvement${echecs.length > 1 ? "s" : ""} échoué${echecs.length > 1 ? "s" : ""}\n\n${echecs.join("\n")}`);
    } catch (e) {
      console.error("Échec de l'alerte Telegram prélèvements:", e);
    }
  }

  return NextResponse.json({ traites: resultats.length, resultats });
}
