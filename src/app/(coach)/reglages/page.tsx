import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "./settings-form";
import { PortalToggle } from "./portal-toggle";
import { HorairesTravail } from "./components/horaires-travail";
import { IntegrationsStatus } from "./components/integrations-status";
import { SauvegardeStatus } from "./components/sauvegarde-status";
import { RelancerVisiteGuidee } from "./components/relancer-visite-guidee";
import { listerSauvegardes } from "@/lib/backup";

export default async function ReglagesPage() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1 } });
  }

  const now = new Date();
  const [horaires, creneauxExceptionnels] = await Promise.all([
    prisma.horaireTravail.findMany({ orderBy: { jour: "asc" } }),
    prisma.creneauExceptionnel.findMany({ where: { date: { gte: now } }, orderBy: { date: "asc" } }),
  ]);
  const sauvegardes = listerSauvegardes();

  return (
    <div>
      <PageHeader title="Réglages" description="Informations professionnelles et paramètres de l'application." />
      <div className="flex flex-col gap-6">
        <IntegrationsStatus />
        <SauvegardeStatus derniere={sauvegardes[0] ?? null} nombreConservees={sauvegardes.length} />
        <div className="-mt-3">
          <RelancerVisiteGuidee />
        </div>
        <PortalToggle initial={settings.portalEnabled} />
        <SettingsForm
          settings={{
            nomEntreprise: settings.nomEntreprise,
            siret: settings.siret,
            adresse: settings.adresse,
            telephone: settings.telephone,
            email: settings.email,
            mentionTVA: settings.mentionTVA,
            tauxUrssaf: settings.tauxUrssaf,
            assuranceRCPro: settings.assuranceRCPro,
          }}
        />
        <HorairesTravail
          horaires={horaires.map((h) => ({ jour: h.jour, actif: h.actif, debut: h.debut, fin: h.fin }))}
          creneauxExceptionnels={creneauxExceptionnels.map((c) => ({
            id: c.id,
            date: c.date.toISOString(),
            debut: c.debut,
            fin: c.fin,
            note: c.note,
          }))}
        />
      </div>
    </div>
  );
}
