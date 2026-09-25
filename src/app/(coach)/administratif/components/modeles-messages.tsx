"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

function CopyBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <Button type="button" size="sm" variant="secondary" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copié !" : "Copier"}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-[var(--radius-sm)] bg-surface-muted p-4 text-sm leading-relaxed">
          {text}
        </pre>
      </CardContent>
    </Card>
  );
}

export function ModelesMessages({ nomEntreprise }: { nomEntreprise: string }) {
  const emailBienvenue = `Objet : Bienvenue dans votre accompagnement Santé & Nutrition, [Prénom] !

Bonjour [Prénom],

Je suis ravi(e) de vous compter parmi mes accompagnés ! Votre contrat pour la [Formule] est bien validé et votre parcours personnalisé commence officiellement aujourd'hui.

Ce qui vous attend dès maintenant :
1. Votre premier rendez-vous de Bilan Initial est fixé au [Date et Heure] à [Lieu / Visioconférence].
2. Un second e-mail vous parvient avec votre questionnaire de santé (PAR-Q+) et votre journal alimentaire préparatoire.
3. Votre espace de suivi est en cours de configuration.

Mon objectif est de vous accompagner à votre rythme, en toute bienveillance et en sécurité. Si vous avez la moindre question d'ici notre rendez-vous, vous pouvez me contacter directement par retour de cet e-mail.

À très vite pour démarrer cette belle aventure !

Sportivement et chaleureusement,
${nomEntreprise}
[Votre Téléphone] | [Votre Site Web]`;

  const messagePreRdv = `Objet : Préparation de notre 1er Bilan Initial : Consignes simples

Bonjour [Prénom],

Notre premier rendez-vous approche ! Afin de construire un programme 100% sur-mesure et adapté à votre profil, voici 3 petites étapes simples à préparer avant notre rencontre :

1. Le Questionnaire de Santé (PAR-Q+) : Merci de compléter le formulaire joint. Si vous avez une ordonnance médicale pour l'APA, pensez à l'apporter.
2. Le Journal Alimentaire (3 jours) : Notez simplement tout ce que vous consommez sur 3 jours consécutifs (dont 1 jour de week-end). Pas de restriction ni de jugement : l'idée est de comprendre vos habitudes actuelles !
3. Tenue confortable : Pour les tests d'évaluation physique légers (test de marche, lever de chaise), prévoyez une tenue souple et des baskets propres.

Si vous avez le moindre doute, n'hésitez pas. J'ai hâte de commencer !

Chaleureusement,
${nomEntreprise}`;

  const livretAccueil = `LIVRET D'ACCUEIL — LES 5 RÈGLES D'OR DE NOTRE ACCOMPAGNEMENT

1. Régularité & Assiduité
   Coach : maintien des créneaux, planification des séances et relances bienveillantes.
   Client : prioriser ses créneaux d'APA et prévenir 24h à l'avance en cas d'imprévu.

2. Communication ouverte
   Coach : écoute active, adaptation constante selon la fatigue et le stress.
   Client : exprimer ses ressentis, douleurs ou difficultés sans crainte de jugement.

3. Progression adaptée
   Coach : utilisation de tests validés et de l'échelle de Borg (effort perçu).
   Client : respecter les intensités fixées sans chercher à sur-performer inutilement.

4. Éducation nutritionnelle
   Coach : conseils basés sur le PNNS/ANSES, pas de régimes drastiques.
   Client : tester progressivement les ajustements repas et noter ses impressions.

5. Autonomisation
   Coach : transmission des clés d'auto-gestion physique et alimentaire.
   Client : devenir progressivement acteur de sa santé au quotidien.`;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        Modèles prêts à copier-coller pour l&apos;accueil de tes nouveaux clients. Remplace les champs entre crochets
        avant l&apos;envoi.
      </p>
      <CopyBlock title="E-mail de bienvenue (à envoyer après signature + 1er règlement)" text={emailBienvenue} />
      <CopyBlock title="Message pré-1er RDV (3 à 5 jours avant la séance)" text={messagePreRdv} />
      <CopyBlock title="Livret d'accueil — 5 règles d'or" text={livretAccueil} />
    </div>
  );
}
