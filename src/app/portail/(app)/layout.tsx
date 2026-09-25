import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Activity, FileText, LogOut } from "lucide-react";
import { getPatientSession, destroyPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export default async function PortailLayout({ children }: { children: React.ReactNode }) {
  const session = await getPatientSession();
  if (!session) redirect("/portail/connexion");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.portalEnabled) {
    redirect("/portail/connexion");
  }

  const patient = await prisma.patient.findUnique({ where: { id: session.patientId } });
  if (!patient) redirect("/portail/connexion");

  async function logout() {
    "use server";
    await destroyPatientSession();
    redirect("/portail/connexion");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {initials(patient.nom, patient.prenom)}
            </div>
            <span className="text-sm font-semibold">
              {patient.prenom} {patient.nom}
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-1.5 text-sm text-muted hover:text-danger">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4 pb-2">
          <NavLink href="/portail" icon={LayoutDashboard} label="Mon suivi" />
          <NavLink href="/portail/bilans" icon={Activity} label="Mes bilans" />
          <NavLink href="/portail/factures" icon={FileText} label="Mes factures" />
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </Link>
  );
}
