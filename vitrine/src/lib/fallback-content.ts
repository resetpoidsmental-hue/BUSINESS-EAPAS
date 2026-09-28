import type { Article, Formule } from "./types";

export const FORMULES_SECOURS: Formule[] = [
  {
    id: 1,
    Nom: "Essentiel",
    Slug: "essentiel",
    Accroche: "Reprendre une activité physique en toute sécurité",
    DescriptionCourte:
      "Le programme d'entrée pour retrouver le mouvement à ton rythme, avec un suivi personnalisé chaque semaine.",
    DescriptionLongue:
      "Le programme Essentiel s'adresse à toute personne qui souhaite reprendre une activité physique adaptée à sa condition — après une pathologie, une période sédentaire ou simplement pour se sentir mieux au quotidien.\n\nTu bénéficies d'un bilan initial complet (tests physiques, entretien de tes objectifs), puis de séances individuelles pensées pour toi et d'un point de suivi régulier pour ajuster le programme.",
    Prix: 89,
    Unite: "/mois",
    DureeSemaines: 12,
    Inclusions:
      "Bilan initial complet (tests PASS, entretien)\n1 séance individuelle par semaine\nProgramme d'exercices personnalisé\nSuivi de progression avec bilans intermédiaires\nAccès à ton espace patient en ligne",
    Badge: null,
    Ordre: 1,
    Statut: "Actif",
    CtaLabel: "Réserver un appel découverte",
  },
  {
    id: 2,
    Nom: "Premium",
    Slug: "premium",
    Accroche: "L'accompagnement complet APA + Nutrition",
    DescriptionCourte:
      "Le programme le plus complet : activité physique adaptée et coaching nutrition réunis pour des résultats durables.",
    DescriptionLongue:
      "Le programme Premium combine le suivi en activité physique adaptée et un accompagnement nutritionnel personnalisé, pour agir sur tous les leviers de ta santé.\n\nEn plus du contenu du programme Essentiel, tu profites d'un bilan nutritionnel complet, d'un suivi diététique régulier et d'un contact prioritaire avec ton coach entre les séances.",
    Prix: 149,
    Unite: "/mois",
    DureeSemaines: 12,
    Inclusions:
      "Tout le contenu du programme Essentiel\nBilan nutritionnel complet\n1 point nutrition par quinzaine\nRecettes et conseils personnalisés\nContact prioritaire avec ton coach",
    Badge: "Populaire",
    Ordre: 2,
    Statut: "Actif",
    CtaLabel: "Réserver un appel découverte",
  },
];

export const ARTICLES_SECOURS: Article[] = [
  {
    id: 1,
    Titre: "Pourquoi l'activité physique adaptée change tout après 50 ans",
    Slug: "activite-physique-adaptee-apres-50-ans",
    Categorie: "APA",
    Extrait:
      "Renforcer l'équilibre, préserver l'autonomie, retrouver confiance en son corps : voici pourquoi un programme adapté fait la différence.",
    Contenu:
      "<p>L'activité physique adaptée (APA) s'appuie sur des exercices pensés pour ta condition physique réelle, pas sur un programme générique. Elle vise trois objectifs prioritaires : la sécurité, la progressivité et la motivation.</p><p>Avec un accompagnement individualisé, chaque séance est ajustée à ton ressenti du jour, et les tests réguliers (équilibre, force, endurance) permettent de mesurer des progrès concrets — souvent visibles dès les premières semaines.</p>",
    ImageUrl: null,
    SeoTitre: null,
    SeoDescription: null,
    Statut: "Publié",
    DatePublication: "2026-09-01",
    SourceTheme: "APA",
  },
  {
    id: 2,
    Titre: "3 réflexes nutrition pour soutenir tes séances",
    Slug: "3-reflexes-nutrition-pour-soutenir-tes-seances",
    Categorie: "Nutrition",
    Extrait:
      "Pas besoin de régime strict : quelques ajustements simples suffisent pour mieux récupérer et progresser plus vite.",
    Contenu:
      "<p>Avant une séance, privilégie un repas léger riche en glucides complexes deux à trois heures avant l'effort. Après, un apport en protéines dans l'heure qui suit favorise la récupération musculaire.</p><p>Enfin, l'hydratation reste le réflexe le plus souvent négligé : bois régulièrement dans la journée, pas seulement pendant l'effort.</p>",
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
