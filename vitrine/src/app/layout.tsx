import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Santé & Co — Activité physique adaptée & coaching nutrition",
    template: "%s — Santé & Co",
  },
  description:
    "Programmes d'activité physique adaptée (EAPAS) et de coaching nutrition avec Martial MILON. Reprends le mouvement et l'équilibre alimentaire à ton rythme, avec un suivi personnalisé.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${fraunces.variable} ${workSans.variable} antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
