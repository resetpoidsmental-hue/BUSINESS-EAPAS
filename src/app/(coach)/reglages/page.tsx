import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "./settings-form";
import { PortalToggle } from "./portal-toggle";

export default async function ReglagesPage() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1 } });
  }

  return (
    <div>
      <PageHeader title="Réglages" description="Informations professionnelles et paramètres de l'application." />
      <div className="flex flex-col gap-6">
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
      </div>
    </div>
  );
}
