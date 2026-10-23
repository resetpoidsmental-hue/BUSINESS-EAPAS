"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Formule } from "@/lib/types";
import {
  OBJECTIFS,
  calculerScoreIPAQ,
  messagePersonnalise,
  objectifLabel,
  recommanderFormule,
  type ObjectifValue,
} from "@/lib/ipaq";
import { submitQuizLead } from "@/app/quiz/actions";

const JOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];
const MINUTE_OPTIONS = [10, 20, 30, 45, 60, 90, 120];

type Activite = {
  key: "marche" | "mod" | "vig";
  emoji: string;
  titre: string;
  question: string;
};

const ACTIVITES: Activite[] = [
  {
    key: "marche",
    emoji: "🚶",
    titre: "La marche",
    question: "Combien de jours par semaine marchez-vous au moins 10 minutes d'affilée ?",
  },
  {
    key: "mod",
    emoji: "🚴",
    titre: "Activité modérée",
    question: "Vélo, natation tranquille, ménage actif… combien de jours par semaine ?",
  },
  {
    key: "vig",
    emoji: "🔥",
    titre: "Activité intense",
    question: "Course, sport collectif, cardio soutenu… combien de jours par semaine ?",
  },
];

type Reponses = {
  marcheJours: number;
  marcheMinutes: number;
  modJours: number;
  modMinutes: number;
  vigJours: number;
  vigMinutes: number;
  objectif: ObjectifValue | null;
  prenom: string;
  email: string;
};

const INITIAL: Reponses = {
  marcheJours: 0,
  marcheMinutes: 0,
  modJours: 0,
  modMinutes: 0,
  vigJours: 0,
  vigMinutes: 0,
  objectif: null,
  prenom: "",
  email: "",
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[42px] min-w-[42px] items-center justify-center rounded-lg border px-3.5 text-sm font-semibold transition ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-ink hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}

