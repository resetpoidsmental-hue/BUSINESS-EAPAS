import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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

export function ageFromDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
