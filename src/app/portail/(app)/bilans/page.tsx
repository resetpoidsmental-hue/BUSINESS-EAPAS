import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/utils";
import { BilansComparison } from "@/app/(coach)/patients/[id]/components/bilans-comparison";

const CLASSIF_VARIANT: Record<string, "danger" | "warning" | "success"> = {
  "Faible / Sédentaire": "danger",
  Modéré: "warning",
  Élevé: "success",
};

export default async function PortailBilansPage() {
  const session = await getPatientSession();
  const patient = await prisma.patient.findUnique({
    where: { id: session!.patientId },
    include: {
      bilans: { orderBy: { date: "asc" } },
      ipaqEvaluations: { orderBy: { date: "desc" } },
      bilansNutrition: { orderBy: { date: "desc" } },
    },
  });

  if (!patient) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Bilans cliniques (tests physiques)</h2>
          <BilansComparison bilans={patient.bilans} />
        </CardContent>
      </Card>

      {patient.ipaqEvaluations.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold">Niveau d&apos;activité physique (IPAQ)</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Niveau</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.ipaqEvaluations.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>{e.scoreTotal} MET-min/sem</TableCell>
                    <TableCell>
                      <Badge variant={CLASSIF_VARIANT[e.classification] ?? "muted"}>{e.classification}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {patient.bilansNutrition.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold">Suivi nutritionnel</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Poids</TableHead>
                  <TableHead>IMC</TableHead>
                  <TableHead>Apport cible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.bilansNutrition.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{formatDate(b.date)}</TableCell>
                    <TableCell>{formatNumber(b.poids)} kg</TableCell>
                    <TableCell>{formatNumber(b.imc)}</TableCell>
                    <TableCell>{formatNumber(b.apportCalorique, 0)} kcal/j</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
