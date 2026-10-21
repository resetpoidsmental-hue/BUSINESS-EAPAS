import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { assistantIADisponible } from "@/lib/ai";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate, ageFromDate, initials } from "@/lib/utils";
import { EntretienForm } from "./components/entretien-form";
import { BilansSection } from "./components/bilans-section";
import { ObjectifsSection } from "./components/objectifs";
import { IPAQSection } from "./components/ipaq";
import { NutritionPatientSection } from "./components/nutrition-patient";
import { SeancesSection } from "./components/seances";
import { PortailAccess } from "./components/portail-access";
import { IdentiteForm } from "./components/identite-form";
import { SuiviSection } from "./components/suivi";
import { journalInactifDepuis } from "@/lib/relances";

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
      seances: {
        orderBy: { date: "desc" },
        include: { objectifSMART: { select: { id: true, texteSMART: true } } },
      },
      journalEntrees: { orderBy: { date: "desc" }, take: 30 },
      modelesRation: { orderBy: { updatedAt: "desc" } },
      patientAccess: true,
    },
  });

  if (!patient) notFound();

  const [settings, modelesBibliotheque] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.modeleRation.findMany({ where: { patientId: null }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
  ]);
  const age = ageFromDate(patient.dateNaissance);

  const dernierJournal = patient.journalEntrees[0]?.date ?? null;
  const journalNonRempli = journalInactifDepuis({
    dernierJournal,
    accessCreatedAt: patient.patientAccess?.createdAt ?? null,
    accessActif: patient.patientAccess?.actif ?? false,
    now: new Date(),
  });

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
          <TabsTrigger value="suivi">Suivi</TabsTrigger>
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
          <BilansSection
            patientId={patient.id}
            iaDisponible={assistantIADisponible()}
            bilans={patient.bilans}
            objectifs={patient.objectifs}
          />
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
            modeles={patient.modelesRation.map((m) => ({
              id: m.id,
              nom: m.nom,
              targetKcal: m.targetKcal,
              partageLe: m.partageLe,
              updatedAt: m.updatedAt,
            }))}
            modelesBibliotheque={modelesBibliotheque}
          />
        </TabsContent>

        <TabsContent value="seances">
          <SeancesSection patientId={patient.id} seances={patient.seances} />
        </TabsContent>

        <TabsContent value="suivi">
          <SuiviSection
            patientId={patient.id}
            seancesManquees={patient.seances
              .filter((s) => s.statut === "Planifiée" && s.date < new Date())
              .map((s) => ({ id: s.id, date: s.date, type: s.type }))}
            ressentisRecents={patient.seances
              .filter((s) => s.statut === "Faite" && s.borgRessenti !== null)
              .slice(0, 4)
              .map((s) => ({ date: s.date, borgRessenti: s.borgRessenti as number }))}
            journalEntrees={patient.journalEntrees.map((j) => ({
              id: j.id,
              date: j.date,
              repas: j.repas,
              repasStructure: j.repasStructure,
              activite: j.activite,
              dureeMinutes: j.dureeMinutes,
              heure: j.heure,
              motivation: j.motivation,
              notes: j.notes,
            }))}
            journalNonRempli={journalNonRempli}
            dernierJournal={dernierJournal}
            prochaineEcheance={
              patient.objectifs
                .filter((o) => !o.atteint && o.dateCible)
                .sort((a, b) => a.dateCible!.getTime() - b.dateCible!.getTime())[0]?.dateCible ?? null
            }
          />
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
