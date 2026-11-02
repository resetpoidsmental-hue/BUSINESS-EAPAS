import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatHeure(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatDateHeureParis(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Clé "AAAA-MM-JJ" d'une date dans le fuseau du coach (le serveur tourne en UTC). */
export function dateKeyParis(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatNumber(n: number | null | undefined, decimals = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimals }).format(n);
}

export function initials(nom: string, prenom?: string | null) {
  const a = prenom?.[0] ?? "";
  const b = nom?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

/**
 * Ajoute un mois à une date sans dérive : `setMonth` seul décale un 31 janvier
 * au 3 mars (février n'a pas de 31e jour), et l'erreur s'accumule à chaque
 * cycle de facturation — ce helper reste ancré sur le dernier jour du mois
 * suivant quand le jour d'origine n'existe pas.
 */
export function ajouterUnMois(date: Date) {
  const jour = date.getDate();
  const resultat = new Date(date);
  resultat.setDate(1);
  resultat.setMonth(resultat.getMonth() + 1);
  const dernierJourDuMoisSuivant = new Date(resultat.getFullYear(), resultat.getMonth() + 1, 0).getDate();
  resultat.setDate(Math.min(jour, dernierJourDuMoisSuivant));
  return resultat;
}

export function ageFromDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
