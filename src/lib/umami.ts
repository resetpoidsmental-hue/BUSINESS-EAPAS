/**
 * Client minimal pour l'API REST d'un Umami auto-hébergé (v2). Un nouveau jeton est demandé à
 * chaque appel plutôt que mis en cache : ce module n'est utilisé qu'une poignée de fois par
 * semaine (bilan hebdo), la simplicité l'emporte sur l'économie d'un aller-retour réseau.
 */

export function umamiDisponible() {
  return Boolean(process.env.UMAMI_URL && process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_USERNAME && process.env.UMAMI_PASSWORD);
}

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

interface UmamiMetric {
  x: string | null;
  y: number;
}

export interface ResumeTraficSemaine {
  stats: UmamiStats;
  topPages: UmamiMetric[];
  topReferrers: UmamiMetric[];
}

async function obtenirJetonUmami(): Promise<string> {
  const url = process.env.UMAMI_URL;
  if (!url) throw new Error("UMAMI_URL manquant dans l'environnement.");

  const reponse = await fetch(`${url.replace(/\/$/, "")}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: process.env.UMAMI_USERNAME, password: process.env.UMAMI_PASSWORD }),
  });
  if (!reponse.ok) throw new Error(`Échec de connexion à Umami (${reponse.status}).`);
  const data = (await reponse.json()) as { token?: string; requiresTwoFactor?: boolean };
  if (data.requiresTwoFactor) {
    throw new Error("Le compte Umami utilisé a la double authentification activée — utilise un compte sans 2FA pour cette intégration.");
  }
  if (!data.token) throw new Error("Réponse Umami inattendue : aucun jeton reçu.");
  return data.token;
}

async function appelApiUmami<T>(chemin: string, params: Record<string, string>): Promise<T> {
  const url = process.env.UMAMI_URL!.replace(/\/$/, "");
  const jeton = await obtenirJetonUmami();
  const qs = new URLSearchParams(params).toString();
  const reponse = await fetch(`${url}${chemin}?${qs}`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!reponse.ok) throw new Error(`Échec de l'appel à l'API Umami (${reponse.status}) sur ${chemin}.`);
  return (await reponse.json()) as T;
}

/** Résumé du trafic du site vitrine sur une période donnée (bornes incluses). */
export async function obtenirResumeTraficSemaine(debut: Date, fin: Date): Promise<ResumeTraficSemaine> {
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!websiteId) throw new Error("UMAMI_WEBSITE_ID manquant dans l'environnement.");

  const params = { startAt: String(debut.getTime()), endAt: String(fin.getTime()) };
  const chemin = `/api/websites/${websiteId}`;

  const [stats, topPages, topReferrers] = await Promise.all([
    appelApiUmami<UmamiStats>(`${chemin}/stats`, params),
    appelApiUmami<UmamiMetric[]>(`${chemin}/metrics`, { ...params, type: "path", limit: "5" }),
    appelApiUmami<UmamiMetric[]>(`${chemin}/metrics`, { ...params, type: "referrer", limit: "5" }),
  ]);

  return { stats, topPages, topReferrers };
}
