import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const RETENTION = 14;

function dbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  return url.replace(/^file:/, "");
}

function backupDir(): string {
  return path.join(path.dirname(dbPath()), "backups");
}

export interface SauvegardeInfo {
  nom: string;
  dateISO: string;
  tailleOctets: number;
}

export function listerSauvegardes(): SauvegardeInfo[] {
  const dir = backupDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => {
      const s = statSync(path.join(dir, f));
      return { nom: f, dateISO: s.mtime.toISOString(), tailleOctets: s.size };
    })
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

export function derniereSauvegarde(): SauvegardeInfo | null {
  return listerSauvegardes()[0] ?? null;
}

/**
 * Crée une copie cohérente de la base via VACUUM INTO (jamais une copie de fichier brute, qui
 * pourrait interrompre une écriture en cours), puis ne garde que les RETENTION dernières copies.
 */
export function creerSauvegarde(): SauvegardeInfo {
  const dir = backupDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const horodatage = new Date().toISOString().replace(/[:.]/g, "-");
  const nom = `sauvegarde-${horodatage}.db`;
  const cible = path.join(dir, nom);

  const db = new Database(dbPath(), { readonly: true });
  try {
    db.exec(`VACUUM INTO '${cible.replace(/'/g, "''")}'`);
  } finally {
    db.close();
  }

  const anciennes = listerSauvegardes();
  for (const s of anciennes.slice(RETENTION)) {
    unlinkSync(path.join(dir, s.nom));
  }

  const stat = statSync(cible);
  return { nom, dateISO: stat.mtime.toISOString(), tailleOctets: stat.size };
}

/** Résout un nom de sauvegarde vers son chemin disque — n'accepte que des noms déjà listés, pour
 * ne jamais servir un fichier arbitraire via l'URL de téléchargement. */
export function cheminSauvegarde(nom: string): string | null {
  const existe = listerSauvegardes().find((s) => s.nom === nom);
  if (!existe) return null;
  return path.join(backupDir(), nom);
}
