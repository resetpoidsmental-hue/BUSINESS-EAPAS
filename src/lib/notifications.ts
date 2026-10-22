import { prisma } from "@/lib/db";
import { journalInactifDepuis } from "@/lib/relances";

export interface AlerteItem {
  type: string;
  label: string;
  sub: string;
  href: string;
}

/**
 * État "à surveiller maintenant", en direct — pas un historique d'événements persisté. Utilisé
 * par la cloche de notifications (toutes pages). Reprend les mêmes catégories que les cartes
 * d'alerte du Tableau de bord, interrogées séparément ici pour ne pas toucher à cette page déjà
 * testée.
 */
export async function getAlertesActives(): Promise<AlerteItem[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [prelevementsEchecs, ticketsSAV, patients] = await Promise.all([
    prisma.prelevement.findMany({
      where: { statut: "Échec" },
      include: { patient: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.sAVTicket.findMany({
      where: { statut: { not: "Résolu" } },
      include: { patient: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.patient.findMany({
      where: { statutSuivi: { not: "Suivi terminé" } },
      include: {
        bilans: { orderBy: { date: "desc" }, take: 1 },
        patientAccess: true,
        journalEntrees: { orderBy: { date: "desc" }, take: 1 },
        objectifs: { where: { atteint: false, dateCible: { lt: now } }, orderBy: { dateCible: "asc" }, take: 1 },
        seances: { where: { statut: "Planifiée", date: { lt: now } }, orderBy: { date: "asc" }, take: 1 },
      },
    }),
  ]);

  const alertes: AlerteItem[] = [];

  for (const p of prelevementsEchecs) {
    alertes.push({
      type: "Prélèvement échoué",
      label: `${p.patient.prenom} ${p.patient.nom}`,
      sub: p.motifEchec ?? "Échec",
      href: "/administratif",
    });
  }

  for (const t of ticketsSAV) {
    alertes.push({
      type: "Ticket SAV ouvert",
      label: t.patient ? `${t.patient.prenom} ${t.patient.nom}` : "Sans patient",
      sub: t.sujet,
      href: "/sav",
    });
  }

  for (const p of patients) {
    const dernierTug = p.bilans[0]?.tugTemps;
    if (dernierTug !== null && dernierTug !== undefined && dernierTug > 12) {
      alertes.push({ type: "Risque de chute", label: `${p.prenom} ${p.nom}`, sub: `TUG ${dernierTug}s`, href: `/patients/${p.id}` });
    }
    if (p.statutSuivi === "Bilan initial à faire" && p.createdAt < sevenDaysAgo) {
      alertes.push({ type: "Bilan initial en retard", label: `${p.prenom} ${p.nom}`, sub: "Créé il y a plus de 7 jours", href: `/patients/${p.id}` });
    }
    if (p.objectifs[0]) {
      alertes.push({ type: "Objectif en retard", label: `${p.prenom} ${p.nom}`, sub: p.objectifs[0].texteSMART, href: `/patients/${p.id}` });
    }
    if (p.seances[0]) {
      alertes.push({ type: "Séance manquée", label: `${p.prenom} ${p.nom}`, sub: p.seances[0].type ?? "Séance", href: `/patients/${p.id}` });
    }
    if (
      journalInactifDepuis({
        dernierJournal: p.journalEntrees[0]?.date ?? null,
        accessCreatedAt: p.patientAccess?.createdAt ?? null,
        accessActif: p.patientAccess?.actif ?? false,
        now,
      })
    ) {
      alertes.push({ type: "Journal non rempli", label: `${p.prenom} ${p.nom}`, sub: "Relance à envisager", href: `/patients/${p.id}` });
    }
  }

  return alertes;
}
