import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { TicketForm } from "./ticket-form";
import { TicketList } from "./ticket-list";

export default async function SAVPage() {
  const [patients, tickets] = await Promise.all([
    prisma.patient.findMany({ select: { id: true, nom: true, prenom: true }, orderBy: { nom: "asc" } }),
    prisma.sAVTicket.findMany({
      include: { patient: { select: { nom: true, prenom: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="SAV" description="Suivi des demandes, réclamations et incidents." />
      <div className="flex flex-col gap-6">
        <TicketForm patients={patients} />
        <TicketList tickets={tickets} />
      </div>
    </div>
  );
}
