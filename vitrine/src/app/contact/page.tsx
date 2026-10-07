import type { Metadata } from "next";
import { getFormules } from "@/lib/nocodb";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Réserve ton appel découverte gratuit et sans engagement avec Santé & Co, pour faire le point sur ton parcours et tes objectifs.",
};

export default async function ContactPage() {
  const formules = await getFormules();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Contact</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ink">
        Prêt·e à arrêter le yo-yo ?
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        15 minutes, en visio, gratuites et sans engagement : on fait le point sur ton
        parcours (régimes essayés, contraintes, objectifs) pour voir si
        l&rsquo;accompagnement est fait pour toi.
      </p>

      <div className="mt-10">
        <ContactForm formules={formules.map((f) => f.Nom)} />
      </div>
    </div>
  );
}
