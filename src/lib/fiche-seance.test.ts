import { describe, it, expect } from "vitest";
import { isFicheSeance, parseFicheSeance, ficheSeanceToText, type FicheSeance } from "./fiche-seance";

const ficheValide: FicheSeance = {
  titre: "Séance 5 — phase 1",
  dureeTotale: "40 min",
  objectifs: ["Renforcer le bas du corps", "Rester prudent sur les genoux"],
  materielNecessaire: ["Chaise stable", "Tapis de sol"],
  phases: [
    {
      nom: "Échauffement",
      duree: "8 min",
      exercices: [
        {
          nom: "Mobilité articulaire",
          detailSeries: null,
          rpe: "1-2/10",
          materiel: "Aucun",
          recuperation: null,
          commentFaire: "10 rotations de chevilles, genoux, hanches.",
          securite: "Amplitude confortable.",
          variante: "S'appuyer sur une chaise si besoin.",
          respiration: "Libre et régulière.",
          vigilance: "Observer une raideur avant de poursuivre.",
        },
      ],
    },
  ],
};

describe("isFicheSeance", () => {
  it("accepte une fiche bien formée", () => {
    expect(isFicheSeance(ficheValide)).toBe(true);
  });

  it("rejette une valeur qui n'est pas un objet", () => {
    expect(isFicheSeance(null)).toBe(false);
    expect(isFicheSeance("une fiche en texte libre")).toBe(false);
    expect(isFicheSeance(42)).toBe(false);
  });

  it("rejette un objet auquel il manque un champ obligatoire", () => {
    const sansTitre: Record<string, unknown> = { ...ficheValide };
    delete sansTitre.titre;
    expect(isFicheSeance(sansTitre)).toBe(false);
  });

  it("rejette une fiche sans aucune phase", () => {
    expect(isFicheSeance({ ...ficheValide, phases: [] })).toBe(false);
  });

  it("rejette un exercice dont un champ obligatoire a le mauvais type", () => {
    const corrompue = {
      ...ficheValide,
      phases: [{ ...ficheValide.phases[0], exercices: [{ ...ficheValide.phases[0].exercices[0], rpe: 5 }] }],
    };
    expect(isFicheSeance(corrompue)).toBe(false);
  });

  it("accepte les champs nullable explicitement à null", () => {
    const sansVariante = {
      ...ficheValide,
      phases: [{ ...ficheValide.phases[0], exercices: [{ ...ficheValide.phases[0].exercices[0], variante: null }] }],
    };
    expect(isFicheSeance(sansVariante)).toBe(true);
  });
});

describe("parseFicheSeance", () => {
  it("parse une fiche JSON valide stockée dans Seance.contenu", () => {
    expect(parseFicheSeance(JSON.stringify(ficheValide))).toEqual(ficheValide);
  });

  it("renvoie null pour du texte libre (séances saisies manuellement avant l'assistant)", () => {
    expect(parseFicheSeance("Renforcement membres inf. (chaise, squats guidés)")).toBeNull();
  });

  it("renvoie null pour du JSON valide mais de forme inattendue", () => {
    expect(parseFicheSeance(JSON.stringify({ foo: "bar" }))).toBeNull();
  });

  it("renvoie null pour un contenu vide ou absent", () => {
    expect(parseFicheSeance(null)).toBeNull();
    expect(parseFicheSeance(undefined)).toBeNull();
    expect(parseFicheSeance("")).toBeNull();
  });
});

describe("ficheSeanceToText", () => {
  it("produit un texte lisible contenant les informations clés", () => {
    const texte = ficheSeanceToText(ficheValide);
    expect(texte).toContain("Séance 5 — phase 1");
    expect(texte).toContain("40 min");
    expect(texte).toContain("Renforcer le bas du corps");
    expect(texte).toContain("Chaise stable, Tapis de sol");
    expect(texte).toContain("ÉCHAUFFEMENT (8 min)");
    expect(texte).toContain("Mobilité articulaire");
    expect(texte).toContain("RPE 1-2/10");
  });

  it("omet la ligne Variante quand elle est absente", () => {
    const sansVariante: FicheSeance = {
      ...ficheValide,
      phases: [{ ...ficheValide.phases[0], exercices: [{ ...ficheValide.phases[0].exercices[0], variante: null }] }],
    };
    expect(ficheSeanceToText(sansVariante)).not.toContain("Variante");
  });
});
