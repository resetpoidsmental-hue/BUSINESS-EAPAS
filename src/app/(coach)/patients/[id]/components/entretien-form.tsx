"use client";

import { useActionState } from "react";
import { addEntretien, type ActionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

// Même formulaire, même modèle de données pour tous les patients — seule la formulation du script
// change selon le pôle, pour rester pertinente (mouvement pour l'EAPAS, alimentation pour la
// Nutrition). Un patient "EAPAS + Nutrition" garde le script EAPAS ici ; son rapport à l'alimentation
// est couvert séparément par le bilan nutritionnel dans l'onglet Nutrition.
const SCRIPTS_EAPAS: Record<string, string> = {
  ressentiDemarrage: "Comment vous sentez-vous à l'idée de démarrer cet accompagnement aujourd'hui ?",
  experienceAnterieure: "Avez-vous déjà eu une expérience, positive ou négative, avec une activité physique encadrée ?",
  quotidien: "Parlez-moi un peu de votre quotidien : vos activités, votre rythme, qui vous entoure.",
  depuisQuand: "Depuis quand avez-vous l'impression que votre rapport au mouvement a changé ?",
  prescritConseillePar: "Est-ce que quelqu'un — médecin, kiné, un proche — vous a orienté vers cette démarche ? Que vous a-t-on dit ?",
  declencheur: "Qu'est-ce qui vous a décidé à venir aujourd'hui ?",
  representationAP: "Quand vous pensez à l'activité physique, est-ce plutôt une contrainte, un plaisir, ou encore un peu flou pour vous ?",
  souvenirPositif: "Y a-t-il un souvenir de mouvement — une activité, un sport, une balade — qui vous a fait du bien, à n'importe quel moment de votre vie ?",
  objectifPatientMots: "Si dans 3 mois vous étiez satisfait(e), qu'est-ce qui aurait changé ?",
  gesteAPreserver: "Y a-t-il un geste ou une activité du quotidien que vous aimeriez retrouver, ou ne surtout pas perdre ?",
  limitationsMedecin: "Est-ce que votre médecin ou kiné vous a donné des recommandations ou des limites particulières ?",
  douleursApprehensions: "Y a-t-il des douleurs ou des appréhensions dont je dois avoir connaissance, pour adapter chaque séance en toute sécurité ?",
  attentesCoach: "Qu'attendez-vous de notre accompagnement ensemble ?",
  freinsPotentiels: "Qu'est-ce qui pourrait, selon vous, rendre les choses plus difficiles — le temps, la fatigue, la motivation, les déplacements ?",
  modaliteCommunication: "Comment préférez-vous que l'on reste en contact entre les séances ?",
  activitesActuelles: "Pour finir, quelles activités pratiquez-vous déjà aujourd'hui, même occasionnellement ?",
};

const SCRIPTS_NUTRITION: Record<string, string> = {
  ressentiDemarrage: "Comment vous sentez-vous à l'idée de démarrer un suivi nutritionnel aujourd'hui ?",
  experienceAnterieure: "Avez-vous déjà suivi un régime, un programme ou un accompagnement nutritionnel ? Qu'est-ce qui a, ou n'a pas, fonctionné ?",
  quotidien: "Parlez-moi de votre quotidien alimentaire : qui cuisine, à quelle heure vous mangez, votre rythme de vie.",
  depuisQuand: "Depuis quand avez-vous l'impression que votre rapport à l'alimentation s'est compliqué ?",
  prescritConseillePar: "Est-ce qu'un médecin ou un proche vous a orienté vers cette démarche ? Que vous a-t-on dit ?",
  declencheur: "Qu'est-ce qui vous a décidé à entamer ce suivi aujourd'hui ?",
  representationAP: "Quand vous pensez à « manger équilibré », est-ce une contrainte, un plaisir, ou encore flou pour vous ?",
  souvenirPositif: "Y a-t-il un repas, un moment autour de la nourriture qui vous a fait particulièrement du bien ?",
  objectifPatientMots: "Si dans 3 mois vous étiez satisfait(e), qu'est-ce qui aurait changé dans votre alimentation ou votre poids ?",
  gesteAPreserver: "Y a-t-il un plaisir alimentaire auquel vous ne voulez surtout pas renoncer ?",
  limitationsMedecin: "Avez-vous des allergies, intolérances, ou recommandations médicales à propos de votre alimentation ?",
  douleursApprehensions: "Y a-t-il des aliments ou des situations — repas de famille, cantine, restaurant — qui vous mettent en difficulté ?",
  attentesCoach: "Qu'attendez-vous de notre accompagnement nutritionnel ?",
  freinsPotentiels: "Qu'est-ce qui pourrait rendre les choses plus difficiles — le temps de cuisiner, le budget, l'entourage, les habitudes ?",
  modaliteCommunication: "Comment préférez-vous qu'on reste en contact entre nos échanges ?",
  activitesActuelles: "Pour finir, décrivez-moi une journée alimentaire type, même approximative.",
};

const OUVERTURE: Record<"EAPAS" | "Nutrition", string> = {
  EAPAS:
    "Bonjour [Prénom], merci d'avoir pris ce temps avec moi. Cet échange sert à faire connaissance et à comprendre où vous en êtes, pour construire ensemble un accompagnement qui vous correspond vraiment — il n'y a pas de bonne ou de mauvaise réponse, prenez le temps qu'il vous faut.",
  Nutrition:
    "Bonjour [Prénom], merci pour ce temps. On va faire connaissance avec votre rapport à l'alimentation, sans jugement — l'idée est de comprendre vos habitudes réelles pour construire quelque chose qui tienne dans la durée.",
};

const CLOTURE: Record<"EAPAS" | "Nutrition", string> = {
  EAPAS:
    "Merci pour votre confiance, [Prénom]. Je vais maintenant préparer un premier bilan et un programme pensé pour vous — on se retrouve très vite pour démarrer ensemble.",
  Nutrition:
    "Merci pour votre sincérité, [Prénom]. Je vais établir votre bilan nutritionnel et vous proposer un programme personnalisé — on se retrouve très vite.",
};

function Field({ label, name, scripts }: { label: string; name: string; scripts: Record<string, string> }) {
  const script = scripts[name];
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {script && <p className="text-xs italic text-muted">« {script} »</p>}
      <Textarea id={name} name={name} rows={2} />
    </div>
  );
}

