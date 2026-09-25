"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createCoachSession, destroyCoachSession, hashPassword, verifyPassword } from "@/lib/auth";

export interface ActionState {
  error?: string;
}

export async function setupAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const existing = await prisma.user.count();
  if (existing > 0) {
    return { error: "Un compte existe déjà. Connecte-toi." };
  }

  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!nom || !email || !password) {
    return { error: "Merci de remplir tous les champs." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== passwordConfirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { nom, email, passwordHash } });
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nomEntreprise: nom },
  });

  await createCoachSession({ userId: user.id, email: user.email, nom: user.nom });
  redirect("/dashboard");
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Merci de renseigner ton email et ton mot de passe." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Identifiants incorrects." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Identifiants incorrects." };
  }

  await createCoachSession({ userId: user.id, email: user.email, nom: user.nom });
  redirect("/dashboard");
}

export async function logout() {
  await destroyCoachSession();
  redirect("/connexion");
}
