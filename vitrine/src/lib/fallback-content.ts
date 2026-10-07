import type { Article, Formule } from "./types";

export const FORMULES_SECOURS: Formule[] = [
  {
    id: 1,
    Nom: "Essentiel",
    Slug: "essentiel",
    Accroche: "Pour sortir du yo-yo, sans te blesser",
    DescriptionCourte:
      "Le programme d'entrée pour arrêter les régimes qui ne tiennent pas, avec un bilan complet et un suivi personnalisé.",
    DescriptionLongue:
      "Le programme Essentiel s'adresse à toute personne qui a déjà essayé de perdre du poids plusieurs fois sans résultat durable, ou qui a peur de se blesser en reprenant une activité physique.\n\nTu bénéficies d'un bilan initial complet (tests physiques, entretien nutrition), puis d'un programme nutrition et mouvement construit sur tes capacités réelles, avec un point de suivi régulier pour ajuster.",
    Prix: 89,
    Unite: "/mois",
    DureeSemaines: 12,
    Inclusions:
      "Bilan initial complet (tests PASS, entretien nutrition)\n1 point visio par mois pour ajuster ton programme\nProgramme nutrition et activité physique personnalisé\nSuivi de progression avec bilans intermédiaires\nAccès à ton espace patient en ligne",
    Badge: null,
    Ordre: 1,
    Statut: "Actif",
    CtaLabel: "Réserver un appel découverte",
  },
  {
    id: 2,
    Nom: "Premium",
    Slug: "premium",
    Accroche: "L'accompagnement complet, nutrition & mouvement",
    DescriptionCourte:
      "Le programme le plus complet : nutrition et activité physique adaptée réunies, pour des résultats qui durent.",
    DescriptionLongue:
      "Le programme Premium combine nutrition et activité physique adaptée dans un seul accompagnement, pour arrêter de jongler entre plusieurs intervenants qui ne se parlent pas.\n\nEn plus du contenu du programme Essentiel, tu profites d'un suivi plus rapproché (2 points visio par mois), d'une nutrition réévaluée chaque mois et d'un contact prioritaire avec ton coach entre les points.",
    Prix: 149,
    Unite: "/mois",
    DureeSemaines: 12,
    Inclusions:
      "Tout le contenu du programme Essentiel\n2 points visio par mois\nProgramme nutrition réévalué chaque mois\nRecettes et conseils personnalisés\nContact prioritaire avec ton coach",
    Badge: "Populaire",
    Ordre: 2,
    Statut: "Actif",
    CtaLabel: "Réserver un appel découverte",
  },
];

export const ARTICLES_SECOURS: Article[] = [
  {
    id: 1,
    Titre: "Reprendre le sport sans te blesser : par où commencer",
    Slug: "reprendre-le-sport-sans-te-blesser",
    Categorie: "APA",
    Extrait:
      "Peur de te blesser ou de repartir de zéro ? Voici pourquoi un programme adapté à tes capacités réelles change tout.",
    Contenu:
      "<p>L'activité physique adaptée (APA) s'appuie sur des exercices pensés pour ta condition physique réelle, pas sur un programme générique trouvé en ligne. Elle vise trois objectifs prioritaires : la sécurité, la progressivité et la motivation.</p><p>Avec un accompagnement individualisé, chaque séance est ajustée à ton ressenti du jour, et les tests réguliers (équilibre, force, endurance) permettent de mesurer des progrès concrets — souvent visibles dès les premières semaines, sans jamais forcer au-delà de tes capacités.</p>",
    ImageUrl: null,
    SeoTitre: null,
    SeoDescription: null,
    Statut: "Publié",
    DatePublication: "2026-09-01",
    SourceTheme: "APA",
  },
  {
    id: 2,
    Titre: "Pourquoi les régimes stricts ne tiennent jamais",
    Slug: "pourquoi-les-regimes-stricts-ne-tiennent-jamais",
    Categorie: "Nutrition",
    Extrait:
      "Pas besoin de restriction sévère : quelques ajustements durables suffisent pour arrêter le cycle perte-reprise de poids.",
    Contenu:
      "<p>Un régime trop strict crée une frustration que le corps et l'esprit finissent toujours par compenser — c'est le mécanisme même de l'effet yo-yo, pas un manque de volonté.</p><p>Un rééquilibrage adapté à ton quotidien réel (tes horaires, tes contraintes, tes goûts) tient dans la durée précisément parce qu'il ne demande pas de tout changer d'un coup. Mieux vaut trois habitudes qui restent que dix qui durent trois semaines.</p>",
    ImageUrl: null,
    SeoTitre: null,
    SeoDescription: null,
    Statut: "Publié",
    DatePublication: "2026-09-08",
    SourceTheme: "Nutrition",
  },
  {
    id: 3,
    Titre: "Bowl protéiné post-effort, prêt en 10 minutes",
    Slug: "bowl-proteine-post-effort",
    Categorie: "Recette",
    Extrait:
      "Une recette simple et équilibrée à préparer après ta séance pour bien récupérer.",
    Contenu:
      "<p><strong>Ingrédients (1 personne) :</strong> quinoa cuit, pois chiches, œuf mollet, avocat, tomates cerises, filet d'huile d'olive, citron.</p><p>Mélange le quinoa tiède avec les pois chiches, ajoute l'avocat en tranches et les tomates coupées en deux. Termine avec l'œuf mollet, un filet d'huile d'olive et un peu de jus de citron. Simple, complet, et prêt en moins de 10 minutes.</p>",
    ImageUrl: null,
    SeoTitre: null,
    SeoDescription: null,
    Statut: "Publié",
    DatePublication: "2026-09-15",
    SourceTheme: "Recette",
  },
];
