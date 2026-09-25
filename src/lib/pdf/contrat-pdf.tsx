import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./styles";

interface Settings {
  nomEntreprise: string;
  siret: string | null;
  adresse: string | null;
}

interface Patient {
  nom: string;
  prenom: string;
  adresse: string | null;
}

function formatFR(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function ContratPDF({
  numero,
  dateDebut,
  settings,
  patient,
  formule,
  inclusions,
  dureeMois,
  frequenceSeances,
  tarif,
  modalitePaiement,
  conditionsAnnulation,
}: {
  numero: string;
  dateDebut: Date;
  settings: Settings;
  patient: Patient;
  formule: string | null;
  inclusions: string | null;
  dureeMois: number | null;
  frequenceSeances: string | null;
  tarif: number | null;
  modalitePaiement: string | null;
  conditionsAnnulation: string | null;
}) {
  const inclusionsList = (inclusions ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>CONTRAT DE PRESTATION APA</Text>
        <Text style={s.meta}>N° {numero} — Fait le {formatFR(dateDebut)}</Text>
        <Text style={[s.paragraph, { marginTop: 12 }]}>
          Accompagnement en Activité Physique Adaptée et Santé — hors cadre médical, obligation de moyens et non de
          résultat.
        </Text>

        <Text style={s.sectionTitle}>Entre les soussignés</Text>
        <Text style={s.paragraph}>
          {settings.nomEntreprise}{settings.siret ? `, SIRET ${settings.siret}` : ""}
          {settings.adresse ? `, ${settings.adresse}` : ""}, ci-après « le Prestataire »,
        </Text>
        <Text style={s.paragraph}>
          Et {patient.prenom} {patient.nom}
          {patient.adresse ? `, ${patient.adresse}` : ""}, ci-après « le Client ».
        </Text>

        <Text style={s.articleTitle}>Article 1 — Objet et formule souscrite</Text>
        <Text style={s.paragraph}>
          Le présent contrat a pour objet la mise en place d&apos;un accompagnement en activité physique adaptée,
          sous forme de séances individuelles et/ou collectives, définies avec le Client lors de l&apos;entretien
          initial. Le Client souscrit à la formule : {formule || "à définir"}.
        </Text>
        {inclusionsList.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ marginBottom: 4 }}>Inclusions de la formule :</Text>
            {inclusionsList.map((line, i) => (
              <Text key={i} style={{ marginBottom: 2 }}>
                • {line}
              </Text>
            ))}
          </View>
        )}

        <Text style={s.articleTitle}>Article 2 — Nature de la prestation</Text>
        <Text style={s.paragraph}>
          Le Prestataire n&apos;est pas un professionnel de santé réglementé. Il ne pose pas de diagnostic, ne
          prescrit pas de traitement, et n&apos;intervient pas en substitution d&apos;un avis médical. En cas de
          prescription médicale d&apos;activité physique adaptée, le Client s&apos;engage à en informer le
          Prestataire et à en fournir copie.
        </Text>

        <Text style={s.articleTitle}>Article 3 — Obligations du Client</Text>
        <Text style={s.paragraph}>
          Communiquer toute information médicale utile à la sécurité des séances (antécédents, traitements,
          contre-indications) ; informer immédiatement le Prestataire de toute douleur, malaise ou changement de son
          état de santé ; respecter les consignes de sécurité données pendant les séances.
        </Text>

        <Text style={s.articleTitle}>Article 4 — Durée, fréquence et tarifs</Text>
        <Text style={s.paragraph}>
          Durée ferme d&apos;engagement : {dureeMois ?? 3} mois à compter de la date de signature, renouvelable
          ensuite par tacite reconduction au mois le mois. Fréquence : {frequenceSeances ?? "à définir"}. Tarif :{" "}
          {tarif !== null ? `${tarif} € / mois TTC` : "à définir"}. Modalités de paiement :{" "}
          {modalitePaiement ?? "à définir"}.
        </Text>

        <Text style={s.articleTitle}>Article 5 — Annulation et report</Text>
        <Text style={s.paragraph}>
          {conditionsAnnulation ||
            "Toute séance annulée moins de 24h avant reste due, sauf cas de force majeure."}
        </Text>

        <Text style={s.articleTitle}>Article 6 — Assurance et responsabilité</Text>
        <Text style={s.paragraph}>
          Le Prestataire dispose d&apos;une assurance responsabilité civile professionnelle couvrant son activité
          d&apos;accompagnement en APA (obligation de moyens, non de résultat).
        </Text>

        <Text style={s.articleTitle}>Article 7 — Droit de rétractation</Text>
        <Text style={s.paragraph}>
          Conformément aux articles L.221-18 et suivants du Code de la consommation, le Client consommant à distance
          ou hors établissement dispose d&apos;un délai de rétractation de 14 (quatorze) jours francs à compter de la
          signature de la présente convention.
        </Text>

        <Text style={s.articleTitle}>Article 8 — Confidentialité et données personnelles</Text>
        <Text style={s.paragraph}>
          Les informations personnelles et de santé recueillies sont traitées de manière confidentielle, conformément
          au RGPD, et ne sont partagées qu&apos;avec l&apos;accord du Client ou lorsque la sécurité de
          l&apos;accompagnement l&apos;exige. Le Client dispose d&apos;un droit d&apos;accès, de rectification et de
          suppression de ses données, à exercer auprès du Prestataire.
        </Text>

        <Text style={s.articleTitle}>Article 9 — Résiliation</Text>
        <Text style={s.paragraph}>
          Le contrat peut être résilié par l&apos;une ou l&apos;autre des parties, par écrit, avec un préavis
          raisonnable et d&apos;un commun accord sur les modalités de fin d&apos;accompagnement.
        </Text>

        <View style={s.signatureRow}>
          <View style={s.signatureBox}>
            <Text>Le Prestataire</Text>
          </View>
          <View style={s.signatureBox}>
            <Text>Le Client</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
