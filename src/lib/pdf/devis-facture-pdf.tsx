import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./styles";

interface Settings {
  nomEntreprise: string;
  siret: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  mentionTVA: string;
  assuranceRCPro: string | null;
}

interface Patient {
  nom: string;
  prenom: string;
  adresse: string | null;
}

interface Ligne {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

function formatEUR(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatFR(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function DevisFacturePDF({
  kind,
  numero,
  date,
  settings,
  patient,
  lignes,
  total,
  validiteJours,
  dateEcheance,
  modeReglement,
  statut,
}: {
  kind: "devis" | "facture";
  numero: string;
  date: Date;
  settings: Settings;
  patient: Patient;
  lignes: Ligne[];
  total: number;
  validiteJours?: number;
  dateEcheance?: Date | null;
  modeReglement?: string | null;
  statut?: string;
}) {
  const label = kind === "devis" ? "DEVIS" : "FACTURE";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View style={s.entreprise}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{settings.nomEntreprise}</Text>
            {settings.adresse && <Text>{settings.adresse}</Text>}
            {settings.telephone && <Text>{settings.telephone}</Text>}
            {settings.email && <Text>{settings.email}</Text>}
            {settings.siret && <Text>SIRET : {settings.siret}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.title}>{label}</Text>
            <Text style={s.meta}>N° {numero}</Text>
            <Text style={s.meta}>Date : {formatFR(date)}</Text>
            {kind === "devis" && validiteJours && (
              <Text style={s.meta}>Validité : {validiteJours} jours</Text>
            )}
            {kind === "facture" && dateEcheance && (
              <Text style={s.meta}>Échéance : {formatFR(dateEcheance)}</Text>
            )}
            {statut && <Text style={s.meta}>Statut : {statut}</Text>}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{kind === "devis" ? "Client" : "Facturé à"}</Text>
          <Text>
            {patient.prenom} {patient.nom}
          </Text>
          {patient.adresse && <Text>{patient.adresse}</Text>}
        </View>

        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={s.colDesignation}>Désignation</Text>
            <Text style={s.colQty}>Qté</Text>
            <Text style={s.colPrice}>Prix unit.</Text>
            <Text style={s.colTotal}>Total</Text>
          </View>
          {lignes.map((l, i) => (
            <View style={s.tableRow} key={i}>
              <Text style={s.colDesignation}>{l.designation}</Text>
              <Text style={s.colQty}>{l.quantite}</Text>
              <Text style={s.colPrice}>{formatEUR(l.prixUnitaire)}</Text>
              <Text style={s.colTotal}>{formatEUR(l.quantite * l.prixUnitaire)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL {kind === "facture" ? "À PAYER" : ""}</Text>
          <Text style={s.totalValue}>{formatEUR(total)}</Text>
        </View>

        <Text style={s.mention}>{settings.mentionTVA}</Text>
        {settings.assuranceRCPro && <Text style={s.mention}>Assurance RC Pro : {settings.assuranceRCPro}</Text>}

        {kind === "devis" ? (
          <View style={{ marginTop: 30 }}>
            <Text style={s.paragraph}>
              Ce devis n&apos;engage le client qu&apos;après signature et mention « Bon pour accord ».
            </Text>
            <Text>Bon pour accord, le ______________ — Signature du client :</Text>
          </View>
        ) : (
          modeReglement && <Text style={{ marginTop: 20 }}>Mode de règlement : {modeReglement}</Text>
        )}
      </Page>
    </Document>
  );
}
