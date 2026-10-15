"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, LayoutGrid } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Ligne {
  designation: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
}

export interface PrestationCatalogue {
  id: string;
  nom: string;
  type: string;
  tarif: number;
  unite: string;
  descriptionMarketing: string | null;
}

export function LignesEditor({ initial, prestations }: { initial?: Ligne[]; prestations?: PrestationCatalogue[] }) {
  const [lignes, setLignes] = useState<Ligne[]>(
    initial && initial.length > 0 ? initial : [{ designation: "", description: "", quantite: 1, prixUnitaire: 0 }]
  );
  const [catalogueOuvert, setCatalogueOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");

  const total = lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0), 0);

  function update(index: number, field: keyof Ligne, value: string) {
    setLignes((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, [field]: field === "designation" || field === "description" ? value : Number(value) || 0 } : l
      )
    );
  }

  function addLigne() {
    setLignes((prev) => [...prev, { designation: "", description: "", quantite: 1, prixUnitaire: 0 }]);
  }

  function removeLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  function ajouterDepuisCatalogue(p: PrestationCatalogue) {
    setLignes((prev) => {
      const vide = prev.length === 1 && !prev[0].designation.trim() ? prev.slice(1) : prev;
      return [...vide, { designation: p.nom, description: p.descriptionMarketing ?? "", quantite: 1, prixUnitaire: p.tarif }];
    });
    setCatalogueOuvert(false);
    setRecherche("");
  }

  const prestationsFiltrees = (prestations ?? []).filter((p) =>
    `${p.nom} ${p.type}`.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3">
      <Label>Prestations</Label>
      {lignes.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px_100px_32px] items-start gap-2">
          <div className="flex flex-col gap-1">
            {i === 0 && <span className="text-xs text-muted">Désignation</span>}
            <Input
              name="ligne_designation"
              value={l.designation}
              onChange={(e) => update(i, "designation", e.target.value)}
              placeholder="Formule accompagnement APA — 4 séances/mois"
            />
            <textarea
              name="ligne_description"
              value={l.description}
              onChange={(e) => update(i, "description", e.target.value)}
              placeholder="Description pour le client (optionnel)…"
              rows={2}
              className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2.5 py-1.5 text-xs text-muted"
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

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={addLigne} className="w-fit">
          <Plus className="h-4 w-4" /> Ajouter une ligne libre
        </Button>
        {prestations && prestations.length > 0 && (
          <Button type="button" size="sm" className="w-fit" onClick={() => setCatalogueOuvert((v) => !v)}>
            <LayoutGrid className="h-4 w-4" /> Depuis le catalogue {catalogueOuvert ? "▴" : "▾"}
          </Button>
        )}
      </div>

      {catalogueOuvert && (
        <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-primary bg-surface p-2.5">
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une prestation…"
            className="mb-1 h-8"
          />
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            {prestationsFiltrees.length === 0 && <p className="p-1.5 text-xs text-muted">Aucune prestation active ne correspond.</p>}
            {prestationsFiltrees.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => ajouterDepuisCatalogue(p)}
                className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-primary-soft"
              >
                <span className="text-xs text-foreground">
                  {p.nom} <span className="text-muted">· {p.type}</span>
                </span>
                <span className="text-xs font-bold text-primary-hover">
                  {formatCurrency(p.tarif)} / {p.unite}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">Seules les prestations actives apparaissent ici. La ligne reste modifiable après ajout.</p>
        </div>
      )}

      <div className="flex justify-end border-t border-border pt-3 text-sm font-semibold">
        Total : {formatCurrency(total)}
      </div>
    </div>
  );
}
