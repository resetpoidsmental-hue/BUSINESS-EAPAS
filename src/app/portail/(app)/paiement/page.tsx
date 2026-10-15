import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { PaiementActions } from "./paiement-actions";

export default async function PortailPaiementPage() {
  const session = await getPatientSession();
  const abonnement = await prisma.abonnement.findUnique({ where: { patientId: session!.patientId } });

  if (!abonnement) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted">
          Tu n&rsquo;as pas d&rsquo;abonnement actif pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Mon paiement</h1>
      <PaiementActions
        abonnement={{
          formule: abonnement.formule,
          montantMensuel: abonnement.montantMensuel,
          prochainPaiement: abonnement.prochainPaiement ? abonnement.prochainPaiement.toISOString() : null,
          prelevementActif: abonnement.prelevementActif,
          cardBrand: abonnement.cardBrand,
          cardLast4: abonnement.cardLast4,
          cardExpMois: abonnement.cardExpMois,
          cardExpAnnee: abonnement.cardExpAnnee,
          moyenPaiementEnregistre: Boolean(abonnement.stripePaymentMethodId),
        }}
      />
      <p className="text-xs text-muted">
        En cas d&rsquo;échec de prélèvement (carte expirée, solde insuffisant…), ton coach en est informé et te
        recontactera — aucune relance automatique ne t&rsquo;est envoyée par l&rsquo;app au-delà du reçu normal.
      </p>
    </div>
  );
}
