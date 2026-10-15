"use client";

import { useActionState, useTransition } from "react";
import {
  demarrerEnregistrementCarteAction,
  demarrerMiseAJourCarteAction,
  suspendrePrelevementAction,
  type PaiementActionState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CreditCard } from "lucide-react";

const initialState: PaiementActionState = {};

interface AbonnementInfo {
  formule: string;
  montantMensuel: number;
  prochainPaiement: string | null;
  prelevementActif: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMois: number | null;
  cardExpAnnee: number | null;
  moyenPaiementEnregistre: boolean;
}

export function PaiementActions({ abonnement }: { abonnement: AbonnementInfo }) {
  const [enregistrerState, enregistrerFormAction, enregistrerPending] = useActionState(
    demarrerEnregistrementCarteAction,
    initialState
  );
  const [majState, majFormAction, majPending] = useActionState(demarrerMiseAJourCarteAction, initialState);
  const [suspendPending, startSuspend] = useTransition();

  if (!abonnement.moyenPaiementEnregistre) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold">{abonnement.formule}</p>
              <p className="text-sm text-muted">
                {formatCurrency(abonnement.montantMensuel)} / mois
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning">
              Moyen de paiement non enregistré
            </span>
          </div>
          <p className="text-sm text-foreground">
            Pour activer les prélèvements automatiques de ton abonnement, enregistre ta carte (ou ton IBAN) via un
            formulaire sécurisé Stripe — rien ne transite ni n&rsquo;est stocké par Santé &amp; Co.
          </p>
          <form action={enregistrerFormAction}>
            <Button type="submit" disabled={enregistrerPending}>
              <CreditCard className="h-4 w-4" />
              {enregistrerPending ? "Redirection…" : "Enregistrer mon moyen de paiement et payer ce mois-ci"}
            </Button>
          </form>
          {enregistrerState.error && <p className="text-sm text-danger">{enregistrerState.error}</p>}
          <p className="text-xs text-muted">Tu seras redirigé(e) vers une page de paiement sécurisée Stripe, puis ramené(e) ici.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={abonnement.prelevementActif ? "border-primary" : undefined}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold">{abonnement.formule}</p>
            <p className="text-sm text-muted">{formatCurrency(abonnement.montantMensuel)} / mois</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
              abonnement.prelevementActif ? "bg-primary-soft text-primary-hover" : "bg-surface-muted text-muted"
            }`}
          >
            {abonnement.prelevementActif ? "● Prélèvement automatique actif" : "○ Prélèvement suspendu"}
          </span>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-muted" />
            <div>
              <p className="text-sm font-semibold">
                {abonnement.cardBrand ? abonnement.cardBrand.toUpperCase() : "Carte"} •••• {abonnement.cardLast4 ?? "····"}
              </p>
              {abonnement.cardExpMois && abonnement.cardExpAnnee && (
                <p className="text-xs text-muted">
                  Expire {String(abonnement.cardExpMois).padStart(2, "0")}/{String(abonnement.cardExpAnnee).slice(-2)}
                </p>
              )}
            </div>
          </div>
          {abonnement.prochainPaiement && (
            <div>
              <p className="text-sm font-semibold">Prochain prélèvement</p>
              <p className="text-xs text-muted">
                {formatDate(abonnement.prochainPaiement)} — {formatCurrency(abonnement.montantMensuel)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={majFormAction}>
            <Button type="submit" variant="outline" size="sm" disabled={majPending}>
              {majPending ? "Redirection…" : "Modifier ma carte"}
            </Button>
          </form>
          {abonnement.prelevementActif && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-danger"
              disabled={suspendPending}
              onClick={() => startSuspend(() => suspendrePrelevementAction())}
            >
              {suspendPending ? "…" : "Suspendre le prélèvement"}
            </Button>
          )}
        </div>
        {majState.error && <p className="text-sm text-danger">{majState.error}</p>}
      </CardContent>
    </Card>
  );
}
