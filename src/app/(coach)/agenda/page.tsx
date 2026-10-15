import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { lundiDeLaSemaine, ajouterJours, cleJour, parisHeureVersDate } from "@/lib/agenda";
import { AgendaView, type SeanceAgenda, type ProspectAgenda, type HoraireAgenda, type ExceptionnelAgenda } from "./components/agenda-view";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const { semaine } = await searchParams;
  const lundi = lundiDeLaSemaine(semaine);

  const debutSemaine = parisHeureVersDate(lundi, 0, 0);
  const finSemaine = parisHeureVersDate(ajouterJours(lundi, 7), 0, 0);

  const [horairesDb, exceptionnelsDb, seancesDb, prospectsDb, patients, prospectsSansCreneau] = await Promise.all([
    prisma.horaireTravail.findMany(),
    prisma.creneauExceptionnel.findMany({ where: { date: { gte: debutSemaine, lt: finSemaine } } }),
    prisma.seance.findMany({
      where: { date: { gte: debutSemaine, lt: finSemaine } },
      include: { patient: { select: { id: true, nom: true, prenom: true } } },
    }),
    prisma.prospect.findMany({
      where: { patientId: null, creneauPropose: { gte: debutSemaine, lt: finSemaine } },
    }),
    prisma.patient.findMany({ where: { statutSuivi: { not: "Suivi terminé" } }, orderBy: { nom: "asc" }, select: { id: true, nom: true, prenom: true } }),
    prisma.prospect.findMany({ where: { patientId: null }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
  ]);

  const horaires: HoraireAgenda[] = horairesDb.map((h) => ({ jour: h.jour, actif: h.actif, debut: h.debut, fin: h.fin }));
  const exceptionnels: ExceptionnelAgenda[] = exceptionnelsDb.map((c) => ({ jourCle: cleJourFromDate(c.date), debut: c.debut, fin: c.fin }));
  const seances: SeanceAgenda[] = seancesDb.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    statut: s.statut,
    patientNom: `${s.patient.prenom} ${s.patient.nom}`,
    patientId: s.patient.id,
  }));
  const prospects: ProspectAgenda[] = prospectsDb.map((p) => ({
    id: p.id,
    nom: p.nom,
    creneauPropose: p.creneauPropose ? p.creneauPropose.toISOString() : null,
  }));

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Tes disponibilités (horaires de travail) et tes rendez-vous — clique un créneau libre pour créer, un rendez-vous pour le valider."
      />
      <AgendaView
        lundi={lundi}
        horaires={horaires}
        exceptionnels={exceptionnels}
        seances={seances}
        prospects={prospects}
        patients={patients}
        prospectsSansCreneau={prospectsSansCreneau}
      />
    </div>
  );
}

function cleJourFromDate(d: Date): string {
  return cleJour({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}
