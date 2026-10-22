"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marquerVisiteGuideeFaiteAction } from "@/app/(coach)/reglages/actions";

const ETAPES = [
  {
    emoji: "👋",
    titre: "Bienvenue dans EAPAS Suite",
    texte:
      "6 étapes, 2 minutes, pour repérer où se trouve chaque chose. Tu peux quitter à tout moment — rien n'est perdu, et tu pourras relancer cette visite depuis Réglages.",
  },
  {
    emoji: "🏠",
    titre: "Le Tableau de bord",
    texte:
      "Ton point de départ chaque jour : le bloc « Aujourd'hui » (séances, tickets SAV, bilans en retard), tes indicateurs de cohorte, et les alertes qui méritent un coup d'œil. La cloche en haut à droite reprend les mêmes alertes partout dans l'app.",
  },
  {
    emoji: "🗂️",
    titre: "Patients & clients",
    texte:
      "Le dossier complet de chaque patient : entretien initial, bilans avec graphiques d'évolution, objectifs SMART, séances, suivi. L'IA peut te proposer des brouillons (fiche de séance, observations de bilan, message) — c'est toujours toi qui relis et valides avant envoi.",
  },
  {
    emoji: "📅",
    titre: "L'Agenda",
    texte:
      "Vue semaine de tes disponibilités et rendez-vous. Clique un créneau libre pour planifier, clique une séance pour la modifier — y compris la reprogrammer : la disponibilité est vérifiée automatiquement et le patient est prévenu dans son espace + par email dès que tu valides.",
  },
  {
    emoji: "📞",
    titre: "Prospects",
    texte:
      "Chaque personne intéressée, avant de devenir patient : fiche d'appel guidée, proposition de créneau, puis conversion en un clic (le dossier patient et le premier rendez-vous sont créés ensemble). La recherche en haut de la liste permet de retrouver vite un prospect.",
  },
  {
    emoji: "🛡️",
    titre: "Une règle, partout dans l'app",
    texte:
      "L'IA propose toujours, elle n'envoie et n'invente jamais de chiffre seule — c'est ton clic sur « Valider » ou « Envoyer » qui déclenche quoi que ce soit. Réglages regroupe l'état de tes intégrations et tes sauvegardes. Tu es prêt·e !",
  },
];

export function VisiteGuideeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const etape = ETAPES[step];
  const dernierePage = step === ETAPES.length - 1;

  async function fermerEtMarquer() {
    setStep(0);
    onClose();
    await marquerVisiteGuideeFaiteAction();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-border bg-surface p-7 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <span className="text-2xl">{etape.emoji}</span>
          <button
            type="button"
            onClick={fermerEtMarquer}
            aria-label="Fermer la visite guidée"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 text-lg font-bold">{etape.titre}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{etape.texte}</p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {ETAPES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-primary" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fermerEtMarquer} className="text-xs font-medium text-muted hover:text-foreground">
              Passer
            </button>
            {step > 0 && (
              <Button type="button" size="sm" variant="outline" onClick={() => setStep((s) => s - 1)}>
                Précédent
              </Button>
            )}
            {!dernierePage ? (
              <Button type="button" size="sm" onClick={() => setStep((s) => Math.min(ETAPES.length - 1, s + 1))}>
                Suivant
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={fermerEtMarquer}>
                Terminer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
