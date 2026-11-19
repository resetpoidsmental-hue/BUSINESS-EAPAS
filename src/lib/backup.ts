import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { randomBytes, createCipheriv } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";

const RETENTION = 14;
const ALGORITHME_CHIFFREMENT = "aes-256-gcm";
const IV_LONGUEUR = 12;
/** Taille max du fichier à chiffrer et envoyer par email (marge sous la limite Resend/boîtes mail). */
export const TAILLE_MAX_ENVOI_HORS_SITE = 15 * 1024 * 1024;

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

export function backupHorsSiteDisponible() {
  return Boolean(process.env.BACKUP_ENCRYPTION_KEY && process.env.BACKUP_EMAIL_TO);
}

function cleChiffrement(): Buffer {
  const hex = process.env.BACKUP_ENCRYPTION_KEY;
  if (!hex) throw new Error("BACKUP_ENCRYPTION_KEY manquant dans l'environnement.");
  const cle = Buffer.from(hex, "hex");
  if (cle.length !== 32) {
    throw new Error("BACKUP_ENCRYPTION_KEY doit faire 64 caractères hexadécimaux (32 octets) — génère-la avec `openssl rand -hex 32`.");
  }
  return cle;
}

/**
 * Chiffre un buffer en AES-256-GCM pour l'envoi hors site (par email). Format du résultat :
 * IV (12 octets) || tag d'authentification (16 octets) || contenu chiffré. Sans la clé exacte
 * (BACKUP_ENCRYPTION_KEY), ce fichier est illisible — garde cette clé en lieu sûr, séparément
 * du serveur et de la boîte mail qui reçoit les sauvegardes : si elle est perdue, les
 * sauvegardes chiffrées déjà envoyées le sont aussi, définitivement.
 */
export function chiffrerPourEnvoiHorsSite(contenu: Buffer): Buffer {
  const cle = cleChiffrement();
  const iv = randomBytes(IV_LONGUEUR);
  const cipher = createCipheriv(ALGORITHME_CHIFFREMENT, cle, iv);
  const chiffre = Buffer.concat([cipher.update(contenu), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, chiffre]);
}
