"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Ligne {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export function LignesEditor({ initial }: { initial?: Ligne[] }) {
  const [lignes, setLignes] = useState<Ligne[]>(
    initial && initial.length > 0 ? initial : [{ designation: "", quantite: 1, prixUnitaire: 0 }]
  );

  const total = lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0), 0);

  function update(index: number, field: keyof Ligne, value: string) {
    setLignes((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, [field]: field === "designation" ? value : Number(value) || 0 } : l
      )
    );
  }

  function addLigne() {
    setLignes((prev) => [...prev, { designation: "", quantite: 1, prixUnitaire: 0 }]);
  }

  function removeLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Prestations</Label>
      {lignes.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px_100px_32px] items-end gap-2">
          <div className="flex flex-col gap-1">
            {i === 0 && <span className="text-xs text-muted">Désignation</span>}
            <Input
              name="ligne_designation"
              value={l.designation}
              onChange={(e) => update(i, "designation", e.target.value)}
              placeholder="Formule accompagnement APA — 4 séances/mois"
            />
          </div>
          <div className="flex flex-col gap-1">
            {i === 0 && <span className="text-xs text-muted">Qté</span>}
            <Input
              name="ligne_quantite"
              type="number"
              min={1}
              value={l.quantite}
              onChange={(e) => update(i, "quantite", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            {i === 0 && <span className="text-xs text-muted">Prix unit. €</span>}
            <Input
              name="ligne_prix"
              type="number"
              step="0.01"
              value={l.prixUnitaire}
              onChange={(e) => update(i, "prixUnitaire", e.target.value)}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeLigne(i)} disabled={lignes.length === 1}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addLigne} className="w-fit">
        <Plus className="h-4 w-4" /> Ajouter une ligne
      </Button>
      <div className="flex justify-end border-t border-border pt-3 text-sm font-semibold">
        Total : {formatCurrency(total)}
      </div>
    </div>
  );
}
