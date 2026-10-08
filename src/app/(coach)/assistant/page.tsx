import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { assistantIADisponible } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { AssistantChat } from "./components/assistant-chat";

export const metadata: Metadata = { title: "Assistant IA" };

export default async function AssistantPage() {
  const disponible = assistantIADisponible();

  const patients = disponible
    ? await prisma.patient.findMany({
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        select: {
          id: true,
          nom: true,
          prenom: true,
          seances: {
            where: { statut: "Planifiée", date: { gte: new Date() } },
            orderBy: { date: "asc" },
            take: 5,
            select: { id: true, date: true, type: true, format: true },
          },
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Assistant IA</h1>
        <p className="text-sm text-muted">
          Il propose, tu décides — rien n&rsquo;est écrit dans un dossier patient sans ta validation.
        </p>
      </div>

      {!disponible ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted">
            L&rsquo;assistant IA n&rsquo;est pas encore configuré. Ajoute une clé{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code> dans le fichier{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">.env</code> (obtenue sur{" "}
            <a href="https://console.anthropic.com/settings/keys" className="text-primary underline" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
            ) puis redémarre l&rsquo;application.
          </CardContent>
        </Card>
      ) : patients.length === 0 ? (
        <p className="text-sm text-muted">Ajoute d&rsquo;abord un patient pour utiliser l&rsquo;assistant.</p>
      ) : (
        <AssistantChat
          patients={patients.map((p) => ({
            ...p,
            seances: p.seances.map((s) => ({ ...s, date: s.date.toISOString() })),
          }))}
        />
      )}
    </div>
  );
}
