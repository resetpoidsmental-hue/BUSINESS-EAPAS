import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

const STATUT_VARIANT: Record<string, "success" | "danger" | "muted"> = {
  Payée: "success",
  Impayée: "danger",
  Émise: "muted",
};

export default async function PortailFacturesPage() {
  const session = await getPatientSession();
  const factures = await prisma.facture.findMany({
    where: { patientId: session!.patientId },
    orderBy: { date: "desc" },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Mes factures</h2>
        {factures.length === 0 ? (
          <p className="text-sm text-muted">Aucune facture pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factures.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.numero}</TableCell>
                  <TableCell>{formatDate(f.date)}</TableCell>
                  <TableCell>{formatCurrency(f.total)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUT_VARIANT[f.statut] ?? "muted"}>{f.statut}</Badge>
                  </TableCell>
                  <TableCell>
                    <a href={`/api/documents/facture/${f.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" type="button" title="Télécharger le PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
