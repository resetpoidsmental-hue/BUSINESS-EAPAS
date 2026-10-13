"use client";

import { useState } from "react";
import Link from "next/link";
import { dupliquerModeleRationAction, supprimerModeleRationAction } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface ModeleItem {
  id: string;
  nom: string;
  targetKcal: number;
  pctP: number;
  pctL: number;
  pctG: number;
  updatedAt: string;
}

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
}

export function BibliothequeRations({ modeles, patients }: { modeles: ModeleItem[]; patients: PatientOption[] }) {
  const [query, setQuery] = useState("");

  const filtered = modeles.filter((m) => !query.trim() || m.nom.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-sm)] bg-primary-soft px-4 py-2.5 text-sm font-medium text-primary">
        Ces modèles sont construits par toi — l&apos;IA n&apos;intervient jamais dans leur contenu.
      </div>

      <Input
        placeholder="Rechercher un modèle…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            {modeles.length === 0
              ? "Aucun modèle pour le moment — crée ton premier modèle de ration."
              : `Aucun modèle ne correspond à « ${query} ».`}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <Link href={`/nutrition/rations/${m.id}`} className="font-medium hover:text-primary">
                  {m.nom}
                </Link>
                <div className="text-2xl font-semibold">
                  {m.targetKcal} <span className="text-sm font-medium text-muted">kcal / jour</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full bg-[#2563eb]" style={{ width: `${m.pctP}%` }} />
                  <div className="h-full bg-[#d97706]" style={{ width: `${m.pctL}%` }} />
                  <div className="h-full bg-[#16a34a]" style={{ width: `${m.pctG}%` }} />
                </div>
                <p className="text-xs text-muted">
                  P {m.pctP} % · L {m.pctL} % · G {m.pctG} %
                </p>
                <p className="text-xs text-muted">Modifié le {formatDate(new Date(m.updatedAt))}</p>

                <form action={dupliquerModeleRationAction} className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <input type="hidden" name="modeleId" value={m.id} />
                  <select
                    name="patientId"
                    required
                    defaultValue=""
                    className="h-9 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
                  >
                    <option value="" disabled>
                      Dupliquer pour…
                    </option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.prenom} {p.nom}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Dupliquer
                  </Button>
                </form>
                <form action={supprimerModeleRationAction.bind(null, m.id, null)}>
                  <Button type="submit" size="sm" variant="ghost" className="text-danger hover:text-danger">
                    Supprimer ce modèle
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
