import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Target, CalendarDays, Backpack } from "lucide-react";
import { marquerMaterielVu } from "./actions";

export default async function PortailDashboard() {
  const session = await getPatientSession();
  const patient = await prisma.patient.findUnique({
    where: { id: session!.patientId },
    include: {
      objectifs: { orderBy: { createdAt: "desc" } },
      seances: { where: { date: { gte: new Date() }, statut: "Planifiée" }, orderBy: { date: "asc" }, take: 5 },
    },
  });

  if (!patient) return null;

  const prochaineAvecMateriel = patient.seances.find((s) => s.materielNecessaire && !s.materielVu);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <h1 className="mb-1 text-lg font-semibold">Bonjour {patient.prenom} 👋</h1>
          <p className="text-sm text-muted">
            Voici où tu en es dans ton accompagnement {patient.metier === "Nutrition" ? "nutrition" : "EAPAS"}.
          </p>
          {patient.objectifPrincipal && (
            <div className="mt-4 rounded-[var(--radius-sm)] bg-primary-soft p-3 text-sm text-primary">
              <strong>Ton objectif principal :</strong> {patient.objectifPrincipal}
            </div>
          )}
        </CardContent>
      </Card>

      {prochaineAvecMateriel && (
        <Card className="border-primary">
          <CardContent className="flex gap-3 p-5">
            <Backpack className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">
                Ta prochaine séance — {formatDateTime(prochaineAvecMateriel.date)}
              </p>
              <p className="text-sm text-foreground">
                Pense à préparer : <strong>{prochaineAvecMateriel.materielNecessaire}</strong>.
              </p>
              <form action={marquerMaterielVu.bind(null, prochaineAvecMateriel.id)}>
                <button type="submit" className="w-fit text-xs font-semibold text-primary hover:underline">
                  J&rsquo;ai compris
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Prochaines séances</h2>
          </div>
          {patient.seances.length === 0 ? (
            <p className="text-sm text-muted">Aucune séance planifiée pour le moment.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {patient.seances.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{s.type ?? "Séance"} {s.format && `· ${s.format}`}</span>
                  <span className="text-muted">{formatDateTime(s.date)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Tes objectifs</h2>
          </div>
          {patient.objectifs.length === 0 ? (
            <p className="text-sm text-muted">Tes objectifs apparaîtront ici une fois définis avec ton coach.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {patient.objectifs.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-surface-muted p-3 text-sm">
                  <span>{o.texteSMART}</span>
                  <Badge variant={o.atteint ? "success" : "muted"}>{o.atteint ? "Atteint" : "En cours"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {patient.dateBilanInitial && (
        <p className="text-center text-xs text-muted">Bilan initial réalisé le {formatDate(patient.dateBilanInitial)}</p>
      )}
    </div>
  );
}
