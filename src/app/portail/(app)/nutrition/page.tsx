import { getPatientSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { MEAL_KEYS, MEAL_LABELS, type MenuType } from "@/lib/categories-ration";

export default async function PortailNutritionPage() {
  const session = await getPatientSession();

  const [programme, modele] = await Promise.all([
    prisma.programmeNutritionnel.findFirst({ where: { patientId: session!.patientId, statut: "Livré" } }),
    prisma.modeleRation.findFirst({
      where: { patientId: session!.patientId, partageLe: { not: null } },
      orderBy: { partageLe: "desc" },
    }),
  ]);

  const menuType = modele ? (JSON.parse(modele.menuType) as MenuType) : null;

  if (!programme && !menuType) {
    return (
      <Card>
        <CardContent className="p-5">
          <h1 className="mb-1 text-lg font-semibold">Mon suivi nutrition</h1>
          <p className="text-sm text-muted">
            Ton coach ne t&apos;a pas encore envoyé ton programme ou ton menu type. Dès qu&apos;il le fera, tu les retrouveras ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {programme && (
        <Card>
          <CardContent className="p-5">
            <h1 className="mb-1 text-lg font-semibold">Mon programme nutrition</h1>
            <p className="mb-3 text-sm text-muted">Livré par ton coach le {formatDate(programme.livreLe!)}.</p>
            <div className="whitespace-pre-line text-sm text-foreground">{programme.contenu}</div>
          </CardContent>
        </Card>
      )}

      {menuType && modele && (
        <>
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-1 text-lg font-semibold">Mon menu</h2>
              <p className="text-sm text-muted">
                {modele.nom} — envoyé par ton coach le {formatDate(modele.partageLe!)}.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MEAL_KEYS.map((m) => (
              <Card key={m}>
                <CardContent className="p-5">
                  <h2 className="mb-2 text-sm font-semibold">{MEAL_LABELS[m]}</h2>
                  <p className="whitespace-pre-line text-sm text-foreground">
                    {menuType[m] || "Rien de précisé pour ce repas."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
