import { prisma } from "@/lib/db";

export async function nextNumero(kind: "devis" | "facture" | "contrat") {
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const year = new Date().getFullYear();

  if (kind === "devis") {
    const seq = settings.prochainDevis;
    await prisma.settings.update({ where: { id: 1 }, data: { prochainDevis: seq + 1 } });
    return `D-${year}-${String(seq).padStart(3, "0")}`;
  }
  if (kind === "contrat") {
    const seq = settings.prochainContrat;
    await prisma.settings.update({ where: { id: 1 }, data: { prochainContrat: seq + 1 } });
    return `C-${year}-${String(seq).padStart(3, "0")}`;
  }
  const seq = settings.prochainFacture;
  await prisma.settings.update({ where: { id: 1 }, data: { prochainFacture: seq + 1 } });
  return `${year}-${String(seq).padStart(3, "0")}`;
}
