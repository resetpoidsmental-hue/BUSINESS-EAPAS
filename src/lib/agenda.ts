/** Aide au calcul de dates pour l'Agenda — toujours en heure de Paris (le serveur tourne en UTC),
 * DST géré automatiquement via l'API Intl plutôt qu'un décalage fixe codé en dur. */

export const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const HEURES_AGENDA = Array.from({ length: 14 }, (_, i) => i + 7); // 7h à 20h

export interface JourCalendaire {
  year: number;
  month: number; // 1-12
  day: number;
}

export function cleJour({ year, month, day }: JourCalendaire): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function depuisCle(cle: string): JourCalendaire {
  const [year, month, day] = cle.split("-").map(Number);
  return { year, month, day };
}

export function ajouterJours({ year, month, day }: JourCalendaire, n: number): JourCalendaire {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + n);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Lundi de la semaine contenant `semaineParam` (clé "AAAA-MM-JJ"), ou la semaine en cours si absent/invalide. */
export function lundiDeLaSemaine(semaineParam?: string | null): JourCalendaire {
  let base: JourCalendaire;
  if (semaineParam && /^\d{4}-\d{2}-\d{2}$/.test(semaineParam)) {
    base = depuisCle(semaineParam);
  } else {
    const now = new Date();
    const cle = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    base = depuisCle(cle);
  }
  const d = new Date(Date.UTC(base.year, base.month - 1, base.day));
  const dow = d.getUTCDay(); // 0 = dimanche
  const diff = dow === 0 ? -6 : 1 - dow;
  return ajouterJours(base, diff);
}

/** Convertit une heure murale Europe/Paris en instant UTC équivalent (DST géré automatiquement). */
export function parisHeureVersDate({ year, month, day }: JourCalendaire, heure: number, minute = 0): Date {
  const utcGuess = Date.UTC(year, month - 1, day, heure, minute);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = fmt.formatToParts(new Date(utcGuess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const heureVue = get("hour") % 24;
  const shownAsUTC = Date.UTC(get("year"), get("month") - 1, get("day"), heureVue, get("minute"));
  const offset = shownAsUTC - utcGuess;
  return new Date(utcGuess - offset);
}

/** Jour (clé "AAAA-MM-JJ") d'une date, en heure de Paris. */
export function jourParisCle(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Heure (0-23) d'une date, en heure de Paris. */
export function heureParis(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  return Number(h) % 24;
}

/**
 * Parse la valeur brute d'un <input type="datetime-local"> ("AAAA-MM-JJTHH:mm") comme une heure
 * murale Europe/Paris plutôt que l'heure locale du serveur (le conteneur tourne en UTC — sans ça,
 * "15:30" saisi par le coach serait enregistré comme 15:30 UTC, soit 17:30 à Paris). Renvoie null
 * si la valeur est vide ou mal formée.
 */
export function parseDatetimeLocalParis(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [year, month, day, heure, minute] = m.slice(1).map(Number);
  return parisHeureVersDate({ year, month, day }, heure, minute);
}
