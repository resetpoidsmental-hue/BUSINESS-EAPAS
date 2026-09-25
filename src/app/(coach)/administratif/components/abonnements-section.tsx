"use client";

import { useActionState } from "react";
import { upsertAbonnement, marquerPaiementRecu, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";

const initialState: ActionState = {};

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
}

interface AbonnementItem {
  patientId: string;
  formule: string;
  montantMensuel: number;
  prochainPaiement: Date | null;
  statutPaiement: string;
  patient: { nom: string; prenom: string };
}

export function AbonnementsSection({
  patients,
  abonnements,
}: {
  patients: PatientOption[];
  abonnements: AbonnementItem[];
}) {
  const [state, formAction, pending] = useActionState(upsertAbonnement, initialState);
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Créer / mettre à jour un abonnement</p>
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
                <Label htmlFor="formule">Formule</Label>
                <Input id="formule" name="formule" placeholder="4 séances / mois" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="montantMensuel">Montant mensuel (€)</Label>
                <Input id="montantMensuel" name="montantMensuel" type="number" step="0.01" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jourPrelevement">Jour de prélèvement</Label>
                <Input id="jourPrelevement" name="jourPrelevement" type="number" min={1} max={28} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input id="dateDebut" name="dateDebut" type="date" required />
              </div>
            </div>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {abonnements.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Formule</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Prochain paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abonnements.map((a) => {
              const enRetard = a.prochainPaiement ? a.prochainPaiement < now : false;
              return (
                <TableRow key={a.patientId}>
                  <TableCell>
                    {a.patient.prenom} {a.patient.nom}
                  </TableCell>
                  <TableCell>{a.formule}</TableCell>
                  <TableCell>{formatCurrency(a.montantMensuel)}</TableCell>
                  <TableCell>{formatDate(a.prochainPaiement)}</TableCell>
                  <TableCell>
                    <Badge variant={enRetard ? "danger" : "success"}>{enRetard ? "En retard" : a.statutPaiement}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={marquerPaiementRecu.bind(null, a.patientId)}>
                      <Button size="sm" variant="secondary" type="submit">
                        Paiement reçu
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
