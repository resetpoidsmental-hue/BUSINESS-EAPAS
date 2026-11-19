#!/usr/bin/env node
// Déchiffre une sauvegarde reçue par email (pièce jointe .enc) pour la restaurer.
// Format du fichier : IV (12 octets) || tag d'authentification (16 octets) || contenu AES-256-GCM.
//
// Usage :
//   BACKUP_ENCRYPTION_KEY=<clé hex à 64 caractères> node scripts/dechiffrer-sauvegarde.js entree.db.enc sortie.db

const { createDecipheriv } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");

const [, , entree, sortie] = process.argv;
if (!entree || !sortie) {
  console.error("Usage : BACKUP_ENCRYPTION_KEY=<clé hex> node scripts/dechiffrer-sauvegarde.js entree.db.enc sortie.db");
  process.exit(1);
}

const hex = process.env.BACKUP_ENCRYPTION_KEY;
if (!hex) {
  console.error("Variable BACKUP_ENCRYPTION_KEY manquante — c'est la même clé que celle du .env du serveur.");
  process.exit(1);
}

const cle = Buffer.from(hex, "hex");
if (cle.length !== 32) {
  console.error("BACKUP_ENCRYPTION_KEY doit faire 64 caractères hexadécimaux (32 octets).");
  process.exit(1);
}

const donnees = readFileSync(entree);
const iv = donnees.subarray(0, 12);
const tag = donnees.subarray(12, 28);
const chiffre = donnees.subarray(28);

const decipher = createDecipheriv("aes-256-gcm", cle, iv);
decipher.setAuthTag(tag);

let clair;
try {
  clair = Buffer.concat([decipher.update(chiffre), decipher.final()]);
} catch {
  console.error("Échec du déchiffrement — clé incorrecte ou fichier corrompu/tronqué.");
  process.exit(1);
}

writeFileSync(sortie, clair);
console.log(`Déchiffré avec succès → ${sortie}`);
