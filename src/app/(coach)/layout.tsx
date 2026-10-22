import { redirect } from "next/navigation";
import { getCoachSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { getAlertesActives } from "@/lib/notifications";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getCoachSession();
  if (!session) redirect("/connexion");

  const [settings, alertes] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    getAlertesActives(),
  ]);

  return (
    <AppShell nom={session.nom} portalEnabled={settings?.portalEnabled ?? false} alertes={alertes}>
      {children}
    </AppShell>
  );
}
