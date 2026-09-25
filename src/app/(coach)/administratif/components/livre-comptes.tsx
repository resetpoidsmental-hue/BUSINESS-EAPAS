import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface FacturePayee {
  numero: string;
  datePaiement: Date | null;
  total: number;
  modeReglement: string | null;
  patient: { nom: string; prenom: string };
}

export function LivreDeComptes({ factures, tauxUrssaf }: { factures: FacturePayee[]; tauxUrssaf: number }) {
  const year = new Date().getFullYear();
  const parMois = Array.from({ length: 12 }, () => 0);
  let totalAnnee = 0;

  for (const f of factures) {
    if (!f.datePaiement) continue;
    if (f.datePaiement.getFullYear() !== year) continue;
    parMois[f.datePaiement.getMonth()] += f.total;
    totalAnnee += f.total;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <p className="mb-1 text-sm font-semibold">Suivi mensuel du chiffre d&apos;affaires {year}</p>
          <p className="mb-4 text-xs text-muted">
            Calculé automatiquement à partir des factures marquées « Payée ». Cotisations URSSAF estimées à{" "}
            {tauxUrssaf}% — vérifie ton taux exact sur autoentrepreneur.urssaf.fr.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>CA encaissé</TableHead>
                <TableHead>Cotisations estimées</TableHead>
                <TableHead>Reste net estimé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOIS.map((mois, i) => {
                const ca = parMois[i];
                const cotis = ca * (tauxUrssaf / 100);
                return (
                  <TableRow key={mois}>
                    <TableCell>{mois}</TableCell>
                    <TableCell>{formatCurrency(ca)}</TableCell>
                    <TableCell>{formatCurrency(cotis)}</TableCell>
                    <TableCell>{formatCurrency(ca - cotis)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold">
                <TableCell>Total {year}</TableCell>
                <TableCell>{formatCurrency(totalAnnee)}</TableCell>
                <TableCell>{formatCurrency(totalAnnee * (tauxUrssaf / 100))}</TableCell>
                <TableCell>{formatCurrency(totalAnnee * (1 - tauxUrssaf / 100))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted">
            Plafond de chiffre d&apos;affaires micro-entrepreneur (prestations de services) : ≈ 77 700 €/an. Seuil de
            franchise en base de TVA : ≈ 37 500 €/an pour les services — à vérifier selon ta situation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold">Livre des recettes — registre chronologique</p>
          {factures.length === 0 ? (
            <p className="text-sm text-muted">Aucun encaissement enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date encaissement</TableHead>
                  <TableHead>N° facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factures
                  .filter((f) => f.datePaiement)
                  .sort((a, b) => (b.datePaiement?.getTime() ?? 0) - (a.datePaiement?.getTime() ?? 0))
                  .map((f) => (
                    <TableRow key={f.numero}>
                      <TableCell>{formatDate(f.datePaiement)}</TableCell>
                      <TableCell className="font-medium">{f.numero}</TableCell>
                      <TableCell>
                        {f.patient.prenom} {f.patient.nom}
                      </TableCell>
                      <TableCell>{f.modeReglement ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(f.total)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
