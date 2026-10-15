/** Script d'appel découverte (téléphone/visio), utilisé par la Fiche d'appel. Contenu éditorial fixe —
 * jamais généré ni modifié par l'IA, qui ne fait que résumer les notes prises pendant l'appel. */

export interface LigneScript {
  /** Ce qui s'affiche en gras dans la checklist : la phrase à dire, ou le déclencheur côté prospect. */
  label: string;
  /** Pour Objections/Clôture : la phrase exacte à dire, affichée sous le label. */
  script?: string;
  /** Prompt de la ligne de réponse associée dans "Tes notes, en direct". */
  prompt: string;
}

export interface EtapeScript {
  titre: string;
  lignes: LigneScript[];
}

export const SCRIPT_APPEL: EtapeScript[] = [
  {
    titre: "Ouverture",
    lignes: [
      {
        label:
          "« Bonjour [Prénom], merci d'avoir pris le temps — je vois que tu [t'es renseigné(e) sur le site / m'as contacté via Instagram]… Avant de te parler de ce qu'on propose, j'aimerais comprendre ta situation. »",
        prompt: "Comment il/elle a réagi à l'ouverture",
      },
      { label: "« Ça te va si je te pose quelques questions ? »", prompt: "A confirmé être disponible pour les questions" },
    ],
  },
  {
    titre: "Découverte",
    lignes: [
      { label: "« Qu'est-ce qui t'amène aujourd'hui ? »", prompt: "Ce qui l'amène" },
      { label: "« Tu as déjà essayé quoi de ton côté ? Qu'est-ce qui n'a pas tenu ? »", prompt: "Ce qu'il/elle a déjà essayé — pourquoi ça n'a pas tenu" },
      { label: "« Si dans 3 mois c'était réglé, à quoi ça ressemblerait pour toi ? »", prompt: "Objectif à 3 mois" },
      { label: "« Tu peux te dégager combien de temps par semaine, réalistement ? »", prompt: "Disponibilités déclarées" },
    ],
  },
  {
    titre: "Reformulation",
    lignes: [
      { label: "« Si je résume : tu veux [...], tu as essayé [...], tu peux te dégager [...]. C'est bien ça ? »", prompt: "Résumé reformulé, avec ses mots" },
      { label: "Attendre sa confirmation avant de continuer", prompt: "A confirmé la reformulation ?" },
    ],
  },
  {
    titre: "Offre ciblée",
    lignes: [
      { label: "« Vu ce que tu me dis, je pense à [formule] : [1-2 inclusions qui répondent à son besoin]. »", prompt: "Formule présentée" },
      { label: "« C'est [tarif] et ça se passe [fréquence/durée]. »", prompt: "Réaction au tarif" },
      { label: "« La différence avec ce que tu as essayé avant, c'est [suivi personnalisé / ajustement au fil de l'eau]. »", prompt: "Point qui a semblé convaincre" },
    ],
  },
  {
    titre: "Objections",
    lignes: [
      {
        label: "« C'est cher » / « Je vais réfléchir »",
        script: "« Je comprends, c'est un budget. Juste pour être sûr que je t'ai bien compris : c'est le prix qui bloque, ou c'est plutôt l'engagement dans le temps qui t'inquiète ? »",
        prompt: "Ce qu'il/elle a répondu",
      },
      {
        label: "« Je dois en parler à mon/ma conjoint(e) »",
        script: "« Bien sûr, c'est normal. Qu'est-ce qui te ferait dire oui, toi, si ça ne tenait qu'à toi ? »",
        prompt: "Ce qui ferait dire oui",
      },
      {
        label: "« Je préfère essayer seul(e) d'abord »",
        script: "« Ça se comprend — qu'est-ce qui serait différent cette fois par rapport aux fois précédentes où tu as essayé seul(e) ? »",
        prompt: "Ce qui serait différent cette fois",
      },
    ],
  },
  {
    titre: "Clôture",
    lignes: [
      {
        label: "Proposer un premier pas avec deux créneaux précis",
        script: "« Je te propose qu'on démarre par [bilan initial / première séance] le [créneau A] ou le [créneau B]. Lequel te va le mieux ? »",
        prompt: "Créneaux proposés / choisi",
      },
      {
        label: "Si pas de réponse immédiate, fixer une relance",
        script: "« Pas de souci, prends le temps qu'il te faut. Je t'envoie un récap, et je te recontacte [jour précis] si je n'ai pas de nouvelles — ça te va ? »",
        prompt: "Date de relance si pas de réponse",
      },
    ],
  },
];
