/**
 * Catalogue fixe de prestations (Priorité ⑤d-1 — complément).
 * Script à exécuter UNE FOIS après déploiement : `npx tsx prisma/seed-prestations.ts`
 * (ou `npm run seed:prestations`). Idempotent — recréer une prestation déjà existante
 * (même nom) est ignoré, donc le relancer par erreur ne duplique rien et ne touche pas
 * aux prestations déjà créées ou modifiées par le coach.
 *
 * Tarifs d'exemple à ajuster ensuite depuis l'app (Prestations → Modifier) — voir le
 * mockup validé avec le coach avant ce script.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const PRESTATIONS: {
  nom: string;
  type: string;
  tarif: number;
  unite: string;
  inclusions: string;
}[] = [
  {
    nom: "Pack intensif",
    type: "Pack",
    tarif: 400,
    unite: "10 séances",
    inclusions: "Bilan initial + bilan final inclus\nRythme soutenu pour des résultats rapides",
  },
  {
    nom: "Suivi trimestriel",
    type: "Abonnement",
    tarif: 480,
    unite: "3 mois",
    inclusions: "12 séances réparties sur le trimestre\nTarif préférentiel vs mensuel",
  },
  {
    nom: "Suivi annuel",
    type: "Abonnement",
    tarif: 1680,
    unite: "an",
    inclusions: "Accompagnement continu toute l'année\n2 bilans d'étape inclus (S6, S9)",
  },
  {
    nom: "Programme remise en forme — 4 semaines",
    type: "Programme",
    tarif: 280,
    unite: "forfait",
    inclusions: "1 séance / semaine + plan nutrition\nBilan en fin de programme",
  },
  {
    nom: "Programme remise en forme — 8 semaines",
    type: "Programme",
    tarif: 480,
    unite: "forfait",
    inclusions: "1 séance / semaine + plan nutrition\nBilans d'étape à S4 et S8",
  },
  {
    nom: "Programme remise en forme — 12 semaines",
    type: "Programme",
    tarif: 650,
    unite: "forfait",
    inclusions: "1 séance / semaine + plan nutrition\nBilans d'étape à S4, S8 et S12",
  },
  {
    nom: "Séance découverte",
    type: "Offre de bienvenue",
    tarif: 25,
    unite: "séance",
    inclusions: "Tarif réduit pour un premier contact\nSans engagement",
  },
  {
    nom: "Bilan découverte -15%",
    type: "Offre de bienvenue",
    tarif: 59,
    unite: "bilan",
    inclusions: "Bilan nutritionnel à tarif réduit\nValable pour un nouveau prospect uniquement",
  },
  {
    nom: "Nutrition avec suivi — 1 mois",
    type: "Nutrition avec suivi",
    tarif: 120,
    unite: "mois",
    inclusions: "Menus personnalisés + ajustements hebdo",
  },
  {
    nom: "Nutrition avec suivi — 3 mois",
    type: "Nutrition avec suivi",
    tarif: 320,
    unite: "3 mois",
    inclusions: "Suivi rapproché, tarif dégressif",
  },
  {
    nom: "Séance collective (petit groupe)",
    type: "Collectif",
    tarif: 25,
    unite: "séance / pers.",
    inclusions: "Groupe de 4 à 6 personnes\nAmbiance motivante, tarif accessible",
  },
  {
    nom: "Téléconsultation ponctuelle",
    type: "Téléconsultation",
    tarif: 45,
    unite: "séance",
    inclusions: "Visio 45 min, sans déplacement",
  },
  {
    nom: "Pack téléconsultation x5",
    type: "Téléconsultation",
    tarif: 200,
    unite: "5 séances",
    inclusions: "Suivi à distance régulier",
  },
  {
    nom: "Abonnement téléconsultation mensuel",
    type: "Téléconsultation",
    tarif: 150,
    unite: "mois",
    inclusions: "4 visios par mois",
  },
  {
    nom: "Bilan complet (hors suivi)",
    type: "Bilan seul",
    tarif: 90,
    unite: "bilan",
    inclusions: "Bilan nutritionnel + bilan d'activité physique\nSans engagement de suivi",
  },
  {
    nom: "Intervention entreprise",
    type: "Entreprise",
    tarif: 800,
    unite: "journée",
    inclusions: "Atelier bien-être pour équipes (8-15 pers.)\nDevis sur mesure au-delà",
  },
  {
    nom: "Carte prépayée 10 séances",
    type: "Carte prépayée",
    tarif: 540,
    unite: "carte",
    inclusions: "10 séances à utiliser sur 12 mois\n27 € la séance au lieu de 30 €",
  },
];

async function main() {
  let crees = 0;
  let ignores = 0;

  for (const p of PRESTATIONS) {
    const existe = await prisma.prestation.findFirst({ where: { nom: p.nom } });
    if (existe) {
      ignores += 1;
      continue;
    }
    await prisma.prestation.create({ data: { ...p, actif: true } });
    crees += 1;
  }

  console.log(`Catalogue de prestations : ${crees} créée(s), ${ignores} déjà existante(s) (ignorée(s)).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
