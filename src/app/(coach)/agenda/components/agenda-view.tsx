"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSeanceStatut } from "../../patients/actions";
import {
  reserverCreneauPatientAction,
  reserverCreneauProspectAction,
  annulerCreneauProspectAction,
  confirmerCreneauProspectAction,
} from "../actions";
import {
  JOURS_SEMAINE,
  HEURES_AGENDA,
  cleJour,
  ajouterJours,
  parisHeureVersDate,
  jourParisCle,
  heureParis,
  type JourCalendaire,
} from "@/lib/agenda";
import { formatDate } from "@/lib/utils";

export interface HoraireAgenda {
  jour: number;
  actif: boolean;
  debut: string;
  fin: string;
}
export interface ExceptionnelAgenda {
  jourCle: string;
  debut: string;
  fin: string;
}
export interface SeanceAgenda {
  id: string;
  date: string;
  statut: string;
  patientNom: string;
  patientId: string;
}
export interface ProspectAgenda {
  id: string;
  nom: string;
  creneauPropose: string | null;
}
interface PersonneOption {
  id: string;
  nom: string;
  prenom?: string;
}

function heureDebut(horaire: string) {
  return Number(horaire.split(":")[0]);
}

export function AgendaView({
  lundi,
  horaires,
  exceptionnels,
  seances,
  prospects,
  patients,
  prospectsSansCreneau,
}: {
  lundi: JourCalendaire;
  horaires: HoraireAgenda[];
  exceptionnels: ExceptionnelAgenda[];
  seances: SeanceAgenda[];
  prospects: ProspectAgenda[];
  patients: PersonneOption[];
  prospectsSansCreneau: PersonneOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [selectedNew, setSelectedNew] = useState<{ jour: JourCalendaire; heure: number } | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<SeanceAgenda | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<ProspectAgenda | null>(null);
  const [choix, setChoix] = useState("");

  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i)), [lundi]);

  function naviguer(delta: number) {
    const cible = ajouterJours(lundi, delta * 7);
    router.push(`/agenda?semaine=${cleJour(cible)}`);
  }

  function aujourdHui() {
    router.push("/agenda");
  }

  const dimanche = ajouterJours(lundi, 6);

  function refermer() {
    setSelectedNew(null);
    setSelectedSeance(null);
    setSelectedProspect(null);
    setChoix("");
  }

  function confirmerNouveau() {
    if (!selectedNew || !choix) return;
    const date = parisHeureVersDate(selectedNew.jour, selectedNew.heure, 0);
    const [kind, id] = choix.split(":");
    startTransition(async () => {
      if (kind === "patient") {
        await reserverCreneauPatientAction(id, date.toISOString());
      } else if (kind === "prospect") {
        await reserverCreneauProspectAction(id, date.toISOString());
      }
      refermer();
      router.refresh();
    });
  }

  function marquer(statut: string) {
    if (!selectedSeance) return;
    startTransition(async () => {
      await updateSeanceStatut(selectedSeance.id, selectedSeance.patientId, statut);
      refermer();
      router.refresh();
    });
  }

  function annulerProspect() {
    if (!selectedProspect) return;
    startTransition(async () => {
      await annulerCreneauProspectAction(selectedProspect.id);
      refermer();
      router.refresh();
    });
  }

  function confirmerProspect() {
    if (!selectedProspect) return;
    startTransition(async () => {
      await confirmerCreneauProspectAction(selectedProspect.id);
      refermer();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => naviguer(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button type="button" onClick={aujourdHui} className="text-sm font-semibold hover:text-primary">
            Semaine du {formatDate(cleJour(lundi))} au {formatDate(cleJour(dimanche))}
          </button>
          <Button type="button" variant="outline" size="icon" onClick={() => naviguer(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <Legende couleur="border-primary bg-surface" label="Disponible" />
        <Legende couleur="border-primary bg-primary-soft" label="Planifiée" />
        <Legende couleur="border-transparent bg-success" labelClass="text-white" label="Faite" />
        <Legende couleur="border-danger border-dashed bg-surface-muted" label="Annulée" />
        <Legende couleur="border-accent bg-accent-soft" label="Créneau exceptionnel" />
        <Legende couleur="border-warning border-dashed bg-warning-soft" label="Prospect — à confirmer" />
        <Legende couleur="border-transparent bg-surface-muted" label="Hors horaires" />
      </div>
      <p className="text-xs text-muted">
        Un créneau « Prospect » n&rsquo;apparaît que dans l&rsquo;agenda, jamais sur le tableau de bord, tant qu&rsquo;il n&rsquo;est pas confirmé.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-14 border-b border-r border-border"></th>
                {jours.map((j, ji) => (
                  <th key={ji} className="border-b border-border px-1 py-2 text-center">
                    <div className="font-bold">{JOURS_SEMAINE[ji].slice(0, 3)}</div>
                    <div className="font-normal text-muted">{String(j.day).padStart(2, "0")}/{String(j.month).padStart(2, "0")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEURES_AGENDA.map((h) => (
                <tr key={h}>
                  <td className="border-b border-r border-border px-1 text-right align-top text-[10px] text-muted">{h}h</td>
                  {jours.map((jour, ji) => {
                    const horaireJour = horaires.find((ho) => ho.jour === ji);
                    const dansHoraires = !!horaireJour?.actif && h >= heureDebut(horaireJour.debut) && h < heureDebut(horaireJour.fin);
                    const jc = cleJour(jour);
                    const exceptionnel = exceptionnels.some((e) => e.jourCle === jc && h >= heureDebut(e.debut) && h < heureDebut(e.fin));

                    const seance = seances.find((s) => jourParisCle(new Date(s.date)) === jc && heureParis(new Date(s.date)) === h);
                    const prospect = !seance
                      ? prospects.find((p) => p.creneauPropose && jourParisCle(new Date(p.creneauPropose)) === jc && heureParis(new Date(p.creneauPropose)) === h)
                      : undefined;

                    let cellClass = "bg-surface-muted";
                    if (dansHoraires) cellClass = "bg-surface";
                    if (exceptionnel) cellClass = "bg-accent-soft";

                    let block: React.ReactNode = null;
                    let onClick: (() => void) | undefined;

                    if (seance) {
                      const statutClass =
                        seance.statut === "Faite"
                          ? "bg-success text-white border-transparent"
                          : seance.statut === "Annulée"
                            ? "bg-surface-muted text-danger border-dashed border-danger"
                            : "bg-primary-soft text-primary-hover border-primary";
                      block = (
                        <div className={`h-full truncate rounded-[4px] border px-1 py-0.5 text-[10px] font-semibold ${statutClass}`}>{seance.patientNom}</div>
                      );
                      onClick = () => {
                        refermer();
                        setSelectedSeance(seance);
                      };
                    } else if (prospect) {
                      block = (
                        <div className="h-full truncate rounded-[4px] border border-dashed border-warning bg-warning-soft px-1 py-0.5 text-[10px] font-semibold text-warning">
                          {prospect.nom}
                        </div>
                      );
                      onClick = () => {
                        refermer();
                        setSelectedProspect(prospect);
                      };
                    } else if (dansHoraires || exceptionnel) {
                      onClick = () => {
                        refermer();
                        setSelectedNew({ jour, heure: h });
                      };
                    }

                    return (
                      <td
                        key={ji}
                        onClick={onClick}
                        className={`h-9 border-b border-r border-border p-0.5 align-top ${cellClass} ${onClick ? "cursor-pointer" : ""}`}
                      >
                        {block}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedNew && (
        <Card className="border-primary">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">
                Nouveau rendez-vous — {JOURS_SEMAINE[jours.findIndex((j) => j.year === selectedNew.jour.year && j.month === selectedNew.jour.month && j.day === selectedNew.jour.day)] ?? ""}{" "}
                {String(selectedNew.jour.day).padStart(2, "0")}/{String(selectedNew.jour.month).padStart(2, "0")} à {selectedNew.heure}h00
              </span>
              <span className="text-xs text-muted">Créneau libre dans tes horaires de travail</span>
            </div>
            <select value={choix} onChange={(e) => setChoix(e.target.value)} className="h-9 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm">
              <option value="">Choisir un patient ou un prospect…</option>
              {patients.length > 0 && (
                <optgroup label="Patients">
                  {patients.map((p) => (
                    <option key={p.id} value={`patient:${p.id}`}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </optgroup>
              )}
              {prospectsSansCreneau.length > 0 && (
                <optgroup label="Prospects (pas encore patients)">
                  {prospectsSansCreneau.map((p) => (
                    <option key={p.id} value={`prospect:${p.id}`}>
                      {p.nom}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <Button type="button" variant="outline" onClick={refermer}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmerNouveau} disabled={!choix || pending}>
              {choix.startsWith("prospect:") ? "Proposer ce créneau" : "Créer le rendez-vous"}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedSeance && (
        <Card className="border-primary">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">{selectedSeance.patientNom}</span>
              <span className="text-xs text-muted">{seanceLabel(selectedSeance)}</span>
            </div>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={refermer}>
              Fermer
            </Button>
            <Button type="button" variant="outline" className="border-danger text-danger" onClick={() => marquer("Annulée")} disabled={pending}>
              Marquer annulée
            </Button>
            <Button type="button" onClick={() => marquer("Faite")} disabled={pending}>
              Marquer faite
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedProspect && (
        <Card className="border-warning">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">
                {selectedProspect.nom} <span className="font-semibold text-warning">· Prospect, pas encore patient</span>
              </span>
              <span className="text-xs text-muted">Ce créneau n&rsquo;apparaît que dans l&rsquo;agenda — rien sur le tableau de bord tant que ce n&rsquo;est pas confirmé</span>
            </div>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={refermer}>
              Fermer
            </Button>
            <Button type="button" variant="outline" className="border-danger text-danger" onClick={annulerProspect} disabled={pending}>
              Annuler (libère le créneau)
            </Button>
            <Button type="button" variant="outline" onClick={annulerProspect} disabled={pending}>
              Changer de créneau
            </Button>
            <Button type="button" onClick={confirmerProspect} disabled={pending}>
              Confirmer et convertir en patient
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function seanceLabel(s: SeanceAgenda) {
  if (s.statut === "Faite") return "Séance faite";
  if (s.statut === "Annulée") return "Séance annulée";
  return "Séance planifiée — à confirmer après la séance";
}

function Legende({ couleur, label, labelClass }: { couleur: string; label: string; labelClass?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-[3px] border ${couleur}`} />
      <span className={labelClass ?? "text-muted"}>{label}</span>
    </span>
  );
}
