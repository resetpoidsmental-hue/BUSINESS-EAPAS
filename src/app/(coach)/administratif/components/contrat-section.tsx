"use client";

import { useActionState, useRef, useState } from "react";
import {
  createContrat,
  genererConditionsAnnulationAction,
  type ActionState,
  type ConditionsAnnulationState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download, Sparkles, LayoutGrid } from "lucide-react";
import type { PrestationCatalogue } from "./lignes-editor";

const initialState: ActionState = {};
const initialConditionsState: ConditionsAnnulationState = {};

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

export function ContratSection({
  patients,
  contrats,
  prestations,
}: {
  patients: PatientOption[];
  contrats: ContratItem[];
  prestations: PrestationCatalogue[];
}) {
  const [state, formAction, pending] = useActionState(createContrat, initialState);
  const [conditionsState, conditionsFormAction, conditionsPending] = useActionState(
    genererConditionsAnnulationAction,
    initialConditionsState
  );

  const formuleRef = useRef<HTMLInputElement>(null);
  const descriptionFormuleRef = useRef<HTMLTextAreaElement>(null);
  const dureeRef = useRef<HTMLInputElement>(null);
  const frequenceRef = useRef<HTMLInputElement>(null);
  const tarifRef = useRef<HTMLInputElement>(null);
  const inclusionsRef = useRef<HTMLTextAreaElement>(null);
  const conditionsRef = useRef<HTMLTextAreaElement>(null);

  const [catalogueOuvert, setCatalogueOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");

  function appliquerPrestation(p: PrestationCatalogue) {
    if (formuleRef.current) formuleRef.current.value = p.nom;
    if (descriptionFormuleRef.current) descriptionFormuleRef.current.value = p.descriptionMarketing ?? "";
    if (tarifRef.current) tarifRef.current.value = String(p.tarif);
    if (inclusionsRef.current) inclusionsRef.current.value = "";
    setCatalogueOuvert(false);
    setRecherche("");
  }

  function demanderConditions() {
    const fd = new FormData();
    fd.set("formule", formuleRef.current?.value ?? "");
    fd.set("dureeMois", dureeRef.current?.value ?? "");
    fd.set("tarif", tarifRef.current?.value ?? "");
    conditionsFormAction(fd);
  }

  function utiliserConditions() {
    if (conditionsRef.current && conditionsState.conditions) {
      conditionsRef.current.value = conditionsState.conditions;
    }
  }

  const prestationsFiltrees = prestations.filter((p) => `${p.nom} ${p.type}`.toLowerCase().includes(recherche.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="flex flex-col gap-4">
            <p className="text-sm font-semibold">Nouveau contrat de prestation</p>

            {prestations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">
                    Choisir une prestation du catalogue (optionnel — pré-remplit les champs ci-dessous)
                  </span>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setCatalogueOuvert((v) => !v)}>
                    <LayoutGrid className="h-3.5 w-3.5" /> Catalogue {catalogueOuvert ? "▴" : "▾"}
                  </Button>
                </div>
                {catalogueOuvert && (
                  <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-primary bg-surface p-2.5">
                    <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher une prestation…" className="mb-1 h-8" />
                    <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
                      {prestationsFiltrees.length === 0 && <p className="p-1.5 text-xs text-muted">Aucune prestation active ne correspond.</p>}
                      {prestationsFiltrees.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => appliquerPrestation(p)}
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
                  </div>
                )}
              </div>
            )}

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
              <Label htmlFor="descriptionFormule">Description de la formule (Article 1 du contrat)</Label>
              <p className="text-xs text-muted">Détaille ce que le Client souscrit — pré-rempli en choisissant une prestation du catalogue, modifiable.</p>
              <Textarea
                id="descriptionFormule"
                name="descriptionFormule"
                ref={descriptionFormuleRef}
                rows={3}
                placeholder="Un accompagnement mensuel sur-mesure…"
              />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="conditionsAnnulation">Conditions d&apos;annulation</Label>
                <Button type="button" size="sm" variant="secondary" onClick={demanderConditions} disabled={conditionsPending}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {conditionsPending ? "Génération…" : "Assistant IA — proposer un texte"}
                </Button>
              </div>
              <Textarea
                id="conditionsAnnulation"
                name="conditionsAnnulation"
                ref={conditionsRef}
                rows={2}
                placeholder="Toute séance annulée moins de 24h avant reste due, sauf cas de force majeure."
              />
              {conditionsState.error && <p className="text-sm text-danger">{conditionsState.error}</p>}
              {conditionsState.conditions && (
                <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-dashed border-primary bg-primary-soft/40 p-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-wide text-primary">Proposition IA</span>
                  </div>
                  <p className="text-xs leading-snug text-foreground">{conditionsState.conditions}</p>
                  <p className="text-[11px] italic text-muted">
                    Rédigé à partir de la formule et de la durée choisies — à relire avant signature, jamais envoyé sans ta validation.
                  </p>
                  <div>
                    <Button type="button" size="sm" onClick={utiliserConditions}>
                      Utiliser cette proposition
                    </Button>
                  </div>
                </div>
              )}
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
