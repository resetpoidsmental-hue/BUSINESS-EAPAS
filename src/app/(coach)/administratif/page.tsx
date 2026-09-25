import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DevisSection } from "./components/devis-section";
import { ContratSection } from "./components/contrat-section";
import { FactureSection } from "./components/facture-section";
import { AbonnementsSection } from "./components/abonnements-section";
import { LivreDeComptes } from "./components/livre-comptes";
import { ModelesMessages } from "./components/modeles-messages";

export default async function AdministratifPage() {
  const [patients, devis, contrats, factures, abonnements, settings] = await Promise.all([
    prisma.patient.findMany({ select: { id: true, nom: true, prenom: true }, orderBy: { nom: "asc" } }),
    prisma.devis.findMany({ include: { patient: { select: { nom: true, prenom: true } } }, orderBy: { date: "desc" } }),
    prisma.contrat.findMany({ include: { patient: { select: { nom: true, prenom: true } } }, orderBy: { dateDebut: "desc" } }),
    prisma.facture.findMany({ include: { patient: { select: { nom: true, prenom: true } } }, orderBy: { date: "desc" } }),
    prisma.abonnement.findMany({ include: { patient: { select: { nom: true, prenom: true } } }, orderBy: { dateDebut: "desc" } }),
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
  ]);

  const facturesPayees = factures.filter((f) => f.statut === "Payée");

  return (
    <div>
      <PageHeader title="Administratif" description="Devis, contrats, factures, abonnements et comptabilité." />

      <Tabs defaultValue="factures">
        <TabsList>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="devis">Devis</TabsTrigger>
          <TabsTrigger value="contrats">Contrats</TabsTrigger>
          <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger value="comptes">Livre de comptes</TabsTrigger>
          <TabsTrigger value="modeles">Modèles</TabsTrigger>
        </TabsList>

        <TabsContent value="factures">
          <FactureSection patients={patients} factures={factures} />
        </TabsContent>
        <TabsContent value="devis">
          <DevisSection patients={patients} devis={devis} />
        </TabsContent>
        <TabsContent value="contrats">
          <ContratSection patients={patients} contrats={contrats} />
        </TabsContent>
        <TabsContent value="abonnements">
          <AbonnementsSection patients={patients} abonnements={abonnements} />
        </TabsContent>
        <TabsContent value="comptes">
          <LivreDeComptes factures={facturesPayees} tauxUrssaf={settings.tauxUrssaf} />
        </TabsContent>
        <TabsContent value="modeles">
          <ModelesMessages nomEntreprise={settings.nomEntreprise} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
