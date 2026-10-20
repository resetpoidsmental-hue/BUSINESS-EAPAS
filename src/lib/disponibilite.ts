import { prisma } from "@/lib/db";
import { jourParisCle, heureParis, parisHeureVersDate } from "@/lib/agenda";

function heureDebut(horaire: string) {
  return Number(horaire.split(":")[0]);
}

/** 0 = Lundi … 6 = Dimanche, à partir d'une clé "AAAA-MM-JJ" (même convention que HoraireTravail.jour). */
function jourSemaineLundi0(jc: string): number {
  const [y, m, d] = jc.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

/** CreneauExceptionnel.date est stocké en minuit UTC "pur" (new Date("AAAA-MM-JJ")), jamais
 * converti depuis l'heure de Paris — on garde cette même convention ici pour rester cohérent
 * avec le reste de l'Agenda (voir ajouterCreneauExceptionnelAction). */
function minuitUTC(jc: string): Date {
  const [y, m, d] = jc.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export interface DisponibiliteCreneau {
  disponible: boolean;
  conflit: boolean;
}

/**
 * Vérifie si un instant donné (granularité à l'heure, comme le reste de l'Agenda) est libre :
 * ni déjà pris par une autre séance, et dans les horaires de travail ou un créneau exceptionnel
 * déjà déclaré. Ne décide jamais d'inventer une disponibilité — se base uniquement sur ce qui
 * est réellement enregistré.
 */
export async function verifierDisponibilite(date: Date, excludeSeanceId?: string): Promise<DisponibiliteCreneau> {
  const jc = jourParisCle(date);
  const h = heureParis(date);
  const [y, m, d] = jc.split("-").map(Number);
  const jourCal = { year: y, month: m, day: d };
  const debutJour = parisHeureVersDate(jourCal, 0, 0);
  const finJour = parisHeureVersDate(jourCal, 23, 59);

  const debutJourUTC = minuitUTC(jc);
  const finJourUTC = new Date(debutJourUTC.getTime() + 24 * 60 * 60 * 1000);

  const [seancesDuJour, horaireJour, exceptionnelsDuJour] = await Promise.all([
    prisma.seance.findMany({
      where: {
        date: { gte: debutJour, lte: finJour },
        statut: { not: "Annulée" },
        ...(excludeSeanceId ? { id: { not: excludeSeanceId } } : {}),
      },
      select: { id: true, date: true },
    }),
    prisma.horaireTravail.findFirst({ where: { jour: jourSemaineLundi0(jc) } }),
    prisma.creneauExceptionnel.findMany({ where: { date: { gte: debutJourUTC, lt: finJourUTC } } }),
  ]);

  const conflit = seancesDuJour.some((s) => heureParis(s.date) === h);
  const dansHoraireNormal = !!horaireJour?.actif && h >= heureDebut(horaireJour.debut) && h < heureDebut(horaireJour.fin);
  const dansExceptionnel = exceptionnelsDuJour.some((e) => h >= heureDebut(e.debut) && h < heureDebut(e.fin));

  return { disponible: !conflit && (dansHoraireNormal || dansExceptionnel), conflit };
}

/** Déclare un créneau exceptionnel d'une heure (ex. 18h-19h) pour le jour de `date`. */
export async function declarerCreneauExceptionnel(date: Date, note?: string) {
  const jc = jourParisCle(date);
  const h = heureParis(date);

  await prisma.creneauExceptionnel.create({
    data: {
      date: minuitUTC(jc),
      debut: `${String(h).padStart(2, "0")}:00`,
      fin: `${String(h + 1).padStart(2, "0")}:00`,
      note: note ?? "Ajouté depuis Telegram",
    },
  });
}
