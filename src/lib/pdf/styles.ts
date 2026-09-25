import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#14201b",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  entreprise: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#0f7a5f",
  },
  meta: {
    fontSize: 10,
    color: "#5b6b64",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#5b6b64",
    marginBottom: 4,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#e3e8e4",
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e3e8e4",
    paddingVertical: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f4f2",
    paddingVertical: 6,
    fontFamily: "Helvetica-Bold",
  },
  colDesignation: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#14201b",
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 12,
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
  },
  mention: {
    fontSize: 8,
    color: "#5b6b64",
    marginTop: 4,
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.5,
  },
  articleTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 12,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#14201b",
    paddingTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#5b6b64",
    textAlign: "center",
  },
});
