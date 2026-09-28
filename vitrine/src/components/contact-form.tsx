"use client";

import { useActionState } from "react";
import { submitLead, type LeadFormState } from "@/app/contact/actions";

const INITIAL_STATE: LeadFormState = { status: "idle" };

export function ContactForm({ formules }: { formules: string[] }) {
  const [state, formAction, pending] = useActionState(submitLead, INITIAL_STATE);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary-soft p-8 text-center">
        <p className="font-display text-lg font-semibold text-ink">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nom" className="text-sm font-medium text-ink">
            Nom
          </label>
          <input
            id="nom"
            name="nom"
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="telephone" className="text-sm font-medium text-ink">
            Téléphone (optionnel)
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="formule" className="text-sm font-medium text-ink">
            Formule qui t&rsquo;intéresse
          </label>
          <select
            id="formule"
            name="formule"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            defaultValue=""
          >
            <option value="">Je ne sais pas encore</option>
            {formules.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium text-ink">
          Ton message (optionnel)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {state.status === "error" && (
        <p className="rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
