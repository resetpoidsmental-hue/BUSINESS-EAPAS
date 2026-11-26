import { telegramDisponible, envoyerMessageTelegram } from "@/lib/telegram";
import { construireBilanHebdo, semainePrecedente } from "@/lib/bilan-hebdo";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Envoie par Telegram le bilan de la semaine qui vient de se terminer (appelé le lundi matin). */
export async function envoyerBilanHebdoTelegram() {
  if (!telegramDisponible()) return;

  const bilan = await construireBilanHebdo(semainePrecedente());

  const lignes = [
    `📊 Bilan de la semaine du ${formatDate(bilan.debut)} au ${formatDate(bilan.fin)}`,
    "",
    `💶 CA encaissé : ${formatCurrency(bilan.commercial.caEncaisse)} · Dépenses : ${formatCurrency(bilan.commercial.depenses)} · Bénéfice brut : ${formatCurrency(bilan.commercial.beneficeBrut)}`,
    `📋 ${bilan.commercial.facturesPayeesCount} facture${bilan.commercial.facturesPayeesCount > 1 ? "s" : ""} payée${bilan.commercial.facturesPayeesCount > 1 ? "s" : ""}`,
    `👥 Prospects : ${bilan.prospects.nouveaux} nouveau${bilan.prospects.nouveaux > 1 ? "x" : ""}, ${bilan.prospects.convertis} converti${bilan.prospects.convertis > 1 ? "s" : ""}`,
    `⚠️ ${bilan.alertesCount} alerte${bilan.alertesCount > 1 ? "s" : ""} à traiter en ce moment`,
  ];

  if (bilan.trafic) {
    lignes.push(`🌐 Site : ${bilan.trafic.stats.visits} visite${bilan.trafic.stats.visits > 1 ? "s" : ""}, ${bilan.trafic.stats.pageviews} page${bilan.trafic.stats.pageviews > 1 ? "s" : ""} vue${bilan.trafic.stats.pageviews > 1 ? "s" : ""}`);
    if (bilan.trafic.topPages[0]?.x) {
      lignes.push(`   Page la plus vue : ${bilan.trafic.topPages[0].x} (${bilan.trafic.topPages[0].y})`);
    }
  }

  await envoyerMessageTelegram(lignes.join("\n"));
}
