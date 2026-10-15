import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { envoyerRecuFacture, emailDisponible } from "@/lib/email";
import { DevisFacturePDF } from "@/lib/pdf/devis-facture-pdf";

/**
 * Envoie le reçu PDF d'une facture par email, si Resend est configuré et que le patient a une
 * adresse email. N'est appelée qu'après un prélèvement RÉUSSI et confirmé par Stripe — jamais
 * de relance automatique, jamais d'envoi pour un paiement en attente ou échoué.
 */
export async function envoyerRecuFactureSiPossible({
  factureId,
  patientId,
  numero,
  montant,
}: {
  factureId: string;
  patientId: string;
  numero: string;
  montant: number;
}) {
  if (!emailDisponible()) return;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient?.email) return;

  const facture = await prisma.facture.findUnique({ where: { id: factureId }, include: { patient: true } });
  if (!facture) return;

  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  try {
    const buffer = await renderToBuffer(
      DevisFacturePDF({
        kind: "facture",
        numero: facture.numero,
        date: facture.date,
        settings,
        patient: facture.patient,
        lignes: JSON.parse(facture.lignes),
        total: facture.total,
        statut: facture.statut,
      })
    );

    await envoyerRecuFacture({
      destinataire: patient.email,
      nomPatient: `${patient.prenom} ${patient.nom}`,
      numeroFacture: numero,
      montant,
      pdfBuffer: buffer,
    });
  } catch (e) {
    console.error("Échec de l'envoi du reçu par email:", e);
  }
}
