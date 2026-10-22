import Link from "next/link";
import { Users, CalendarClock, AlertTriangle, Target, ArrowRight, TrendingUp, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDate, formatHeure, formatCurrency, dateKeyParis } from "@/lib/utils";
import { journalInactifDepuis, SEUIL_JOURNAL_JOURS } from "@/lib/relances";
import { auMoinsUneIntegrationConfiguree } from "@/lib/integrations";
import { ChecklistDemarrage } from "./components/checklist-demarrage";

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
  const unJourAvant = new Date(now.getTime() - 24 * 3600 * 1000);
  const unJourApres = new Date(now.getTime() + 24 * 3600 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 3600 * 1000);

  const trenteJoursAvant = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [
    totalPatients,
    actifs,
    parStatut,
    seancesAutourAujourdhui,
    prochainesSeances,
    seancesRecentes,
    objectifsEnRetard,
    seancesManquees,
    patients,
    prelevementsEchecs,
    prelevementsEnAttente,
    prelevementsReussisMois,
    settings,
    ticketsSAVOuverts,
  ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { statutSuivi: "Suivi en cours" } }),
      prisma.patient.groupBy({ by: ["statutSuivi"], _count: { _all: true } }),
      prisma.seance.findMany({
        where: { date: { gte: unJourAvant, lte: unJourApres }, statut: { not: "Annulée" } },
        include: { patient: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { date: "asc" },
      }),
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
      prisma.seance.findMany({
        where: { statut: "Planifiée", date: { lt: now } },
        include: { patient: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { date: "asc" },
        take: 5,
      }),
      prisma.patient.findMany({
        where: { statutSuivi: { not: "Suivi terminé" } },
        include: {
          bilans: { orderBy: { date: "desc" }, take: 1 },
          patientAccess: true,
          journalEntrees: { orderBy: { date: "desc" }, take: 1 },
        },
      }),
      prisma.prelevement.findMany({
        where: { statut: "Échec" },
        include: { patient: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.prelevement.findMany({
        where: { statut: "En attente" },
        include: { patient: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.prelevement.aggregate({
        where: { statut: "Réussi", date: { gte: trenteJoursAvant } },
        _sum: { montant: true },
        _count: { _all: true },
      }),
      prisma.settings.findUnique({ where: { id: 1 } }),
      prisma.sAVTicket.findMany({
        where: { statut: { not: "Résolu" } },
        include: { patient: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const checklistItems = [
    { label: "Créer un premier patient", done: totalPatients > 0, href: "/patients/nouveau", cta: "Créer" },
    { label: "Activer le portail patient", done: settings?.portalEnabled ?? false, href: "/reglages", cta: "Activer" },
    {
      label: "Configurer au moins une intégration (IA, email, paiements ou Telegram)",
      done: auMoinsUneIntegrationConfiguree(),
      href: "/reglages",
      cta: "Configurer",
    },
  ];

  const aujourdhuiKey = dateKeyParis(now);
  const seancesAujourdhui = seancesAutourAujourdhui.filter((s) => dateKeyParis(s.date) === aujourdhuiKey);

  const bilansEnRetard = patients.filter(
    (p) => p.statutSuivi === "Bilan initial à faire" && p.createdAt < sevenDaysAgo
  );
  const patientsAtRisqueChute = patients.filter((p) => {
    const dernierTug = p.bilans[0]?.tugTemps;
    return dernierTug !== null && dernierTug !== undefined && dernierTug > 12;
  });
  const journalNonRempli = patients.filter((p) =>
    journalInactifDepuis({
      dernierJournal: p.journalEntrees[0]?.date ?? null,
      accessCreatedAt: p.patientAccess?.createdAt ?? null,
      accessActif: p.patientAccess?.actif ?? false,
      now,
    })
  );

  const faites = seancesRecentes.filter((s) => s.statut === "Faite").length;
  const total = seancesRecentes.length;
  const tauxAssiduite = total > 0 ? Math.round((faites / total) * 100) : null;

  const maxStatutCount = Math.max(1, ...parStatut.map((s) => s._count._all));

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de ton activité." />

      <ChecklistDemarrage items={checklistItems} />

      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Aujourd&apos;hui</h2>
            <span className="text-xs text-muted">{formatDate(now)}</span>
            <Link href="/agenda" className="ml-auto text-xs font-medium text-primary hover:underline">
              Voir l&apos;agenda complet →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Séances ({seancesAujourdhui.length})
              </p>
              {seancesAujourdhui.length === 0 ? (
                <p className="text-xs text-muted">Aucun rendez-vous aujourd&apos;hui.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {seancesAujourdhui.map((s) => (
                    <Link key={s.id} href={`/patients/${s.patient.id}`} className="flex items-center gap-2 text-xs hover:underline">
                      <span className="font-semibold text-primary">{formatHeure(s.date)}</span>
                      <span>
                        {s.patient.prenom} {s.patient.nom}
                      </span>
                      {s.statut === "Faite" && <span className="text-muted">(faite)</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Tickets SAV ouverts ({ticketsSAVOuverts.length})
              </p>
              {ticketsSAVOuverts.length === 0 ? (
                <p className="text-xs text-muted">Aucun ticket en attente.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {ticketsSAVOuverts.map((t) => (
                    <Link key={t.id} href="/sav" className="block text-xs hover:underline">
                      {t.patient ? `${t.patient.prenom} ${t.patient.nom}` : "Sans patient"} — {t.sujet}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Bilans en retard ({bilansEnRetard.length})
              </p>
              {bilansEnRetard.length === 0 ? (
                <p className="text-xs text-muted">Rien en retard.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {bilansEnRetard.map((p) => (
                    <Link key={p.id} href={`/patients/${p.id}`} className="block text-xs hover:underline">
                      {p.prenom} {p.nom} — créé le {formatDate(p.createdAt)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {(patientsAtRisqueChute.length > 0 ||
        objectifsEnRetard.length > 0 ||
        seancesManquees.length > 0 ||
        journalNonRempli.length > 0 ||
        prelevementsEchecs.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {prelevementsEchecs.length > 0 && (
            <AlertCard
              title="Prélèvements échoués"
              items={prelevementsEchecs.map((p) => ({
                id: p.patient.id,
                label: `${p.patient.prenom} ${p.patient.nom}`,
                sub: `${p.motifEchec ?? "Échec"} — ${formatCurrency(p.montant)}`,
              }))}
              hrefPrefix="/administratif"
            />
          )}
          {seancesManquees.length > 0 && (
            <AlertCard
              title="Séances manquées"
              items={seancesManquees.map((s) => ({
                id: s.patient.id,
                label: `${s.patient.prenom} ${s.patient.nom}`,
                sub: `${s.type ?? "Séance"} du ${formatDate(s.date)}`,
              }))}
            />
          )}
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
          {journalNonRempli.length > 0 && (
            <AlertCard
              title={`Journal non rempli (+${SEUIL_JOURNAL_JOURS}j)`}
              items={journalNonRempli.map((p) => ({
                id: p.id,
                label: `${p.prenom} ${p.nom}`,
                sub: p.journalEntrees[0] ? `Dernier journal : ${formatDate(p.journalEntrees[0].date)}` : "Aucun journal rempli",
              }))}
            />
          )}
        </div>
      )}

      {(prelevementsEnAttente.length > 0 || (prelevementsReussisMois._count._all ?? 0) > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {prelevementsEnAttente.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold">SEPA en attente de confirmation</h3>
                  <Badge variant="warning">{prelevementsEnAttente.length}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {prelevementsEnAttente.map((p) => (
                    <Link
                      key={p.id}
                      href="/administratif"
                      className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-surface-muted"
                    >
                      <span className="font-medium">
                        {p.patient.prenom} {p.patient.nom}
                      </span>
                      <span className="text-xs text-muted">{formatCurrency(p.montant)}</span>
                    </Link>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">Un virement SEPA prend quelques jours à se confirmer — normal, rien à faire.</p>
              </CardContent>
            </Card>
          )}
          {(prelevementsReussisMois._count._all ?? 0) > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <h3 className="text-sm font-semibold">Prélevés avec succès (30 derniers jours)</h3>
                  <Badge variant="success">{prelevementsReussisMois._count._all}</Badge>
                </div>
                <p className="text-2xl font-semibold">{formatCurrency(prelevementsReussisMois._sum.montant ?? 0)}</p>
                <Link href="/administratif" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Voir le détail <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
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

function AlertCard({
  title,
  items,
  hrefPrefix = "/patients",
}: {
  title: string;
  items: { id: string; label: string; sub: string }[];
  hrefPrefix?: string;
}) {
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
              href={hrefPrefix === "/patients" ? `/patients/${item.id}` : hrefPrefix}
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
