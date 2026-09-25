import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, ageFromDate, initials } from "@/lib/utils";

const STATUT_VARIANT: Record<string, "muted" | "warning" | "default" | "success"> = {
  "Bilan initial à faire": "warning",
  "Suivi en cours": "default",
  "Bilan final fait": "success",
  "Suivi terminé": "muted",
};

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; metier?: string }>;
}) {
  const { q, statut, metier } = await searchParams;

  const patients = await prisma.patient.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { nom: { contains: q } },
                { prenom: { contains: q } },
                { numDossier: { contains: q } },
                { pathologieALD: { contains: q } },
              ],
            }
          : {},
        statut ? { statutSuivi: statut } : {},
        metier ? { metier } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const statuts = ["Bilan initial à faire", "Suivi en cours", "Bilan final fait", "Suivi terminé"];

  return (
    <div>
      <PageHeader
        title="Patients & clients"
        description={`${patients.length} dossier${patients.length > 1 ? "s" : ""}`}
        action={
          <Button asChild>
            <Link href="/patients/nouveau">
              <Plus className="h-4 w-4" /> Nouveau dossier
            </Link>
          </Button>
        }
      />

      <form className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center" method="get">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input name="q" defaultValue={q} placeholder="Nom, n° dossier, pathologie…" className="pl-9" />
        </div>
        <select
          name="statut"
          defaultValue={statut ?? ""}
          className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
        >
          <option value="">Tous les statuts</option>
          {statuts.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="metier"
          defaultValue={metier ?? ""}
          className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
        >
          <option value="">Tous les métiers</option>
          <option value="EAPAS">EAPAS</option>
          <option value="Nutrition">Nutrition</option>
          <option value="EAPAS+Nutrition">EAPAS + Nutrition</option>
        </select>
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted">Aucun dossier pour le moment.</p>
            <Button asChild>
              <Link href="/patients/nouveau">
                <Plus className="h-4 w-4" /> Créer le premier dossier
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => {
            const age = ageFromDate(p.dateNaissance);
            return (
              <Link key={p.id} href={`/patients/${p.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                          {initials(p.nom, p.prenom)}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">
                            {p.prenom} {p.nom}
                          </p>
                          <p className="text-xs text-muted">
                            {p.numDossier} {age !== null && `· ${age} ans`}
                          </p>
                        </div>
                      </div>
                    </div>
                    {p.pathologieALD && <p className="line-clamp-1 text-xs text-muted">{p.pathologieALD}</p>}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={STATUT_VARIANT[p.statutSuivi] ?? "muted"}>{p.statutSuivi}</Badge>
                      <Badge variant="outline">{p.metier}</Badge>
                    </div>
                    <p className="text-xs text-muted">Créé le {formatDate(p.createdAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
