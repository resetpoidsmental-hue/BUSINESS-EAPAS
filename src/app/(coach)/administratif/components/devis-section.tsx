"use client";

import { useActionState } from "react";
import { createDevis, type ActionState } from "../actions";
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

interface DevisItem {
  id: string;
  numero: string;
  date: Date;
  total: number;
  statut: string;
  patient: { nom: string; prenom: string };
}

export function DevisSection({ patients, devis }: { patients: PatientOption[]; devis: DevisItem[] }) {
  const [state, formAction, pending] = useActionState(createDevis, initialState);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Nouveau devis</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
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
                <Label htmlFor="validiteJours">Validité (jours)</Label>
                <Input id="validiteJours" name="validiteJours" type="number" defaultValue={30} />
              </div>
            </div>
            <LignesEditor />
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Création…" : "Créer le devis"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {devis.length > 0 && (
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
            {devis.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.numero}</TableCell>
                <TableCell>
                  {d.patient.prenom} {d.patient.nom}
                </TableCell>
                <TableCell>{formatDate(d.date)}</TableCell>
                <TableCell>{formatCurrency(d.total)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{d.statut}</Badge>
                </TableCell>
                <TableCell>
                  <a href={`/api/documents/devis/${d.id}`} target="_blank" rel="noopener noreferrer">
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
    </div>
  );
}
