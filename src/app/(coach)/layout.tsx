import { redirect } from "next/navigation";
import { getCoachSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getCoachSession();
  if (!session) redirect("/connexion");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <AppShell nom={session.nom} portalEnabled={settings?.portalEnabled ?? false}>
      {children}
    </AppShell>
  );
}
