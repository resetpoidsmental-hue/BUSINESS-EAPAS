import Link from "next/link";
import { Users, CalendarClock, AlertTriangle, Target, ArrowRight, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDate } from "@/lib/utils";

const STATUT_ORDER = ["Bilan initial à faire", "Suivi en cours", "Bilan final fait", "Suivi terminé"] as const;
const STATUT_COLOR: Record<string, string> = {
  "Bilan initial à faire": "var(--warning)",
  "Suivi en cours": "var(--primary)",
  "Bilan final fait": "var(--success)",
  "Suivi terminé": "var(--muted)",
};

export default async function DashboardPage() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 3600 * 1000);

  const [totalPatients, actifs, parStatut, prochainesSeances, seancesRecentes, objectifsEnRetard, patients] =
    await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { statutSuivi: "Suivi en cours" } }),
      prisma.patient.groupBy({ by: ["statutSuivi"], _count: { _all: true } }),
      prisma.seance.findMany({
        where: { date: { gte: now, lte: in7Days }, statut: "Planifiée" },
        include: { patient: { select: { nom: true, prenom: true } } },
        orderBy: { date: "asc" },
        take: 8,
      }),
      prisma.seance.findMany({
        where: { date: { gte: sixtyDaysAgo }, statut: { in: ["Faite", "Annulée"] } },
        select: { statut: true },
      }),
      prisma.objectifSMART.findMany({
        where: { atteint: false, dateCible: { lt: now } },
        include: { patient: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { dateCible: "asc" },
        take: 5,
      }),
      prisma.patient.findMany({
        where: { statutSuivi: { not: "Suivi terminé" } },
        include: { bilans: { orderBy: { date: "desc" }, take: 1 } },
      }),
    ]);

  const bilansEnRetard = patients.filter(
    (p) => p.statutSuivi === "Bilan initial à faire" && p.createdAt < sevenDaysAgo
  );
  const patientsAtRisqueChute = patients.filter((p) => {
    const dernierTug = p.bilans[0]?.tugTemps;
    return dernierTug !== null && dernierTug !== undefined && dernierTug > 12;
  });

  const faites = seancesRecentes.filter((s) => s.statut === "Faite").length;
  const total = seancesRecentes.length;
  const tauxAssiduite = total > 0 ? Math.round((faites / total) * 100) : null;

  const maxStatutCount = Math.max(1, ...parStatut.map((s) => s._count._all));

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de ton activité." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users} label="Patients & clients" value={String(totalPatients)} />
        <Stat icon={TrendingUp} label="Suivis en cours" value={String(actifs)} />
        <Stat
          icon={CalendarClock}
          label="Séances (7 jours)"
          value={String(prochainesSeances.length)}
        />
        <Stat
          icon={Target}
          label="Assiduité (60j)"
          value={tauxAssiduite !== null ? `${tauxAssiduite}%` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Prochaines séances</h2>
              <Link href="/patients" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Voir les patients <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {prochainesSeances.length === 0 ? (
              <p className="text-sm text-muted">Aucune séance planifiée dans les 7 prochains jours.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {prochainesSeances.map((s) => (
                  <Link
                    key={s.id}
                    href={`/patients/${s.patientId}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-surface-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {s.patient.prenom} {s.patient.nom}
                      </p>
                      <p className="text-xs text-muted">{s.type ?? "Séance"} {s.format && `· ${s.format}`}</p>
                    </div>
                    <span className="text-xs text-muted">{formatDateTime(s.date)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Répartition des dossiers</h2>
            <div className="flex flex-col gap-3">
              {STATUT_ORDER.map((statut) => {
                const count = parStatut.find((s) => s.statutSuivi === statut)?._count._all ?? 0;
                const pct = (count / maxStatutCount) * 100;
                return (
                  <div key={statut}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted">{statut}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: STATUT_COLOR[statut] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {(bilansEnRetard.length > 0 || patientsAtRisqueChute.length > 0 || objectifsEnRetard.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {patientsAtRisqueChute.length > 0 && (
            <AlertCard
              title="Risque de chute (TUG > 12s)"
              items={patientsAtRisqueChute.map((p) => ({
                id: p.id,
                label: `${p.prenom} ${p.nom}`,
                sub: `${p.bilans[0]?.tugTemps}s`,
              }))}
            />
          )}
          {bilansEnRetard.length > 0 && (
            <AlertCard
              title="Bilan initial en retard (>7j)"
              items={bilansEnRetard.map((p) => ({
                id: p.id,
                label: `${p.prenom} ${p.nom}`,
                sub: formatDate(p.createdAt),
              }))}
            />
          )}
          {objectifsEnRetard.length > 0 && (
            <AlertCard
              title="Objectifs SMART en retard"
              items={objectifsEnRetard.map((o) => ({
                id: o.patient.id,
                label: `${o.patient.prenom} ${o.patient.nom}`,
                sub: o.texteSMART,
              }))}
            />
          )}
        </div>
      )}

      {totalPatients === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted">Ton tableau de bord se remplira dès ton premier dossier patient.</p>
            <Link href="/patients/nouveau" className="text-sm font-medium text-primary hover:underline">
              Créer le premier dossier →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </CardContent>
    </Card>
  );
}

function AlertCard({ title, items }: { title: string; items: { id: string; label: string; sub: string }[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold">{title}</h3>
          <Badge variant="warning">{items.length}</Badge>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/patients/${item.id}`}
              className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-surface-muted"
            >
              <span className="font-medium">{item.label}</span>
              <span className="line-clamp-1 max-w-[45%] text-right text-xs text-muted">{item.sub}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
