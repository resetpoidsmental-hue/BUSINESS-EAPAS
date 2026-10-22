export interface IntegrationStatus {
  nom: string;
  description: string;
  configuree: boolean;
  variables: string;
}

/** Statut présent/absent de chaque intégration optionnelle — jamais les clés elles-mêmes. */
export function statutIntegrations(): IntegrationStatus[] {
  return [
    {
      nom: "Assistant IA (Anthropic)",
      description: "Fiches de séance, objectifs SMART, observations de bilan, réponses SAV.",
      configuree: Boolean(process.env.ANTHROPIC_API_KEY),
      variables: "ANTHROPIC_API_KEY",
    },
    {
      nom: "Email (Resend)",
      description: "Reçus de paiement, notifications de séance, réponses SAV.",
      configuree: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      variables: "RESEND_API_KEY, RESEND_FROM_EMAIL",
    },
    {
      nom: "Paiements (Stripe)",
      description: "Prélèvements automatiques des abonnements — voir le README, section « Facturation récurrente ».",
      configuree: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      variables: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET",
    },
    {
      nom: "Telegram",
      description: "Rappels de séance et actions rapides (annuler/déplacer) — voir le README, section « Rappels Telegram ».",
      configuree: Boolean(
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && process.env.TELEGRAM_WEBHOOK_SECRET
      ),
      variables: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET",
    },
  ];
}

export function auMoinsUneIntegrationConfiguree(): boolean {
  return statutIntegrations().some((i) => i.configuree);
}
