import { prisma } from "@/lib/db";

/**
 * Lit puis incrémente le compteur en UNE seule requête atomique (`increment`,
 * traduit en `SET x = x + 1` côté SQL) — jamais un read-then-write séparé,
 * qui laisserait deux appels concurrents (webhook Stripe + cron, ou deux
 * onglets ouverts en même temps) lire la même valeur et générer le même
 * numéro, faisant échouer la création du second devis/facture/contrat sur la
 * contrainte d'unicité.
 */
export async function nextNumero(kind: "devis" | "facture" | "contrat") {
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const year = new Date().getFullYear();

  if (kind === "devis") {
    const updated = await prisma.settings.update({ where: { id: 1 }, data: { prochainDevis: { increment: 1 } } });
    return `D-${year}-${String(updated.prochainDevis - 1).padStart(3, "0")}`;
  }
  if (kind === "contrat") {
    const updated = await prisma.settings.update({ where: { id: 1 }, data: { prochainContrat: { increment: 1 } } });
    return `C-${year}-${String(updated.prochainContrat - 1).padStart(3, "0")}`;
  }
  const updated = await prisma.settings.update({ where: { id: 1 }, data: { prochainFacture: { increment: 1 } } });
  return `${year}-${String(updated.prochainFacture - 1).padStart(3, "0")}`;
}
