"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ToggleActifButton } from "./toggle-actif-button";

export interface PrestationItem {
  id: string;
  nom: string;
  type: string;
  tarif: number;
  unite: string;
  inclusions: string | null;
  actif: boolean;
}

export function PrestationsList({ prestations }: { prestations: PrestationItem[] }) {
  const [filtre, setFiltre] = useState<string | null>(null);

  const typesAvecCompte = useMemo(() => {
    const parType = new Map<string, number>();
    prestations.forEach((p) => parType.set(p.type, (parType.get(p.type) ?? 0) + 1));
    return Array.from(parType.entries()).sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [prestations]);

  const visibles = filtre ? prestations.filter((p) => p.type === filtre) : prestations;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFiltre(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            filtre === null ? "bg-primary-soft text-primary-hover" : "border border-border text-muted hover:text-foreground"
          }`}
        >
          Toutes ({prestations.length})
        </button>
        {typesAvecCompte.map(([type, count]) => (
          <button
            key={type}
            type="button"
            onClick={() => setFiltre(type)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtre === type ? "bg-primary-soft text-primary-hover" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {type} ({count})
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">Aucune prestation dans ce type.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p) => (
            <Card key={p.id} className={p.actif ? "" : "opacity-55"}>
              <CardContent className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="w-fit rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-hover">
                    {p.type}
                  </span>
                  <span className={`text-[11px] font-semibold ${p.actif ? "text-success" : "text-muted"}`}>
                    {p.actif ? "● Actif" : "○ Inactif"}
                  </span>
                </div>
                <Link href={`/prestations/${p.id}`} className="text-base font-bold text-foreground hover:text-primary">
                  {p.nom}
                </Link>
                <p className="text-xl font-bold">
                  {formatCurrency(p.tarif)} <span className="text-xs font-medium text-muted">/ {p.unite}</span>
                </p>
                {p.inclusions && (
                  <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted">
                    {p.inclusions
                      .split("\n")
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                  </ul>
                )}
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/prestations/${p.id}`}>Modifier</Link>
                  </Button>
                  <ToggleActifButton prestationId={p.id} actif={p.actif} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
