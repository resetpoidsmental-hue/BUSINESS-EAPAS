"use client";

import { useActionState } from "react";
import { createDepense, deleteDepense, CATEGORIES_DEPENSE, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const initialState: ActionState = {};

interface DepenseItem {
  id: string;
  date: Date;
  categorie: string;
  libelle: string;
  montant: number;
  notes: string | null;
}

export function DepensesSection({ depenses }: { depenses: DepenseItem[] }) {
  const [state, formAction, pending] = useActionState(createDepense, initialState);

  const totalAnnee = depenses
    .filter((d) => d.date.getFullYear() === new Date().getFullYear())
    .reduce((sum, d) => sum + d.montant, 0);

  const parCategorie = new Map<string, number>();
  for (const d of depenses) {
    if (d.date.getFullYear() !== new Date().getFullYear()) continue;
    parCategorie.set(d.categorie, (parCategorie.get(d.categorie) ?? 0) + d.montant);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Ajouter une dépense</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categorie">Catégorie</Label>
                <select
                  id="categorie"
                  name="categorie"
                  defaultValue=""
                  required
                  className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {CATEGORIES_DEPENSE.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="libelle">Libellé</Label>
                <Input id="libelle" name="libelle" placeholder="Assurance RC Pro, tapis de sol…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="montant">Montant (€)</Label>
                <Input id="montant" name="montant" type="number" step="0.01" min="0" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer la dépense"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {parCategorie.size > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-sm font-semibold">Répartition {new Date().getFullYear()} — total {formatCurrency(totalAnnee)}</p>
            <div className="flex flex-col gap-2">
              {Array.from(parCategorie.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([categorie, montant]) => (
                  <div key={categorie} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{categorie}</span>
                    <span className="font-medium">{formatCurrency(montant)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold">Historique</p>
          {depenses.length === 0 ? (
            <p className="text-sm text-muted">Aucune dépense enregistrée pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depenses.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{formatDate(d.date)}</TableCell>
                    <TableCell>{d.categorie}</TableCell>
                    <TableCell>
                      {d.libelle}
                      {d.notes && <p className="text-xs text-muted">{d.notes}</p>}
                    </TableCell>
                    <TableCell>{formatCurrency(d.montant)}</TableCell>
                    <TableCell>
                      <form action={deleteDepense.bind(null, d.id)}>
                        <button
                          type="submit"
                          aria-label="Supprimer cette dépense"
                          className="rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </TableCell>
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
