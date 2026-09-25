"use client";

import { useActionState, useRef } from "react";
import { createContrat, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

const initialState: ActionState = {};

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
}

interface ContratItem {
  id: string;
  numero: string;
  dateDebut: Date;
  tarif: number | null;
  statut: string;
  patient: { nom: string; prenom: string };
}

const PRESETS = {
  essentiel: {
    formule: "Formule 1 : Essentiel Santé & Forme",
    dureeMois: 3,
    frequenceSeances: "4 séances / mois (1/semaine)",
    tarif: 220,
    inclusions:
      "Bilan initial complet : évaluation fonctionnelle APA (tests de terrain) et diagnostic nutritionnel\n4 séances d'APA guidées par mois (1 séance/semaine)\n1 programme d'entraînement autonome personnalisé pour la pratique à domicile\nCoaching nutritionnel de base (repères PNNS/ANSES, conseils repas)\n1 entretien de suivi mensuel de 30 min (ajustement des objectifs SMART)",
  },
  premium: {
    formule: "Formule 2 : Premium Transformation & Suivi Intensif",
    dureeMois: 3,
    frequenceSeances: "8 séances / mois (2/semaine)",
    tarif: 350,
    inclusions:
      "Bilan initial & re-bilans mensuels approfondis (tests de marche 6 min, lever de chaise, diagnostic nutritionnel)\n8 séances d'APA guidées sur-mesure par mois (2 séances/semaine)\nPlan alimentaire personnalisé et évolutif (macronutriments, anti-grignotage)\nSuivi continu par messagerie dédiée (5j/7, réponse sous 24h)\nAteliers éducatifs thématiques (étiquettes, courses, sorties)",
  },
} as const;

export function ContratSection({ patients, contrats }: { patients: PatientOption[]; contrats: ContratItem[] }) {
  const [state, formAction, pending] = useActionState(createContrat, initialState);

  const formuleRef = useRef<HTMLInputElement>(null);
  const dureeRef = useRef<HTMLInputElement>(null);
  const frequenceRef = useRef<HTMLInputElement>(null);
  const tarifRef = useRef<HTMLInputElement>(null);
  const inclusionsRef = useRef<HTMLTextAreaElement>(null);

  function applyPreset(preset: {
    formule: string;
    dureeMois: number;
    frequenceSeances: string;
    tarif: number;
    inclusions: string;
  }) {
    if (formuleRef.current) formuleRef.current.value = preset.formule;
    if (dureeRef.current) dureeRef.current.value = String(preset.dureeMois);
    if (frequenceRef.current) frequenceRef.current.value = preset.frequenceSeances;
    if (tarifRef.current) tarifRef.current.value = String(preset.tarif);
    if (inclusionsRef.current) inclusionsRef.current.value = preset.inclusions;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Nouveau contrat de prestation</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => applyPreset(PRESETS.essentiel)}>
                  Préremplir « Essentiel » (220€)
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => applyPreset(PRESETS.premium)}>
                  Préremplir « Premium » (350€)
                </Button>
              </div>
            </div>
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
                <Input id="formule" name="formule" ref={formuleRef} placeholder="Formule 1 : Essentiel Santé & Forme" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dureeMois">Durée d&apos;engagement (mois)</Label>
                <Input id="dureeMois" name="dureeMois" ref={dureeRef} type="number" min={1} defaultValue={3} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="frequenceSeances">Fréquence des séances</Label>
                <Input id="frequenceSeances" name="frequenceSeances" ref={frequenceRef} placeholder="4 séances / mois" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarif">Tarif mensuel (€)</Label>
                <Input id="tarif" name="tarif" ref={tarifRef} type="number" step="0.01" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="modalitePaiement">Modalités de paiement</Label>
                <Input id="modalitePaiement" name="modalitePaiement" placeholder="Virement mensuel" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inclusions">Inclusions de la formule (une par ligne)</Label>
              <Textarea
                id="inclusions"
                name="inclusions"
                ref={inclusionsRef}
                rows={4}
                placeholder={
                  "Bilan initial complet (Ricci & Gagnon, tests de terrain) et diagnostic nutritionnel\n4 séances d'APA guidées par mois\n1 programme d'entraînement autonome\nCoaching nutritionnel de base (PNNS/ANSES)\n1 entretien de suivi mensuel de 30 min"
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conditionsAnnulation">Conditions d&apos;annulation</Label>
              <Textarea
                id="conditionsAnnulation"
                name="conditionsAnnulation"
                rows={2}
                placeholder="Toute séance annulée moins de 24h avant reste due, sauf cas de force majeure."
              />
            </div>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Création…" : "Créer le contrat"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {contrats.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tarif</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contrats.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.numero}</TableCell>
                <TableCell>
                  {c.patient.prenom} {c.patient.nom}
                </TableCell>
                <TableCell>{formatDate(c.dateDebut)}</TableCell>
                <TableCell>{c.tarif !== null ? formatCurrency(c.tarif) : "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.statut}</Badge>
                </TableCell>
                <TableCell>
                  <a href={`/api/documents/contrat/${c.id}`} target="_blank" rel="noopener noreferrer">
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
