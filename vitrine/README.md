# Site vitrine — Santé & Co

Site public (marketing/SEO) séparé de l'application EAPAS Suite, mais connecté à elle
via n8n : formulaire de contact → prospect notifié par Telegram, et contenu (articles,
recettes) généré automatiquement chaque semaine par un agent IA, **validé par toi sur
Telegram avant publication**.

- Contenu (Formules, Articles) : stocké dans **NocoDB** (déjà installé sur ton VPS).
- Génération hebdomadaire + validation : deux workflows **n8n**, configurés et actifs.
- Le site affiche un contenu de secours (2 formules, 3 articles) si jamais NocoDB
  devient injoignable — sinon il lit les vraies données.

## État actuel (à jour)

- Le code du site (`vitrine/`) est prêt et testé.
- Les 3 tables NocoDB (`Formules`, `Articles`, `Leads`) sont créées et remplies avec les
  vraies formules (Essentiel 89€, Premium 149€, Ultimate 229€).
- Les deux workflows n8n sont **actifs** et testés en conditions réelles de bout en bout :
  - [Vitrine - Contenu hebdo (génération + validation Telegram)](https://n8n.srv1566455.hstgr.cloud/workflow/24ckhBsSYcfK9utf) —
    rédaction Claude → image OpenAI (`gpt-image-1-mini`) → hébergement NocoDB → validation
    Telegram → publication. Tourne chaque lundi à 8h.
  - [Vitrine - Nouveau prospect](https://n8n.srv1566455.hstgr.cloud/workflow/vNjH401C8TCPiyAB) —
    reçoit le formulaire de contact, enregistre le prospect dans NocoDB, notifie le coach
    sur Telegram.

Les sections ci-dessous documentent comment c'est configuré (utile si tu dois un jour
recréer un credential, changer de VPS, ou comprendre un réglage) — ce n'est plus une
checklist à faire.

## Référence — structure NocoDB

Dans NocoDB, crée une nouvelle base nommée exactement **`EAPAS Vitrine`**, puis crée ces
3 tables avec ces champs exacts (les noms comptent, en majuscules/minuscules) :

**Table `Formules`**

| Champ | Type |
|---|---|
| Nom | Single line text |
| Slug | Single line text |
| Accroche | Single line text |
| DescriptionCourte | Long text |
| DescriptionLongue | Long text |
| Prix | Number |
| Unite | Single line text (ex. `/mois`) |
| DureeSemaines | Number |
| Inclusions | Long text (une ligne par élément inclus) |
| Badge | Single line text (ex. `Populaire`, laisser vide sinon) |
| Ordre | Number |
| Statut | Single select : `Actif`, `Inactif` |
| CtaLabel | Single line text (ex. `Réserver un appel découverte`) |

**Table `Articles`**

| Champ | Type |
|---|---|
| Titre | Single line text |
| Slug | Single line text |
| Categorie | Single select : `APA`, `Nutrition`, `Bien-être`, `Recette`, `Activité physique`, `Motivation` |
| Extrait | Long text |
| Contenu | Long text (HTML) |
| ImageUrl | Single line text (URL) |
| ImageFichier | **Attachment** — stocke le fichier image généré par OpenAI ; `ImageUrl` est automatiquement rempli avec l'URL publique de ce fichier par le workflow hebdomadaire. |
| SeoTitre | Single line text |
| SeoDescription | Long text |
| Statut | Single select : `Brouillon`, `En attente de validation`, `Publié`, `Rejeté` |
| DatePublication | Date |
| SourceTheme | Single line text |

**Table `Leads`**

| Champ | Type |
|---|---|
| Nom | Single line text |
| Email | Email |
| Telephone | Phone number |
| Message | Long text |
| FormuleInteressee | Single line text |
| Source | Single line text |
| Statut | Single select : `Nouveau`, `Contacté`, `Converti`, `Perdu` |

## Référence — credentials n8n

Credentials déjà créés dans n8n (**Credentials** dans le menu de gauche) :

1. **Header Auth** `NocoDB - xc-token` — Name: `xc-token`, Value: ton token NocoDB
   (généré dans NocoDB via avatar → **Account Settings** → **Tokens**).
2. **Telegram API** `Telegram - Bot EAPAS Vitrine` — token du bot (créé via @BotFather
   sur Telegram).
3. **OpenAI** — clé API OpenAI (génération d'image des articles).
4. **NocoDB API Token** `NocoDB Token account` — Host = l'URL de base de ton instance
   NocoDB (sans chemin après le domaine), API Token = le même token qu'au point 1.
   C'est un type de credential différent du Header Auth, requis par le nœud d'upload
   d'image NocoDB.

Si un credential doit être recréé, ouvre le workflow concerné et sélectionne-le sur
chaque nœud qui affiche un triangle d'avertissement. Sur **"NocoDB - Uploader image"**,
vérifie aussi que le champ `ImageFichier` est bien sélectionné dans le paramètre
"Field Name".

## Déployer le site sur le VPS

```bash
cd eapas-suite/vitrine   # ou l'emplacement où tu as cloné le dépôt
cp .env.example .env
nano .env                # renseigne NOCODB_URL, NOCODB_API_TOKEN, N8N_LEAD_WEBHOOK_URL, SITE_HOST
docker compose up -d --build
```

Choisis pour `SITE_HOST` l'adresse que tu veux pour la vitrine (par exemple
`sante-and-co.com` ou `www.sante-and-co.com`), et crée l'enregistrement DNS **A**
correspondant chez PlanetHoster comme tu l'as fait pour `eapa.sante-and-co.com`.

## Notes

- Le formulaire de contact répond immédiatement au visiteur (le prospect est enregistré
  et toi notifié en arrière-plan) — pas d'attente côté site.
- Les images d'articles sont générées par OpenAI (modèle `gpt-image-1-mini`) à partir
  d'une description que Claude rédige pour chaque article, puis hébergées sur ton
  instance NocoDB (champ `ImageFichier`) pour obtenir une URL permanente — contrairement
  à une URL OpenAI brute, qui expire après environ 1h.
- Le thème hebdomadaire est tiré selon une rotation pondérée : 70% des semaines portent
  sur des catégories alignées avec le positionnement actuel (Nutrition, Activité
  physique, Recette, Motivation), 30% sur des catégories plus larges (APA, Bien-être)
  pour le référencement et les publics futurs. Ajustable dans le nœud "Choisir le theme
  de la semaine" (tableau `rotation`).
- Volontairement, le thème « médecine naturelle » n'est pas couvert par la génération
  automatique : les contenus santé générés sans supervision se limitent à l'activité
  physique adaptée, la nutrition, le bien-être et les recettes — des sujets sur lesquels
  Claude peut rester factuel sans risquer de relayer des allégations non vérifiées. Tu
  peux bien sûr écrire toi-même un article sur ce thème directement dans NocoDB.
- Pour changer d'outil de génération d'image plus tard (ex. un autre modèle), il suffit
  de remplacer le nœud "OpenAI - Generer image" dans le workflow — tout le reste du
  système (hébergement NocoDB, Telegram, le site) continue de fonctionner à l'identique.
