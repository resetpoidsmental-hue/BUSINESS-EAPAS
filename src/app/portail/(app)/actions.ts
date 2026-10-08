"use server";

import { revalidatePath } from "next/cache";
import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function marquerMaterielVu(seanceId: string) {
  const session = await getPatientSession();
  if (!session) return;

  // On ne modifie que les séances du patient connecté, jamais un id arbitraire reçu du client.
  await prisma.seance.updateMany({
    where: { id: seanceId, patientId: session.patientId },
    data: { materielVu: true },
  });

  revalidatePath("/portail");
}
