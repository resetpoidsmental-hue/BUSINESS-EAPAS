"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  suggererResumeAppelAction,
  enregistrerAppelProspectAction,
  type ResumeAppelState,
  type ActionState,
} from "../actions";
import { SCRIPT_APPEL } from "@/lib/script-vente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CalendarDays } from "lucide-react";

const DRAFT_KEY = "eapas-fiche-appel-brouillon";

interface Brouillon {
  nom: string;
  email: string;
  telephone: string;
  source: string;
  checked: Record<string, boolean>;
  responses: Record<string, string>;
  notesLibres: string;
}

function chargerBrouillon(): Brouillon | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Brouillon) : null;
  } catch {
    return null;
  }
}

const initialResumeState: ResumeAppelState = {};
const initialSaveState: ActionState = {};

const SOURCES_SUGGEREES = [
  "Site vitrine",
  "Réseaux sociaux",
  "Parrainage",
  "Partenariat médical",
  "Publicité payante",
  "Newsletter / Email",
  "Événement / atelier",
  "En réel",
  "Autre",
];

function assemblerNotes(
  responses: Record<string, string>,
  notesLibres: string
): string {
  const lignes: string[] = [];
  SCRIPT_APPEL.forEach((etape, si) => {
    etape.lignes.forEach((ligne, li) => {
      const val = responses[`${si}-${li}`];
      if (val && val.trim()) lignes.push(`${etape.titre} — ${ligne.prompt} : ${val.trim()}`);
    });
  });
  if (notesLibres.trim()) lignes.push(`Notes libres : ${notesLibres.trim()}`);
  return lignes.join("\n");
}