export function Quiz({ formules }: { formules: Formule[] }) {
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Reponses>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showProgress = step >= 1 && step <= 5;
  const progressPercent = Math.round((step / 5) * 100);

  const currentActivite = step >= 1 && step <= 3 ? ACTIVITES[step - 1] : null;
  const joursKey = currentActivite ? (`${currentActivite.key}Jours` as const) : null;
  const minutesKey = currentActivite ? (`${currentActivite.key}Minutes` as const) : null;

  let canAdvance = true;
  if (step === 4) canAdvance = !!r.objectif;
  if (step === 5) canAdvance = r.prenom.trim().length > 0 && /\S+@\S+\.\S+/.test(r.email);

  let nextLabel = "Suivant";
  if (step === 0) nextLabel = "Commencer le quiz";
  if (step === 5) nextLabel = pending ? "Envoi…" : "Voir mon résultat";

  const resultat =
    step === 6 && r.objectif
      ? (() => {
          const { score, classification } = calculerScoreIPAQ({
            marcheJours: r.marcheJours,
            marcheMinutes: r.marcheMinutes,
            modJours: r.modJours,
            modMinutes: r.modMinutes,
            vigJours: r.vigJours,
            vigMinutes: r.vigMinutes,
            objectif: r.objectif,
          });
          const formule = recommanderFormule(formules, classification, r.objectif);
          return {
            score,
            classification,
            message: messagePersonnalise(classification, r.objectif),
            formule,
          };
        })()
      : null;

  function onNext() {
    if (!canAdvance) return;
    if (step === 5) {
      setSubmitError(null);
      startTransition(async () => {
        const classificationData = calculerScoreIPAQ({
          marcheJours: r.marcheJours,
          marcheMinutes: r.marcheMinutes,
          modJours: r.modJours,
          modMinutes: r.modMinutes,
          vigJours: r.vigJours,
          vigMinutes: r.vigMinutes,
          objectif: r.objectif!,
        });
        const formule = recommanderFormule(formules, classificationData.classification, r.objectif!);
        const res = await submitQuizLead({
          nom: r.prenom,
          email: r.email,
          classification: classificationData.classification,
          score: classificationData.score,
          objectifLabel: objectifLabel(r.objectif!),
          formuleNom: formule?.Nom ?? null,
        });
        if (res.status === "error") {
          setSubmitError(res.message ?? "Une erreur est survenue.");
          return;
        }
        setStep(6);
      });
      return;
    }
    setStep((s) => Math.min(6, s + 1));
  }

  function onPrecedent() {
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setR(INITIAL);
    setSubmitError(null);
    setStep(0);
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[28px] border border-border bg-surface p-7 shadow-sm sm:p-9">
      {showProgress && (
        <div className="mb-7 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Étape {step} sur 5</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <span className="text-3xl">🏃</span>
          <p className="font-display text-xl font-semibold text-ink">On commence ?</p>
          <p className="text-sm leading-relaxed text-muted">
            On vous pose quelques questions sur votre activité physique actuelle et
            votre objectif. À la fin, vous recevez votre score et une recommandation
            personnalisée — sans engagement.
          </p>
        </div>
      )}

      {currentActivite && joursKey && minutesKey && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl">{currentActivite.emoji}</span>
            <p className="font-display text-lg font-semibold text-ink">{currentActivite.titre}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-ink">{currentActivite.question}</p>
            <div className="flex flex-wrap gap-2">
              {JOUR_OPTIONS.map((j) => (
                <Chip
                  key={j}
                  label={String(j)}
                  selected={r[joursKey] === j}
                  onClick={() => setR((prev) => ({ ...prev, [joursKey]: j, [minutesKey]: j === 0 ? 0 : prev[minutesKey] }))}
                />
              ))}
            </div>
          </div>
          {r[joursKey] > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-sm font-semibold text-ink">
                Combien de minutes, en moyenne, ces jours-là ?
              </p>
              <div className="flex flex-wrap gap-2">
                {MINUTE_OPTIONS.map((m) => (
                  <Chip
                    key={m}
                    label={`${m} min`}
                    selected={r[minutesKey] === m}
                    onClick={() => setR((prev) => ({ ...prev, [minutesKey]: m }))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="font-display text-lg font-semibold text-ink">
            Quel est votre objectif principal ?
          </p>
          <div className="flex flex-col gap-2.5">
            {OBJECTIFS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setR((prev) => ({ ...prev, objectif: o.value }))}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                  r.objectif === o.value
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <span className="text-xl">{o.emoji}</span>
                <span className="text-sm font-semibold text-ink">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <p className="font-display text-lg font-semibold text-ink">
            Dernière étape : où envoyer votre bilan ?
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Utilisées uniquement pour vous transmettre votre résultat et, si vous le
            souhaitez, vous recontacter. Jamais partagées à des tiers.
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Votre prénom"
              value={r.prenom}
              onChange={(e) => setR((prev) => ({ ...prev, prenom: e.target.value }))}
              className="h-[46px] rounded-lg border border-border bg-surface px-3.5 text-sm text-ink outline-none focus:border-primary"
            />
            <input
              type="email"
              placeholder="Votre email"
              value={r.email}
              onChange={(e) => setR((prev) => ({ ...prev, email: e.target.value }))}
              className="h-[46px] rounded-lg border border-border bg-surface px-3.5 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          {submitError && (
            <p className="rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">{submitError}</p>
          )}
        </div>
      )}

      {step === 6 && resultat && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span
              className={`inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-xs font-bold ${
                resultat.classification === "Élevé"
                  ? "bg-primary-soft text-primary"
                  : "bg-accent-soft text-accent"
              }`}
            >
              Niveau d&rsquo;activité : {resultat.classification}
            </span>
            <p className="font-display text-lg font-semibold text-ink">
              Merci {r.prenom}, voici votre bilan
            </p>
            <p className="text-sm leading-relaxed text-muted">{resultat.message}</p>
          </div>

          {resultat.formule && (
            <div className="rounded-2xl border border-primary/30 bg-primary-soft p-5">
              <span className="text-xs font-bold uppercase tracking-wide text-primary/80">
                Formule recommandée pour vous
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold text-ink">
                  {resultat.formule.Nom}
                </span>
                <span className="text-sm font-semibold text-muted">
                  {resultat.formule.Prix}€{resultat.formule.Unite}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {resultat.formule.DescriptionCourte}
              </p>
            </div>
          )}

          <Link
            href="/contact"
            className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Réserver mon appel découverte gratuit (15 min)
          </Link>
          <button
            type="button"
            onClick={restart}
            className="self-center text-sm font-semibold text-muted underline-offset-2 hover:underline"
          >
            Refaire le quiz
          </button>
        </div>
      )}

      {step < 6 && (
        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={onPrecedent}
              className="h-10 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:border-primary/50"
            >
              Précédent
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!canAdvance || pending}
            onClick={onNext}
            className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
