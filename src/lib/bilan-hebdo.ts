import { prisma } from "@/lib/db";
import { lundiDeLaSemaine, ajouterJours, parisHeureVersDate, cleJour } from "@/lib/agenda";
import { getAlertesActives } from "@/lib/notifications";
import { umamiDisponible, obtenirResumeTraficSemaine, type ResumeTraficSemaine } from "@/lib/umami";

export interface BilanHebdo {
  lundiCle: string;
  debut: Date;
  fin: Date;
  commercial: {
    caEncaisse: number;
    depenses: number;
    beneficeBrut: number;
    facturesPayeesCount: number;
  };
  prospects: {
    nouveaux: number;
    convertis: number;
  };
  alertesCount: number;
  trafic: ResumeTraficSemaine | null;
  traficDisponible: boolean;
}

/**
 * Assemble le bilan d'une semaine (lundi 00:00 à dimanche 23:59:59, heure de Paris). `semaineParam`
 * est la clé "AAAA-MM-JJ" d'un jour de cette semaine (typiquement son lundi) ; vide = semaine en
 * cours. Le trafic Umami est optionnel : une erreur ou une configuration absente ne bloque jamais
 * le reste du bilan, qui reste utilisable sans lui.
 */
export async function construireBilanHebdo(semaineParam?: string | null): Promise<BilanHebdo> {
  const lundi = lundiDeLaSemaine(semaineParam);
  const debut = parisHeureVersDate(lundi, 0, 0);
  const finExclusive = parisHeureVersDate(ajouterJours(lundi, 7), 0, 0);

  const [factures, depenses, prospectsNouveaux, prospectsConvertis, alertes] = await Promise.all([
    prisma.facture.findMany({ where: { statut: "Payée", datePaiement: { gte: debut, lt: finExclusive } }, select: { total: true } }),
    prisma.depense.findMany({ where: { date: { gte: debut, lt: finExclusive } }, select: { montant: true } }),
    prisma.prospect.count({ where: { createdAt: { gte: debut, lt: finExclusive } } }),
    prisma.prospect.count({ where: { statut: "Converti", updatedAt: { gte: debut, lt: finExclusive } } }),
    getAlertesActives(),
  ]);

  const caEncaisse = factures.reduce((s, f) => s + f.total, 0);
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);

  let trafic: ResumeTraficSemaine | null = null;
  if (umamiDisponible()) {
    try {
      trafic = await obtenirResumeTraficSemaine(debut, new Date(finExclusive.getTime() - 1));
    } catch (e) {
      console.error("Erreur récupération trafic Umami pour le bilan hebdo:", e);
    }
  }

  return {
    lundiCle: cleJour(lundi),
    debut,
    fin: new Date(finExclusive.getTime() - 1),
    commercial: {
      caEncaisse,
      depenses: totalDepenses,
      beneficeBrut: caEncaisse - totalDepenses,
      facturesPayeesCount: factures.length,
    },
    prospects: { nouveaux: prospectsNouveaux, convertis: prospectsConvertis },
    alertesCount: alertes.length,
    trafic,
    traficDisponible: umamiDisponible(),
  };
}

/** Clé "AAAA-MM-JJ" du lundi de la semaine précédant celle de `semaineCle` (ou la semaine en cours si absente). */
export function semainePrecedente(semaineCle?: string | null): string {
  return cleJour(ajouterJours(lundiDeLaSemaine(semaineCle), -7));
}

/** Clé "AAAA-MM-JJ" du lundi de la semaine suivant celle de `semaineCle`. */
export function semaineSuivante(semaineCle?: string | null): string {
  return cleJour(ajouterJours(lundiDeLaSemaine(semaineCle), 7));
}
