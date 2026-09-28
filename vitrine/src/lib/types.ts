export type Formule = {
  id: number;
  Nom: string;
  Slug: string;
  Accroche: string;
  DescriptionCourte: string;
  DescriptionLongue: string;
  Prix: number;
  Unite: string;
  DureeSemaines: number | null;
  Inclusions: string;
  Badge: string | null;
  Ordre: number;
  Statut: string;
  CtaLabel: string;
};

export type Article = {
  id: number;
  Titre: string;
  Slug: string;
  Categorie: string;
  Extrait: string;
  Contenu: string;
  ImageUrl: string | null;
  SeoTitre: string | null;
  SeoDescription: string | null;
  Statut: string;
  DatePublication: string | null;
  SourceTheme: string | null;
};