export function EntretienForm({ patientId, metier }: { patientId: string; metier: string }) {
  const action = addEntretien.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const pole = metier === "Nutrition" ? "Nutrition" : "EAPAS";
  const scripts = pole === "Nutrition" ? SCRIPTS_NUTRITION : SCRIPTS_EAPAS;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="rounded-[var(--radius-sm)] border border-primary bg-primary-soft p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Ouverture</p>
        <p className="text-sm italic text-foreground">« {OUVERTURE[pole]} »</p>
      </div>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">A. Accueil et mise en confiance</h3>
        <Field name="ressentiDemarrage" label="Ressenti à l'idée de démarrer" scripts={scripts} />
        <Field name="experienceAnterieure" label="Expérience antérieure encadrée" scripts={scripts} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">B. Parcours de vie et de santé</h3>
        <Field name="quotidien" label="Quotidien actuel (activités, rythme, entourage)" scripts={scripts} />
        <Field name="depuisQuand" label="Depuis quand la situation a changé" scripts={scripts} />
        <Field name="prescritConseillePar" label="Ce qui a été prescrit / conseillé, et par qui" scripts={scripts} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">
          C. Motivations et représentation {pole === "Nutrition" ? "de l'alimentation" : "de l'AP"}
        </h3>
        <Field name="declencheur" label="Déclencheur de la démarche" scripts={scripts} />
        <Field name="representationAP" label="Représentation (contrainte / plaisir / inconnue)" scripts={scripts} />
        <Field name="souvenirPositif" label="Souvenir positif" scripts={scripts} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">D. Objectifs, dans les mots du patient</h3>
        <Field name="objectifPatientMots" label="Objectif exprimé (ses mots)" scripts={scripts} />
        <Field name="gesteAPreserver" label="Ce qu'il/elle aimerait retrouver ou préserver" scripts={scripts} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">E. Limitations et cadre médical</h3>
        <Field name="limitationsMedecin" label="Recommandations / limitations du médecin" scripts={scripts} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evaDouleur">Douleur actuelle (EVA /10)</Label>
            <Input id="evaDouleur" name="evaDouleur" type="number" min={0} max={10} />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" name="chutes12Mois" className="h-4 w-4 rounded border-border" />
            Chute(s) dans les 12 derniers mois
          </label>
        </div>
        <Field name="douleursApprehensions" label="Douleurs, appréhensions, gestes/aliments à éviter" scripts={scripts} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">F. Attentes, craintes et freins</h3>
        <Field name="attentesCoach" label="Attentes vis-à-vis de l'accompagnement" scripts={scripts} />
        <Field name="freinsPotentiels" label="Freins potentiels" scripts={scripts} />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-primary">G. Clôture et engagement mutuel</h3>
        <Field name="modaliteCommunication" label="Modalités de communication entre les séances" scripts={scripts} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tempsAssisParJour">Temps assis / jour (min)</Label>
            <Input id="tempsAssisParJour" name="tempsAssisParJour" type="number" min={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activitesActuelles">{pole === "Nutrition" ? "Journée alimentaire type" : "Activités actuelles"}</Label>
            <Input id="activitesActuelles" name="activitesActuelles" />
          </div>
        </div>
      </section>

      <div className="rounded-[var(--radius-sm)] border border-primary bg-primary-soft p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Clôture</p>
        <p className="text-sm italic text-foreground">« {CLOTURE[pole]} »</p>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'entretien"}
        </Button>
      </div>
    </form>
  );
}
