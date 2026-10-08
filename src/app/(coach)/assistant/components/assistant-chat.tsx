"use client";

import { useActionState, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import { ficheSeanceToText } from "@/lib/fiche-seance";
import type { FicheSeance } from "@/lib/fiche-seance";
import { genererFicheSeanceAction, validerFicheSeanceAction, type GenererState, type ValiderState } from "../actions";
import { FicheSeanceCard } from "@/components/fiche-seance-card";

interface SeanceOption {
  id: string;
  date: string;
  type: string | null;
  format: string | null;
}

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  seances: SeanceOption[];
}

const initGenState: GenererState = {};
const initValState: ValiderState = {};

export function AssistantChat({ patients }: { patients: PatientOption[] }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [seanceId, setSeanceId] = useState("");
  const [genState, genAction, genPending] = useActionState(genererFicheSeanceAction, initGenState);
  const [valState, valAction, valPending] = useActionState(validerFicheSeanceAction, initValState);

  const [fiche, setFiche] = useState<FicheSeance | null>(null);
  const [editing, setEditing] = useState(false);
  const [texteEdite, setTexteEdite] = useState("");
  const [materiel, setMateriel] = useState("");

  // Dérive l'état local à partir du résultat des actions pendant le rendu plutôt que
  // dans un effet (évite un aller-retour de rendu supplémentaire).
  const [lastGenFiche, setLastGenFiche] = useState(genState.fiche);
  if (genState.fiche !== lastGenFiche) {
    setLastGenFiche(genState.fiche);
    if (genState.fiche) {
      setFiche(genState.fiche);
      setTexteEdite(ficheSeanceToText(genState.fiche));
      setMateriel(genState.fiche.materielNecessaire.join(", "));
      setEditing(false);
    }
  }

  const [lastValSuccess, setLastValSuccess] = useState(valState.success);
  if (valState.success !== lastValSuccess) {
    setLastValSuccess(valState.success);
    if (valState.success) setFiche(null);
  }

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="patientId">Patient</Label>
            <select
              id="patientId"
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setSeanceId("");
                setFiche(null);
              }}
              className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prenom} {p.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="seanceId">Séance à préparer</Label>
            <select
              id="seanceId"
              value={seanceId}
              onChange={(e) => setSeanceId(e.target.value)}
              className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
              disabled={!selectedPatient?.seances.length}
            >
              <option value="">— Choisir une séance planifiée —</option>
              {selectedPatient?.seances.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDateTime(new Date(s.date))} {s.type ? `· ${s.type}` : ""}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedPatient && selectedPatient.seances.length === 0 && (
        <p className="text-sm text-muted">
          Aucune séance planifiée pour ce patient. Crée-en une depuis sa fiche (onglet Séances) avant de demander une
          préparation.
        </p>
      )}

      <form action={genAction} className="flex flex-col gap-3">
        <input type="hidden" name="patientId" value={patientId} />
        <input type="hidden" name="seanceId" value={seanceId} />
        <Label htmlFor="consigne">Consigne pour l&rsquo;assistant (optionnel)</Label>
        <Textarea
          id="consigne"
          name="consigne"
          rows={2}
          placeholder="Ex : elle a eu une fatigue mardi mais pas de douleur, reste prudent sur les genoux."
        />
        {genState.error && <p className="text-sm text-danger">{genState.error}</p>}
        <div>
          <Button type="submit" disabled={genPending || !patientId || !seanceId}>
            {genPending ? "Génération…" : "Préparer cette séance"}
          </Button>
        </div>
      </form>

      {fiche && (
        <div className="flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-sm)] bg-accent-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
            Brouillon — pas encore enregistré
          </div>

          {!editing ? (
            <FicheSeanceCard fiche={fiche} />
          ) : (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  value={texteEdite}
                  onChange={(e) => setTexteEdite(e.target.value)}
                  rows={18}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="materiel">Matériel nécessaire (le patient en sera prévenu avant la séance)</Label>
            <Input id="materiel" value={materiel} onChange={(e) => setMateriel(e.target.value)} placeholder="Aucun" />
          </div>

          <form action={valAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="patientId" value={patientId} />
            <input type="hidden" name="seanceId" value={seanceId} />
            <input type="hidden" name="ficheJson" value={JSON.stringify(fiche)} />
            <input type="hidden" name="texteEdite" value={editing ? texteEdite : ""} />
            <input type="hidden" name="materielNecessaire" value={materiel} />
            <Button type="button" variant="outline" onClick={() => setEditing((v) => !v)}>
              {editing ? "Revenir à la fiche structurée" : "Modifier"}
            </Button>
            <Button type="submit" disabled={valPending}>
              {valPending ? "Enregistrement…" : "Valider et enregistrer dans le dossier"}
            </Button>
          </form>
          {valState.error && <p className="text-sm text-danger">{valState.error}</p>}
          {valState.success && <p className="text-sm text-success">{valState.success}</p>}
          <p className="text-xs text-muted">Cette fiche ne rejoint le dossier que si tu cliques sur « Valider ».</p>
        </div>
      )}
    </div>
  );
}
