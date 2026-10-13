import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { JournalForm } from "./journal-form";

export default async function PortailJournalPage() {
  const session = await getPatientSession();
  const entrees = await prisma.journalEntree.findMany({
    where: { patientId: session!.patientId },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <h1 className="mb-1 text-lg font-semibold">Mon journal</h1>
          <p className="mb-4 text-sm text-muted">
            Note ce que tu veux de ta journée — ton coach pourra s&apos;en servir pour mieux t&apos;accompagner. Rien
            n&apos;est obligatoire, et aucun calcul n&apos;est fait automatiquement sur ces notes.
          </p>
          <JournalForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Mes dernières entrées</h2>
          {entrees.length === 0 ? (
            <p className="text-sm text-muted">Pas encore d&apos;entrée — commence par remplir le formulaire ci-dessus.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {entrees.map((e) => (
                <div key={e.id} className="flex flex-col gap-1 py-3 text-sm">
                  <span className="text-xs font-semibold text-muted">{formatDate(e.date)}</span>
                  {e.repas && <p>Repas/boissons : {e.repas}</p>}
                  {e.activite && (
                    <p>
                      Activité : {e.activite}
                      {e.dureeMinutes ? ` · ${e.dureeMinutes} min` : ""}
                      {e.heure ? ` · ${e.heure}` : ""}
                    </p>
                  )}
                  {e.motivation !== null && <p>Motivation : {e.motivation}/10</p>}
                  {e.notes && <p className="text-muted">{e.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
