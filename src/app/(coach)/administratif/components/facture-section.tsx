"use client";

import { useActionState } from "react";
import { createFacture, marquerFacturePayee, marquerFactureImpayee, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LignesEditor } from "./lignes-editor";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

const initialState: ActionState = {};

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
}

interface FactureItem {
  id: string;
  numero: string;
  date: Date;
  total: number;
  statut: string;
  dateEcheance: Date | null;
  patient: { nom: string; prenom: string };
}

const STATUT_VARIANT: Record<string, "success" | "danger" | "muted"> = {
  Payée: "success",
  Impayée: "danger",
  Émise: "muted",
};

export function FactureSection({ patients, factures }: { patients: PatientOption[]; factures: FactureItem[] }) {
  const [state, formAction, pending] = useActionState(createFacture, initialState);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Nouvelle facture</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <Label htmlFor="patientId">Client</Label>
                <select id="patientId" name="patientId" required className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
                  <option value="">Sélectionner…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="modeReglement">Mode de règlement</Label>
                <select id="modeReglement" name="modeReglement" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
                  <option value="Virement">Virement</option>
                  <option value="Carte">Carte</option>
                  <option value="Prélèvement">Prélèvement</option>
                  <option value="Espèces">Espèces</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateEcheance">Échéance</Label>
                <Input id="dateEcheance" name="dateEcheance" type="date" />
              </div>
            </div>
            <LignesEditor />
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Création…" : "Créer la facture"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {factures.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factures.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.numero}</TableCell>
                <TableCell>
                  {f.patient.prenom} {f.patient.nom}
                </TableCell>
                <TableCell>{formatDate(f.date)}</TableCell>
                <TableCell>{formatCurrency(f.total)}</TableCell>
                <TableCell>
                  <Badge variant={STATUT_VARIANT[f.statut] ?? "muted"}>{f.statut}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <a href={`/api/documents/facture/${f.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" type="button" title="Télécharger le PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    {f.statut !== "Payée" ? (
                      <form action={marquerFacturePayee.bind(null, f.id)}>
                        <Button size="sm" variant="secondary" type="submit">
                          Marquer payée
                        </Button>
                      </form>
                    ) : (
                      <form action={marquerFactureImpayee.bind(null, f.id)}>
                        <Button size="sm" variant="ghost" type="submit">
                          Annuler
                        </Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
