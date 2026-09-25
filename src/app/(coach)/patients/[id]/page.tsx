import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate, ageFromDate, initials } from "@/lib/utils";
import { EntretienForm } from "./components/entretien-form";
import { BilanForm } from "./components/bilan-form";
import { BilansComparison } from "./components/bilans-comparison";
import { ObjectifsSection } from "./components/objectifs";
import { IPAQSection } from "./components/ipaq";
import { NutritionPatientSection } from "./components/nutrition-patient";
import { SeancesSection } from "./components/seances";
import { PortailAccess } from "./components/portail-access";
import { IdentiteForm } from "./components/identite-form";

function toDateInput(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      entretiens: { orderBy: { date: "desc" } },
      bilans: { orderBy: { date: "asc" } },
      objectifs: { orderBy: { createdAt: "desc" } },
      ipaqEvaluations: { orderBy: { date: "desc" } },
      bilansNutrition: { orderBy: { date: "desc" } },
      seances: { orderBy: { date: "desc" } },
      patientAccess: true,
    },
  });

  if (!patient) notFound();

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const age = ageFromDate(patient.dateNaissance);

  return (
    <div>
      <Link href="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Tous les patients
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
          {initials(patient.nom, patient.prenom)}
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            {patient.prenom} {patient.nom}
          </h1>
          <p className="text-sm text-muted">
            {patient.numDossier} {age !== null && `· ${age} ans`} {patient.pathologieALD && `· ${patient.pathologieALD}`}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Badge>{patient.statutSuivi}</Badge>
          <Badge variant="outline">{patient.metier}</Badge>
          {!patient.consentementRGPD && <Badge variant="warning">Consentement RGPD manquant</Badge>}
        </div>
      </div>

      <Tabs defaultValue="identite">
        <TabsList>
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="entretien">Entretien initial</TabsTrigger>
          <TabsTrigger value="bilans">Bilans cliniques</TabsTrigger>
          <TabsTrigger value="objectifs">Objectifs SMART</TabsTrigger>
          <TabsTrigger value="ipaq">IPAQ</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="seances">Séances</TabsTrigger>
          <TabsTrigger value="portail">Portail</TabsTrigger>
        </TabsList>

        <TabsContent value="identite">
          <IdentiteForm
            patient={{
              id: patient.id,
              nom: patient.nom,
              prenom: patient.prenom,
              dateNaissance: toDateInput(patient.dateNaissance),
              genre: patient.genre,
              telephone: patient.telephone,
              email: patient.email,
              adresse: patient.adresse,
              metier: patient.metier,
              pathologieALD: patient.pathologieALD,
              medecinPrescripteur: patient.medecinPrescripteur,
              numPrescription: patient.numPrescription,
              datePrescription: toDateInput(patient.datePrescription),
              dateBilanInitial: toDateInput(patient.dateBilanInitial),
              objectifPrincipal: patient.objectifPrincipal,
              limitations: patient.limitations,
              statutSuivi: patient.statutSuivi,
              consentementRGPD: patient.consentementRGPD,
              notes: patient.notes,
            }}
          />
        </TabsContent>

        <TabsContent value="entretien">
          <div className="flex flex-col gap-6">
            {patient.entretiens.length > 0 && (
              <p className="text-sm text-muted">
                Dernier entretien enregistré le {formatDate(patient.entretiens[0].date)}. Tu peux en ajouter un nouveau
                ci-dessous (ex. relance à distance).
              </p>
            )}
            <EntretienForm patientId={patient.id} />
          </div>
        </TabsContent>

        <TabsContent value="bilans">
          <div className="flex flex-col gap-8">
            <BilansComparison bilans={patient.bilans} />
            <BilanForm patientId={patient.id} />
          </div>
        </TabsContent>

        <TabsContent value="objectifs">
          <ObjectifsSection patientId={patient.id} objectifs={patient.objectifs} />
        </TabsContent>

        <TabsContent value="ipaq">
          <IPAQSection patientId={patient.id} evaluations={patient.ipaqEvaluations} />
        </TabsContent>

        <TabsContent value="nutrition">
          <NutritionPatientSection
            patientId={patient.id}
            bilans={patient.bilansNutrition}
            defaultAge={age}
            defaultSexe={patient.genre}
          />
        </TabsContent>

        <TabsContent value="seances">
          <SeancesSection patientId={patient.id} seances={patient.seances} />
        </TabsContent>

        <TabsContent value="portail">
          <PortailAccess
            patientId={patient.id}
            active={patient.patientAccess?.actif ?? false}
            portalEnabled={settings?.portalEnabled ?? false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