export function FicheAppel() {
  const router = useRouter();

  // Restauré une seule fois, de façon synchrone (pas d'effet) : évite de perdre les notes
  // en changeant d'onglet, en cas de coupure réseau ou de fermeture accidentelle.
  const [brouillonInitial] = useState<Brouillon | null>(() => (typeof window === "undefined" ? null : chargerBrouillon()));
  const brouillonRestaure = !!brouillonInitial;

  const [checked, setChecked] = useState<Record<string, boolean>>(() => brouillonInitial?.checked ?? {});
  const [responses, setResponses] = useState<Record<string, string>>(() => brouillonInitial?.responses ?? {});
  const [notesLibres, setNotesLibres] = useState(() => brouillonInitial?.notesLibres ?? "");

  const [nom, setNom] = useState(() => brouillonInitial?.nom ?? "");
  const [email, setEmail] = useState(() => brouillonInitial?.email ?? "");
  const [telephone, setTelephone] = useState(() => brouillonInitial?.telephone ?? "");
  const [source, setSource] = useState(() => brouillonInitial?.source ?? "");

  const [resumeState, resumeFormAction, resumePending] = useActionState(suggererResumeAppelAction, initialResumeState);
  const [saveState, saveFormAction, savePending] = useActionState(enregistrerAppelProspectAction, initialSaveState);

  const totalLignes = SCRIPT_APPEL.reduce((s, e) => s + e.lignes.length, 0);
  const doneLignes = Object.values(checked).filter(Boolean).length;

  const premierRendu = useRef(true);

  // Sauvegarde continue du brouillon : aucune saisie n'est perdue en changeant d'onglet ou en cas de coupure.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    try {
      const brouillon: Brouillon = { nom, email, telephone, source, checked, responses, notesLibres };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(brouillon));
    } catch {
      // stockage indisponible (navigation privée, quota…) : on continue sans bloquer la saisie
    }
  }, [nom, email, telephone, source, checked, responses, notesLibres]);

  function effacerBrouillon() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }

  function toggle(key: string) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }

  function handleResumer() {
    const fd = new FormData();
    fd.set("notesTexte", assemblerNotes(responses, notesLibres));
    resumeFormAction(fd);
  }

  return (
    <div className="flex flex-col gap-5">
      {brouillonRestaure && (
        <div className="rounded-[var(--radius-sm)] border border-primary/30 bg-primary-soft px-4 py-2 text-sm text-primary-hover">
          Brouillon restauré automatiquement — tes notes précédentes n&rsquo;ont pas été perdues.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Tes notes sont sauvegardées automatiquement au fil de la saisie.</p>
        <Link
          href="/agenda"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
        >
          <CalendarDays className="h-4 w-4" />
          Voir l&rsquo;agenda pour un créneau précis
        </Link>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appel-nom">Nom du prospect</Label>
            <Input id="appel-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appel-email">Email</Label>
            <Input id="appel-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appel-telephone">Téléphone</Label>
            <Input id="appel-telephone" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Source</Label>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES_SUGGEREES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    source === s ? "border-primary bg-primary-soft text-primary-hover" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[460px_1fr]">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Script — coche au fil de l&rsquo;eau</p>
              <span className="text-xs text-muted">
                {doneLignes} / {totalLignes}
              </span>
            </div>
            {SCRIPT_APPEL.map((etape, si) => {
              const etapeDone = etape.lignes.every((_, li) => checked[`${si}-${li}`]);
              return (
                <div key={etape.titre} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        etapeDone ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted"
                      }`}
                    >
                      {si + 1}
                    </span>
                    <span className="text-sm font-bold">{etape.titre}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pl-7">
                    {etape.lignes.map((ligne, li) => {
                      const key = `${si}-${li}`;
                      const done = !!checked[key];
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggle(key)}
                          className={`flex items-start gap-2 rounded-[var(--radius-sm)] p-1.5 text-left transition-colors ${
                            done ? "bg-primary-soft" : "hover:bg-surface-muted"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border-2 ${
                              done ? "border-primary bg-primary" : "border-border bg-surface"
                            }`}
                          >
                            {done && <span className="h-1.5 w-1.5 rounded-sm bg-primary-foreground" />}
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className={`text-xs leading-snug ${ligne.script ? "font-semibold" : ""} ${done ? "text-muted" : "text-foreground"}`}>
                              {ligne.label}
                            </span>
                            {ligne.script && <span className="text-[11px] italic leading-snug text-muted">{ligne.script}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Tes notes, en direct — une ligne par question du script</p>
              {SCRIPT_APPEL.map((etape, si) => (
                <div key={etape.titre} className="flex flex-col gap-2">
                  <span className="text-xs font-bold">
                    {si + 1}. {etape.titre}
                  </span>
                  {etape.lignes.map((ligne, li) => {
                    const key = `${si}-${li}`;
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted">{ligne.prompt}</span>
                        <input
                          type="text"
                          value={responses[key] ?? ""}
                          onChange={(e) => setResponses((r) => ({ ...r, [key]: e.target.value }))}
                          className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">Notes libres</span>
                <Textarea rows={3} value={notesLibres} onChange={(e) => setNotesLibres(e.target.value)} placeholder="Tout le reste…" />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleResumer} disabled={resumePending}>
                  <Sparkles className="h-4 w-4" />
                  {resumePending ? "Génération…" : "Résumer avec l'IA"}
                </Button>
              </div>
              {resumeState.error && <p className="text-sm text-danger">{resumeState.error}</p>}
            </CardContent>
          </Card>

          {resumeState.resume && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                <p className="text-sm font-bold">Résumé structuré — à relire avant d&rsquo;enregistrer</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase text-muted">Objectif exprimé</span>
                    <span className="text-sm">{resumeState.resume.objectif || "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase text-muted">Disponibilités</span>
                    <span className="text-sm">{resumeState.resume.disponibilites || "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase text-muted">Objection principale</span>
                    <span className="text-sm">{resumeState.resume.objectionPrincipale || "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase text-muted">Prestation suggérée</span>
                    <span className="text-sm font-semibold">{resumeState.resume.prestationSuggereeNom || "—"}</span>
                  </div>
                  <div className="col-span-full flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase text-muted">Prochaine étape</span>
                    <span className="text-sm">{resumeState.resume.prochaineEtape || "—"}</span>
                  </div>
                </div>
                <p className="text-xs text-muted">Généré à partir de tes notes tapées, jamais inventé.</p>
              </CardContent>
            </Card>
          )}

          <form
            action={(fd) => {
              fd.set("nom", nom);
              fd.set("email", email);
              fd.set("telephone", telephone);
              fd.set("source", source);
              fd.set("notesTexte", assemblerNotes(responses, notesLibres));
              fd.set("prestationSuggereeNom", resumeState.resume?.prestationSuggereeNom ?? "");
              effacerBrouillon();
              saveFormAction(fd);
            }}
            className="flex flex-col gap-2"
          >
            {saveState.error && <p className="text-sm text-danger">{saveState.error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/prospects")}>
                Annuler
              </Button>
              <Button type="submit" disabled={savePending || !nom.trim() || !source.trim()}>
                {savePending ? "Enregistrement…" : "Enregistrer dans Prospects"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
