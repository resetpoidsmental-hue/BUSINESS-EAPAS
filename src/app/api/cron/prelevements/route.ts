import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { prelieverAbonnement, stripeDisponible } from "@/lib/stripe";
import { nextNumero } from "@/lib/numerotation";
import { envoyerRecuFactureSiPossible } from "@/lib/recus";

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
    },
    include: { patient: { select: { id: true, nom: true, prenom: true } } },
  });

  const resultats: { patient: string; statut: string }[] = [];

  for (const abonnement of abonnementsDus) {
    try {
      const numero = await nextNumero("facture");
      const facture = await prisma.facture.create({
        data: {
          numero,
          patientId: abonnement.patientId,
          lignes: JSON.stringify([{ designation: abonnement.formule, quantite: 1, prixUnitaire: abonnement.montantMensuel }]),
          total: abonnement.montantMensuel,
          statut: "Émise",
        },
      });

      const resultat = await prelieverAbonnement({
        stripeCustomerId: abonnement.stripeCustomerId!,
        stripePaymentMethodId: abonnement.stripePaymentMethodId!,
        montant: abonnement.montantMensuel,
        formule: abonnement.formule,
        abonnementId: abonnement.id,
        patientId: abonnement.patientId,
      });

      const statutPrelevement = resultat.succes ? "Réussi" : resultat.enAttente ? "En attente" : "Échec";

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
        const prochain = new Date();
        prochain.setMonth(prochain.getMonth() + 1);
        await prisma.facture.update({ where: { id: facture.id }, data: { statut: "Payée", datePaiement: new Date() } });
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
        await prisma.facture.update({ where: { id: facture.id }, data: { statut: "Impayée" } });
        await prisma.abonnement.update({ where: { id: abonnement.id }, data: { statutPaiement: "Échec paiement" } });
      }
      // En attente (SEPA) : on laisse tout en l'état, la confirmation arrivera par webhook.

      resultats.push({ patient: `${abonnement.patient.prenom} ${abonnement.patient.nom}`, statut: statutPrelevement });
    } catch (e) {
      resultats.push({
        patient: `${abonnement.patient.prenom} ${abonnement.patient.nom}`,
        statut: `Erreur : ${e instanceof Error ? e.message : "inconnue"}`,
      });
    }
  }

  return NextResponse.json({ traites: resultats.length, resultats });
}
