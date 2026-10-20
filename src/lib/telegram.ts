export function telegramDisponible() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export interface TelegramBouton {
  texte: string;
  callbackData: string;
}

function apiUrl(methode: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN manquant dans l'environnement.");
  return `https://api.telegram.org/bot${token}/${methode}`;
}

/**
 * Envoie un message au coach sur Telegram, avec d'éventuels boutons (une ligne de boutons par
 * sous-tableau de `lignesBoutons`). N'est jamais appelé automatiquement par l'IA — uniquement en
 * réaction à un événement réel (rappel planifié, fiche validée) ou à une action du coach.
 */
export async function envoyerMessageTelegram(texte: string, lignesBoutons?: TelegramBouton[][]) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID manquant dans l'environnement.");

  const body: Record<string, unknown> = { chat_id: chatId, text: texte };
  if (lignesBoutons && lignesBoutons.length > 0) {
    body.reply_markup = {
      inline_keyboard: lignesBoutons.map((ligne) => ligne.map((b) => ({ text: b.texte, callback_data: b.callbackData }))),
    };
  }

  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Échec de l'envoi Telegram : ${res.status} ${await res.text()}`);
}

/** Enlève le petit indicateur de chargement sur le bouton tapé, avec un texte optionnel en toast. */
export async function repondreCallbackTelegram(callbackQueryId: string, texte?: string) {
  await fetch(apiUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: texte }),
  });
}
