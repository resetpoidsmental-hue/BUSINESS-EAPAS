import Link from "next/link";
import { ChevronLeft, ChevronRight, Landmark, Users, Bell, Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { construireBilanHebdo, semainePrecedente, semaineSuivante } from "@/lib/bilan-hebdo";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function BilanHebdoPage({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const { semaine } = await searchParams;
  const bilan = await construireBilanHebdo(semaine);
  const estSemaineEnCours = bilan.fin > new Date();

  return (
    <div>
      <PageHeader
        title="Bilan hebdomadaire"
        description={`Semaine du ${formatDate(bilan.debut)} au ${formatDate(bilan.fin)}${estSemaineEnCours ? " (en cours)" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/bilan-hebdo?semaine=${semainePrecedente(bilan.lundiCle)}`}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border hover:bg-surface-muted"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={`/bilan-hebdo?semaine=${semaineSuivante(bilan.lundiCle)}`}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border hover:bg-surface-muted"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Activité commerciale</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="CA encaissé" value={formatCurrency(bilan.commercial.caEncaisse)} />
              <Stat label="Dépenses" value={formatCurrency(bilan.commercial.depenses)} />
              <Stat label="Bénéfice brut" value={formatCurrency(bilan.commercial.beneficeBrut)} />
              <Stat label="Factures payées" value={String(bilan.commercial.facturesPayeesCount)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Prospects</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Nouveaux" value={String(bilan.prospects.nouveaux)} />
              <Stat label="Convertis en patients" value={String(bilan.prospects.convertis)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Alertes à traiter maintenant</h2>
              </div>
              <Link href="/dashboard" className="text-xs font-medium text-primary hover:underline">
                Voir sur le tableau de bord
              </Link>
            </div>
            <p className="text-xl font-semibold">{bilan.alertesCount}</p>
            <p className="text-xs text-muted">
              Prélèvements en échec, tickets SAV ouverts, bilans ou objectifs en retard — état actuel, pas limité à cette semaine.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Trafic du site vitrine</h2>
            </div>

            {!bilan.traficDisponible && (
              <p className="text-sm text-muted">
                Umami n&apos;est pas configuré dans cette appli — ajoute UMAMI_URL, UMAMI_WEBSITE_ID, UMAMI_USERNAME et
                UMAMI_PASSWORD dans le <code>.env</code> pour voir le trafic ici.
              </p>
            )}

            {bilan.traficDisponible && !bilan.trafic && (
              <p className="text-sm text-danger">Impossible de récupérer les statistiques Umami pour cette semaine (vérifie les logs).</p>
            )}

            {bilan.trafic && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Visites" value={formatNumber(bilan.trafic.stats.visits, 0)} />
                  <Stat label="Visiteurs" value={formatNumber(bilan.trafic.stats.visitors, 0)} />
                  <Stat label="Pages vues" value={formatNumber(bilan.trafic.stats.pageviews, 0)} />
                  <Stat
                    label="Taux de rebond"
                    value={bilan.trafic.stats.visits > 0 ? `${Math.round((bilan.trafic.stats.bounces / bilan.trafic.stats.visits) * 100)} %` : "—"}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Pages les plus vues</p>
                    {bilan.trafic.topPages.length === 0 ? (
                      <p className="text-sm text-muted">Aucune donnée.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {bilan.trafic.topPages.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="truncate text-foreground">{p.x ?? "—"}</span>
                            <span className="font-medium">{p.y}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">D&apos;où viennent les visites</p>
                    {bilan.trafic.topReferrers.length === 0 ? (
                      <p className="text-sm text-muted">Aucune donnée (accès direct uniquement).</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {bilan.trafic.topReferrers.map((r, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="truncate text-foreground">{r.x ?? "Accès direct"}</span>
                            <span className="font-medium">{r.y}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
