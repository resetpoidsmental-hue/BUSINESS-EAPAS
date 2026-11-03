"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Plus, Sparkles, Pencil, Trash2, FileText } from "lucide-react";
import {
  addBilanNutrition,
  updateBilanNutrition,
  deleteBilanNutrition,
  genererProgrammeNutritionnelAction,
  enregistrerProgrammeNutritionnelAction,
  type ActionState,
  type ProgrammeNutritionState,
} from "../../actions";
import { dupliquerModeleRationAction } from "../../../nutrition/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculerBilanNutritionnel, NIVEAUX_ACTIVITE, OBJECTIFS_PONDERAUX, type Sexe } from "@/lib/calculs";
import { formatDate, formatNumber } from "@/lib/utils";

const initialState: ActionState = {};
const initProgrammeGenState: ProgrammeNutritionState = {};
const initProgrammeSaveState: ProgrammeNutritionState = {};

interface ProgrammeNutritionnel {
  contenu: string;
  statut: string;
  livreLe: Date | null;
}

const PROGRAMME_STATUT_VARIANT: Record<string, "success" | "warning" | "default"> = {
  Brouillon: "default",
  Validé: "warning",
  Livré: "success",
};

function ProgrammeNutritionCard({
  patientId,
  programme,
  iaDisponible,
  patientADesEmail,
}: {
  patientId: string;
  programme: ProgrammeNutritionnel | null;
  iaDisponible: boolean;
  patientADesEmail: boolean;
}) {
  const [genState, genFormAction, genPending] = useActionState(
    genererProgrammeNutritionnelAction.bind(null, patientId),
    initProgrammeGenState
  );
  const [saveState, saveFormAction, savePending] = useActionState(
    enregistrerProgrammeNutritionnelAction.bind(null, patientId),
    initProgrammeSaveState
  );

  const [contenu, setContenu] = useState(programme?.contenu ?? "");

  const [lastGen, setLastGen] = useState(genState.programme);
  if (genState.programme !== lastGen) {
    setLastGen(genState.programme);
    if (genState.programme) setContenu(genState.programme);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Programme nutrition personnalisé</p>
          </div>
          {programme && <Badge variant={PROGRAMME_STATUT_VARIANT[programme.statut] ?? "muted"}>{programme.statut}</Badge>}
        </div>

        {programme?.livreLe && (
          <p className="text-xs text-muted">Livré au patient le {formatDate(programme.livreLe)}.</p>
        )}

        <form action={genFormAction}>
          <Button type="submit" size="sm" variant="outline" disabled={genPending || !iaDisponible}>
            <Sparkles className="h-3.5 w-3.5" />
            {genPending ? "Génération…" : contenu ? "Régénérer avec l'IA" : "Générer avec l'IA"}
          </Button>
          {!iaDisponible && <p className="mt-1.5 text-xs text-muted">Assistant IA non configuré.</p>}
          {genState.error && <p className="mt-1.5 text-sm text-danger">{genState.error}</p>}
        </form>

        <Textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={14}
          placeholder="Génère un programme avec l'IA, ou rédige-le toi-même ici."
          className="font-mono text-xs"
        />

        <form action={saveFormAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="contenu" value={contenu} />
          <Button type="submit" size="sm" variant="outline" disabled={savePending || !contenu}>
            Enregistrer comme brouillon
          </Button>
          <Button
            type="submit"
            size="sm"
            name="envoyer"
            value="1"
            disabled={savePending || !contenu || !patientADesEmail}
            title={!patientADesEmail ? "Ce patient n'a pas d'email enregistré." : undefined}
          >
            Valider et envoyer au patient
          </Button>
        </form>
        {saveState.error && <p className="text-sm text-danger">{saveState.error}</p>}
        {saveState.success && <p className="text-sm text-success">{saveState.success}</p>}
        <p className="text-xs text-muted">
          L&rsquo;envoi déclenche un email au patient avec le programme, et le rend visible dans son espace personnel.
        </p>
      </CardContent>
    </Card>
  );
}

interface Bilan {
  id: string;
  date: Date;
  poids: number;
  taille: number;
  tourDeTaille: number | null;
  age: number;
  sexe: string;
  nap: number;
  objectifPonderal: string;
  imc: number;
  classificationIMC: string;
  apportCalorique: number;
  apportProteines: number;
  apportLipides: number;
  apportGlucides: number;
  hydratation: number;
}

interface ModeleRationItem {
  id: string;
  nom: string;
  targetKcal: number;
  partageLe: Date | null;
  updatedAt: Date;
}

interface ModeleBibliothequeOption {
  id: string;
  nom: string;
}

export function NutritionPatientSection({
  patientId,
  bilans,
  defaultAge,
  defaultSexe,
  modeles,
  modelesBibliotheque,
  programme,
  iaDisponible,
  patientADesEmail,
}: {
  patientId: string;
  bilans: Bilan[];
  defaultAge?: number | null;
  defaultSexe?: string | null;
  modeles: ModeleRationItem[];
  modelesBibliotheque: ModeleBibliothequeOption[];
  programme: ProgrammeNutritionnel | null;
  iaDisponible: boolean;
  patientADesEmail: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const action = editingId
    ? updateBilanNutrition.bind(null, editingId, patientId)
    : addBilanNutrition.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const defaultForm = {
    poids: 0,
    taille: 0,
    tourDeTaille: 0,
    age: defaultAge ?? 0,
    sexe: (defaultSexe === "F" ? "F" : "H") as Sexe,
    nap: 1.375,
    objectifPonderal: "maintien",
  };
  const [form, setForm] = useState(defaultForm);

  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.success && editingId) {
      setEditingId(null);
      setForm(defaultForm);
    }
  }

  function startEdit(b: Bilan) {
    setEditingId(b.id);
    setForm({
      poids: b.poids,
      taille: b.taille,
      tourDeTaille: b.tourDeTaille ?? 0,
      age: b.age,
      sexe: b.sexe === "F" ? "F" : "H",
      nap: b.nap,
      objectifPonderal: b.objectifPonderal,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
  }

  const preview = useMemo(() => {
    if (!form.poids || !form.taille || !form.age) return null;
    return calculerBilanNutritionnel({
      poidsKg: form.poids,
      tailleCm: form.taille,
      age: form.age,
      sexe: form.sexe,
      nap: form.nap,
      objectifPonderal: form.objectifPonderal,
    });
  }, [form]);

  return (
    <div className="flex flex-col gap-6">
      <ProgrammeNutritionCard
        patientId={patientId}
        programme={programme}
        iaDisponible={iaDisponible}
        patientADesEmail={patientADesEmail}
      />

      <Card>
        <CardContent className="p-5">
          <form key={editingId ?? "new"} action={formAction} className="flex flex-col gap-5">
            <p className="text-sm font-semibold">
              {editingId ? "Modifier le bilan nutritionnel" : "Calculateur nutritionnel (Mifflin-St Jeor)"}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumField label="Poids (kg)" name="poids" value={form.poids} onChange={(v) => setForm((f) => ({ ...f, poids: v }))} />
              <NumField label="Taille (cm)" name="taille" value={form.taille} onChange={(v) => setForm((f) => ({ ...f, taille: v }))} />
              <NumField label="Âge (ans)" name="age" value={form.age} onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
              <NumField
                label="Tour de taille (cm)"
                name="tourDeTaille"
                value={form.tourDeTaille}
                onChange={(v) => setForm((f) => ({ ...f, tourDeTaille: v }))}
                optional
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sexe">Sexe</Label>
                <select
                  id="sexe"
                  name="sexe"
                  value={form.sexe}
                  onChange={(e) => setForm((f) => ({ ...f, sexe: e.target.value as Sexe }))}
                  className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
                >
                  <option value="H">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nap">Niveau d&apos;activité</Label>
                <select
                  id="nap"
                  name="nap"
                  value={form.nap}
                  onChange={(e) => setForm((f) => ({ ...f, nap: Number(e.target.value) }))}
                  className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
                >
                  {NIVEAUX_ACTIVITE.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:max-w-md">
              <Label htmlFor="objectifPonderal">Objectif pondéral</Label>
              <select
                id="objectifPonderal"
                name="objectifPonderal"
                value={form.objectifPonderal}
                onChange={(e) => setForm((f) => ({ ...f, objectifPonderal: e.target.value }))}
                className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
              >
                {OBJECTIFS_PONDERAUX.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {preview && (
              <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-4 sm:grid-cols-4">
                <Stat label="IMC" value={`${formatNumber(preview.imc)}`} sub={preview.classificationIMC} />
                <Stat label="Métabolisme de base" value={`${formatNumber(preview.metabolismeBase, 0)} kcal`} />
                <Stat label="Dépense totale" value={`${formatNumber(preview.depenseTotale, 0)} kcal`} />
                <Stat label="Apport cible" value={`${formatNumber(preview.apportCalorique, 0)} kcal`} />
                <Stat label="Protéines" value={`${formatNumber(preview.apportProteines, 0)} g`} />
                <Stat label="Lipides" value={`${formatNumber(preview.apportLipides, 0)} g`} />
                <Stat label="Glucides" value={`${formatNumber(preview.apportGlucides, 0)} g`} />
                <Stat label="Hydratation" value={`${formatNumber(preview.hydratation, 2)} L/j`} sub="+0,5L les jours de séance" />
              </div>
            )}

            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}

            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Enregistrer le bilan nutritionnel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {bilans.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Poids</TableHead>
              <TableHead>IMC</TableHead>
              <TableHead>Apport cible</TableHead>
              <TableHead>Protéines</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bilans.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatDate(b.date)}</TableCell>
                <TableCell>{formatNumber(b.poids)} kg</TableCell>
                <TableCell>
                  {formatNumber(b.imc)} — {b.classificationIMC}
                </TableCell>
                <TableCell>{formatNumber(b.apportCalorique, 0)} kcal</TableCell>
                <TableCell>{formatNumber(b.apportProteines, 0)} g</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label="Modifier ce bilan"
                      onClick={() => startEdit(b)}
                      className="rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <form action={deleteBilanNutrition.bind(null, b.id, patientId)}>
                      <button
                        type="submit"
                        aria-label="Supprimer ce bilan"
                        className="rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-surface-muted hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Modèles de ration</p>
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/nutrition/rations/nouveau?patientId=${patientId}${bilans[0] ? `&targetKcal=${Math.round(bilans[0].apportCalorique)}` : ""}`}
              >
                <Plus className="h-3.5 w-3.5" /> Nouveau modèle pour ce patient
              </Link>
            </Button>
          </div>

          {modelesBibliotheque.length > 0 && (
            <form action={dupliquerModeleRationAction} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] bg-surface-muted p-3">
              <input type="hidden" name="patientId" value={patientId} />
              <span className="text-xs text-muted">Depuis la bibliothèque :</span>
              <select
                name="modeleId"
                required
                defaultValue=""
                className="h-9 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
              >
                <option value="" disabled>
                  Choisir un modèle…
                </option>
                {modelesBibliotheque.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="outline">
                Attribuer
              </Button>
            </form>
          )}

          {modeles.length === 0 ? (
            <p className="text-sm text-muted">Aucun modèle de ration pour ce patient pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {modeles.map((m) => (
                <Link
                  key={m.id}
                  href={`/nutrition/rations/${m.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border p-3 text-sm hover:bg-surface-muted"
                >
                  <div>
                    <p className="font-medium">{m.nom}</p>
                    <p className="text-xs text-muted">{m.targetKcal} kcal/j · modifié le {formatDate(m.updatedAt)}</p>
                  </div>
                  <Badge variant={m.partageLe ? "success" : "muted"}>
                    {m.partageLe ? `Envoyé le ${formatDate(m.partageLe)}` : "Non envoyé"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5" /> Ouvre un modèle pour proposer un menu avec l&apos;IA à partir de la
            ration validée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NumField({
  label,
  name,
  value,
  onChange,
  optional,
}: {
  label: string;
  name: string;
  value?: number;
  onChange?: (v: number) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label} {!optional && <span className="text-danger">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        step="0.1"
        defaultValue={value || undefined}
        onChange={onChange ? (e) => onChange(Number(e.target.value) || 0) : undefined}
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-base font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
