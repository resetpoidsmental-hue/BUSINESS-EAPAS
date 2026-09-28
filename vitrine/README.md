# Site vitrine — Santé & Co

Site public (marketing/SEO) séparé de l'application EAPAS Suite, mais connecté à elle
via n8n : formulaire de contact → prospect notifié par Telegram, et contenu (articles,
recettes) généré automatiquement chaque semaine par un agent IA, **validé par toi sur
Telegram avant publication**.

- Contenu (Formules, Articles) : stocké dans **NocoDB** (déjà installé sur ton VPS).
- Génération hebdomadaire + validation : deux workflows **n8n** (déjà créés, à finir de
  configurer — voir plus bas).
- Le site fonctionne dès le déploiement même sans rien configurer : il affiche un
  contenu de secours (2 formules, 3 articles) tant que NocoDB n'est pas branché.

## Ce qui a déjà été fait pour toi

- Le code du site (`vitrine/`) est prêt et testé.
- Les deux workflows n8n sont créés (mais **inactifs**, le temps que tu configures les
  identifiants) :
  - [Vitrine - Contenu hebdo (génération + validation Telegram)](https://n8n.srv1566455.hstgr.cloud/workflow/24ckhBsSYcfK9utf)
  - [Vitrine - Nouveau prospect](https://n8n.srv1566455.hstgr.cloud/workflow/vNjH401C8TCPiyAB)

Il te reste 6 étapes manuelles (aucune ne demande de compétence technique particulière,
tu as déjà fait des choses plus compliquées pour EAPAS Suite !).

## Étape 1 — Créer la base et les tables dans NocoDB

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

Tu peux ensuite ajouter tes vraies formules dans `Formules` (statut `Actif`). Pour
`Articles`, laisse-la vide : c'est le workflow hebdomadaire qui la remplit.

## Étape 2 — Créer un token API NocoDB

Dans NocoDB : clique sur ton avatar (en bas à gauche) → **Account Settings** → **Tokens**
→ **Create New Token**. Copie la valeur générée, tu en auras besoin à l'étape 4.

## Étape 3 — Créer un bot Telegram

1. Ouvre Telegram, cherche **@BotFather**, envoie `/newbot`, suis les instructions
   (choisis un nom et un nom d'utilisateur se terminant par `bot`).
2. BotFather te donne un **token** (garde-le précieusement, c'est comme un mot de passe).
3. Démarre une conversation avec ton nouveau bot (cherche-le par son nom d'utilisateur,
   clique sur "Démarrer" / `/start`).
4. Pour connaître ton **chat_id** : cherche **@userinfobot** sur Telegram, démarre une
   conversation avec lui, il t'affiche immédiatement ton `Id` — c'est ton chat_id.

## Étape 4 — Configurer les identifiants dans n8n

Dans n8n (**Credentials** dans le menu de gauche) :

1. **Nouveau credential** → type **Header Auth** → nomme-le `NocoDB - xc-token` →
   Name: `xc-token`, Value: le token copié à l'étape 2.
2. **Nouveau credential** → type **Telegram API** → nomme-le
   `Telegram - Bot EAPAS Vitrine` → colle le token du bot (étape 3).

Ouvre ensuite chacun des deux workflows ci-dessus et, sur chaque nœud qui affiche un
triangle d'avertissement (nœuds NocoDB et Telegram), sélectionne le credential que tu
viens de créer dans le menu déroulant "Credential to connect with". Sur le nœud
**"Claude - Rediger article"**, vérifie qu'un credential Anthropic est bien sélectionné
(un de ceux déjà existants convient).

## Étape 5 — Ajouter les variables d'environnement au conteneur n8n

Édite le fichier `.env` (ou `docker-compose.yml`) qui sert à lancer ton conteneur n8n
sur le VPS, et ajoute ces lignes (remplace les valeurs par les tiennes) :

```
NOCODB_URL=https://nocodb.sante-and-co.com
NOCODB_TABLE_ARTICLES_ID=coller_ici_l_ID_de_la_table_Articles
NOCODB_TABLE_LEADS_ID=coller_ici_l_ID_de_la_table_Leads
TELEGRAM_CHAT_ID=ton_chat_id_de_l_etape_3
```

Pour trouver l'ID d'une table dans NocoDB : ouvre la table, puis dans la barre d'adresse
de ton navigateur l'URL contient un segment qui commence par `m` (ex. `mZ3k9...`) — c'est
l'ID de la table. Tu peux aussi le trouver via **API Docs** dans les réglages de la base.

Puis redémarre le conteneur n8n pour que les nouvelles variables soient prises en compte
(`docker compose up -d` dans le dossier de ton n8n).

## Étape 6 — Activer les workflows

Dans n8n, ouvre les deux workflows et bascule l'interrupteur **Active** en haut à droite
de chacun. C'est tout : le contenu hebdomadaire démarrera le lundi suivant à 8h, et le
formulaire de contact du site fonctionnera immédiatement.

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
- Les images d'articles sont générées par [Pollinations.ai](https://pollinations.ai)
  (gratuit, open source, sans clé API) à partir d'une description que Claude rédige pour
  chaque article.
- Volontairement, le thème « médecine naturelle » n'est pas couvert par la génération
  automatique : les contenus santé générés sans supervision se limitent à l'activité
  physique adaptée, la nutrition, le bien-être et les recettes — des sujets sur lesquels
  Claude peut rester factuel sans risquer de relayer des allégations non vérifiées. Tu
  peux bien sûr écrire toi-même un article sur ce thème directement dans NocoDB.
- Pour changer d'outil de génération d'image plus tard (ex. un autre modèle open source),
  il suffit de modifier le nœud "Preparer le brouillon" dans le workflow — tout le reste
  du système (NocoDB, Telegram, le site) continue de fonctionner à l'identique.
