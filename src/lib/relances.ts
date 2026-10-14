export const SEUIL_JOURNAL_JOURS = 3;

/** Détection déterministe (aucune IA) : vrai si l'accès portail est actif et qu'aucune entrée de
 * journal n'a été enregistrée depuis SEUIL_JOURNAL_JOURS jours (ou depuis l'ouverture de l'accès,
 * si le patient n'a encore jamais rempli son journal). */
export function journalInactifDepuis({
  dernierJournal,
  accessCreatedAt,
  accessActif,
  now,
}: {
  dernierJournal: Date | null;
  accessCreatedAt: Date | null;
  accessActif: boolean;
  now: Date;
}): boolean {
  if (!accessActif) return false;
  const seuil = new Date(now.getTime() - SEUIL_JOURNAL_JOURS * 24 * 3600 * 1000);
  if (dernierJournal) return dernierJournal < seuil;
  return accessCreatedAt !== null && accessCreatedAt < seuil;
}
