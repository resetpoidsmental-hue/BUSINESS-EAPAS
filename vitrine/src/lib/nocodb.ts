import { ARTICLES_SECOURS, FORMULES_SECOURS } from "./fallback-content";
import type { Article, Formule } from "./types";

const NOCODB_URL = process.env.NOCODB_URL?.replace(/\/$/, "");
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_BASE_NAME = process.env.NOCODB_BASE_NAME || "EAPAS Vitrine";

const isConfigured = Boolean(NOCODB_URL && NOCODB_API_TOKEN);

let tableIdsPromise: Promise<Record<string, string>> | null = null;

async function nocodbFetch(path: string) {
  const res = await fetch(`${NOCODB_URL}${path}`, {
    headers: { "xc-token": NOCODB_API_TOKEN! },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`NocoDB ${path} -> ${res.status}`);
  }
  return res.json();
}

async function resolveTableIds(): Promise<Record<string, string>> {
  const bases = await nocodbFetch("/api/v2/meta/bases");
  const base = (bases.list ?? []).find(
    (b: { id: string; title: string }) => b.title === NOCODB_BASE_NAME
  );
  if (!base) {
    throw new Error(`Base NocoDB "${NOCODB_BASE_NAME}" introuvable`);
  }
  const tables = await nocodbFetch(`/api/v2/meta/bases/${base.id}/tables`);
  const ids: Record<string, string> = {};
  for (const t of tables.list ?? []) {
    ids[t.title] = t.id;
  }
  return ids;
}

async function getTableId(name: string): Promise<string | null> {
  if (!isConfigured) return null;
  if (!tableIdsPromise) tableIdsPromise = resolveTableIds();
  try {
    const ids = await tableIdsPromise;
    return ids[name] ?? null;
  } catch {
    tableIdsPromise = null;
    return null;
  }
}

async function fetchRecords<T>(
  tableName: string,
  params: string
): Promise<T[] | null> {
  const tableId = await getTableId(tableName);
  if (!tableId) return null;
  try {
    const data = await nocodbFetch(`/api/v2/tables/${tableId}/records?${params}`);
    return (data.list ?? []) as T[];
  } catch {
    return null;
  }
}

export async function getFormules(): Promise<Formule[]> {
  const rows = await fetchRecords<Formule>(
    "Formules",
    "where=(Statut,eq,Actif)&sort=Ordre&limit=50"
  );
  return rows && rows.length > 0 ? rows : FORMULES_SECOURS;
}

export async function getFormuleBySlug(slug: string): Promise<Formule | null> {
  const formules = await getFormules();
  return formules.find((f) => f.Slug === slug) ?? null;
}

export async function getArticles(categorie?: string): Promise<Article[]> {
  const filter = categorie
    ? `where=(Statut,eq,Publié)~and(Categorie,eq,${encodeURIComponent(categorie)})&sort=-DatePublication&limit=100`
    : "where=(Statut,eq,Publié)&sort=-DatePublication&limit=100";
  const rows = await fetchRecords<Article>("Articles", filter);
  if (rows === null) {
    return categorie
      ? ARTICLES_SECOURS.filter((a) => a.Categorie === categorie)
      : ARTICLES_SECOURS;
  }
  return rows;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const rows = await fetchRecords<Article>(
    "Articles",
    `where=(Slug,eq,${encodeURIComponent(slug)})&limit=1`
  );
  if (rows === null) {
    return ARTICLES_SECOURS.find((a) => a.Slug === slug) ?? null;
  }
  return rows[0] ?? null;
}
