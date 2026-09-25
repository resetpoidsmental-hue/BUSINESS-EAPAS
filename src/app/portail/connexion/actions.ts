"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createPatientSession, hashAccessCode } from "@/lib/auth";

export interface PortalActionState {
  error?: string;
}

export async function loginPatient(_prev: PortalActionState, formData: FormData): Promise<PortalActionState> {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.portalEnabled) {
    return { error: "Le portail patient n'est pas activé pour le moment. Contacte ton coach." };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Merci de saisir ton code d'accès." };

  const access = await prisma.patientAccess.findFirst({
    where: { codeHash: hashAccessCode(code), actif: true },
  });

  if (!access) {
    return { error: "Code d'accès invalide. Vérifie auprès de ton coach." };
  }

  await prisma.patientAccess.update({
    where: { id: access.id },
    data: { lastLoginAt: new Date() },
  });

  await createPatientSession({ patientId: access.patientId });
  redirect("/portail");
}
