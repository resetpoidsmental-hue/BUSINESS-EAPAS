# EAPAS Suite

Application de suivi patient, nutrition, administratif et portail client pour un
Enseignant en Activité Physique Adaptée et Santé (EAPAS) / Coach Nutrition.

Construite pour être **auto-hébergée** : toutes les données (y compris les données
de santé) restent sur ton propre serveur — aucune donnée n'est envoyée à un
service tiers. Coût d'hébergement : 0 € de plus que ton VPS actuel.

## Fonctionnalités

- **Patients & clients** : dossier complet, entretien initial guidé, bilans
  cliniques (les 7 tests PASS : TM6, TUG, équilibre, force, souplesse) avec
  comparaison T0/T1/T2 (tableau + graphiques d'évolution par test, groupés
  par catégorie) et un indicateur circulaire sur l'objectif principal,
  objectifs SMART, calculateur IPAQ, calculateur nutritionnel
  (Mifflin-St Jeor), planning des séances.
- **Tableau de bord** : vue d'ensemble, alertes (risque de chute TUG > 12s,
  bilans en retard, objectifs dépassés).
- **Nutrition** : calculateur rapide autonome + suivi des clients nutrition.
- **Administratif** : devis, contrats (avec préréglages Formule Essentiel /
  Premium), factures — tous exportables en PDF —, suivi des abonnements,
  livre de comptes et estimation URSSAF, modèles de messages prêts à copier.
- **SAV** : tickets de suivi des demandes et réclamations.
- **Portail patient** (à activer dans Réglages) : chaque patient reçoit un code
  d'accès personnel pour consulter son programme, ses bilans et ses factures.
  Il est aussi prévenu à l'avance du matériel nécessaire pour sa prochaine
  séance.
- **Assistant IA** (optionnel, nécessite une clé API Anthropic) : aide à
  préparer une fiche de séance détaillée (objectifs, échauffement/corps de
  séance/retour au calme, exercices avec RPE, matériel, sécurité, variantes,
  respiration, points de vigilance) à partir du profil du patient et de ses
  dernières séances, à rédiger un brouillon de réponse à un ticket SAV
  lié à un patient (à partir de son profil et du message du ticket), et à
  proposer les observations d'un bilan clinique (à partir des résultats
  saisis et, si disponible, du bilan T0 pour la comparaison). L'IA propose
  toujours un brouillon modifiable ; rien n'est écrit dans le dossier
  patient ni envoyé au patient sans validation explicite du coach.

## Stack technique

- [Next.js](https://nextjs.org) (React) + TypeScript + Tailwind CSS
- Base de données SQLite (fichier unique, via [Prisma](https://prisma.io)) —
  simple à sauvegarder, aucun serveur de base de données à gérer
- Génération de PDF avec [@react-pdf/renderer](https://react-pdf.org)
- Authentification maison (cookies signés), pas de dépendance à un service
  d'auth tiers

## Démarrage en local (développement)

```bash
npm install
cp .env.example .env        # puis remplace AUTH_SECRET par une vraie valeur
npx prisma migrate dev      # crée la base SQLite et applique les migrations
npm run seed                # (optionnel) données de démonstration
npm run dev
```

Ouvre <http://localhost:3000> — la première visite te propose de créer ton
compte professionnel.

### Tests automatisés

```bash
npm test
```

Couvre les fonctions critiques en calcul pur (IMC, métabolisme de base,
score IPAQ, apports nutritionnels, progression des tests PASS) et en
sécurité (hachage des mots de passe, des codes d'accès patients). Pas de
tests end-to-end pour l'instant — à ajouter si l'app grossit.

### Évolution du schéma de base de données

```bash
# après avoir modifié prisma/schema.prisma
npx prisma migrate dev --name description-du-changement
```

Ça crée un fichier SQL dans `prisma/migrations/`, à committer avec le code.
Ne reviens pas à `prisma db push` : sans historique de migrations, un
changement de schéma peut silencieusement perdre des données en production.

## Déploiement sur ton VPS (Docker)

Ce guide part du principe que tu as déjà un VPS (celui qui fait tourner n8n) et
un nom de domaine ou sous-domaine que tu peux pointer dessus (ex.
`suivi.ton-domaine.fr`).

### 1. Prérequis sur le VPS

Connecte-toi en SSH à ton VPS, puis installe Docker si ce n'est pas déjà fait :

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Récupérer le projet

```bash
git clone -b claude/business-eapas-project-jty172 https://github.com/resetpoidsmental-hue/BUSINESS-EAPAS.git eapas-suite
cd eapas-suite
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
nano .env
```

Renseigne au minimum :

```
DATABASE_URL="file:/app/data/prod.db"
AUTH_SECRET="<colle ici le résultat de : openssl rand -hex 32>"
APP_HOST="suivi.ton-domaine.fr"
```

Ajoute en plus `ANTHROPIC_API_KEY` (optionnel) si tu veux activer l'**Assistant
IA** — clé obtenue sur [console.anthropic.com](https://console.anthropic.com/settings/keys).
Laisse-la vide pour que le reste de l'application fonctionne normalement sans.

### 4. Brancher l'application sur le HTTPS

**Cas fréquent : tu as déjà un n8n installé via le template Docker Compose
communautaire (`traefik` + `n8n` dans le même fichier)** — c'est le cas si
`docker ps` montre un conteneur nommé `xxx-traefik-1`. Dans ce cas,
`docker-compose.yml` est déjà prêt à s'y brancher automatiquement : il ajoute
juste les étiquettes ("labels") Traefik nécessaires et rejoint le même réseau
Docker (par défaut `n8n_default` — renseigne `TRAEFIK_NETWORK` dans `.env` si
le tien porte un autre nom, visible avec `docker network ls`). Il te suffit de
lancer l'étape 5, rien d'autre à installer.

**Si tu n'as aucun reverse proxy sur ce VPS**, le plus simple est
[Caddy](https://caddyserver.com/) qui obtient un certificat HTTPS gratuit
automatiquement :

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Édite `/etc/caddy/Caddyfile` et ajoute :

```
suivi.ton-domaine.fr {
    reverse_proxy localhost:3000
}
```

Puis `sudo systemctl reload caddy`, et remplace dans `docker-compose.yml` la
section `networks`/`labels` par un simple `ports: ["3000:3000"]` (tu n'as pas
besoin des étiquettes Traefik dans ce cas).

Dans les deux cas, assure-toi que le DNS de `APP_HOST` pointe vers l'IP de ton
VPS (un enregistrement **A**, à créer chez ton registrar de domaine).

### 5. Lancer l'application

```bash
docker compose up -d --build
```

Le certificat HTTPS se génère automatiquement à la première visite (ça peut
prendre jusqu'à une minute). Va sur `https://<APP_HOST>`.

### 6. Créer ton compte

Va sur `https://suivi.ton-domaine.fr` — la première visite te propose de créer
ton compte professionnel (email + mot de passe). Ensuite, va dans **Réglages**
pour renseigner ton nom d'activité, SIRET, adresse, etc. (utilisés sur tes
devis/factures).

## Sauvegardes

Toutes tes données vivent dans un unique fichier SQLite, stocké dans le volume
Docker `eapas_data`. Pour le sauvegarder régulièrement (recommandé : un script
cron hebdomadaire) :

```bash
docker compose exec app sh -c "cp /app/data/prod.db /app/data/backup-$(date +%F).db"
docker cp $(docker compose ps -q app):/app/data/backup-$(date +%F).db ./sauvegardes/
```

Ou plus simplement, sauvegarde le volume Docker complet avec ton outil de
sauvegarde habituel.

## Mettre à jour l'application

```bash
git pull
docker compose up -d --build
```

Le schéma de base de données se met à jour automatiquement au démarrage
(`prisma migrate deploy` applique les migrations pas encore jouées — chaque
changement de structure est tracé dans `prisma/migrations/`, versionné avec
le code). En cas de changement de structure important, fais une sauvegarde
avant de mettre à jour.

## Facturation récurrente (abonnements, Stripe + Resend)

Optionnel — le reste de l'application fonctionne normalement sans. Une fois en
place : tes patients abonnés enregistrent leur carte depuis le Portail patient,
et l'app les prélève automatiquement chaque mois à la date prévue, crée la
facture et envoie un reçu par email. Aucune relance automatique en cas
d'échec — tu es informé(e) sur le tableau de bord et tu décides quoi faire.

### 1. Stripe

1. Crée un compte sur [dashboard.stripe.com](https://dashboard.stripe.com) (ou
   utilise celui que tu as déjà).
2. Récupère ta **clé secrète** (Développeurs → Clés API) et mets-la dans
   `STRIPE_SECRET_KEY`. Commence en mode **Test** pour vérifier que tout
   fonctionne avant de passer en mode **Live**.
3. Crée un **webhook** (Développeurs → Webhooks → Ajouter un point de
   terminaison) pointant vers `https://<APP_HOST>/api/stripe/webhook`, avec
   les événements : `checkout.session.completed`, `payment_intent.succeeded`,
   `payment_intent.payment_failed`. Copie le **secret de signature** généré
   dans `STRIPE_WEBHOOK_SECRET`.
4. Génère un `CRON_SECRET` avec `openssl rand -hex 32`.

### 2. Resend (envoi des reçus par email)

1. Crée un compte sur [resend.com](https://resend.com).
2. Ajoute et vérifie ton domaine (`sante-and-co.com` par exemple) : Resend te
   donne 2-3 enregistrements DNS (SPF, DKIM) à ajouter chez ton
   hébergeur/registrar du domaine. La vérification prend quelques minutes à
   quelques heures selon le DNS.
3. Crée une clé API et mets-la dans `RESEND_API_KEY`.
4. Choisis l'adresse d'envoi (doit être sur le domaine vérifié), par exemple
   `factures@sante-and-co.com`, et mets-la dans `RESEND_FROM_EMAIL`.

### 3. Déclencher les prélèvements chaque jour

L'app ne prélève jamais toute seule en continu : une tâche doit appeler
l'endpoint une fois par jour. Sur le VPS :

```bash
crontab -e
```

Ajoute (prélève tous les jours à 8h) :

```
0 8 * * * curl -s -X POST -H "x-cron-secret: <la même valeur que CRON_SECRET>" https://<APP_HOST>/api/cron/prelevements
```

## Rappels Telegram (séances à venir)

Optionnel — le reste de l'application fonctionne normalement sans. Une fois en
place : tu reçois sur ton propre Telegram un rappel la veille au soir et le
matin (liste des séances du jour), puis un rappel individuel 2h avant chaque
séance avec des boutons pour l'**annuler** ou la **déplacer** (+1h, +2h,
lendemain même heure) directement depuis Telegram — chaque horaire proposé
est vérifié contre tes horaires de travail et tes séances déjà prises ; s'il
ne convient pas, Telegram te propose de le confirmer comme créneau
exceptionnel avant que quoi que ce soit ne bouge. Tu reçois aussi un message
dès qu'une fiche de séance préparée par l'IA est enregistrée. Dans tous les
cas où une séance est annulée ou déplacée depuis Telegram, le patient en est
automatiquement informé dans son espace du Portail patient et par email (si
son adresse est connue) — jamais l'IA qui décide de le contacter, toujours
une conséquence directe de ton action.

### 1. Créer le bot Telegram

1. Ouvre une conversation avec [@BotFather](https://t.me/BotFather) sur
   Telegram, envoie `/newbot` et suis les instructions (nom, puis identifiant
   se terminant par `bot`).
2. BotFather te donne un **token** (ex. `123456789:AAEhB...`) — mets-le dans
   `TELEGRAM_BOT_TOKEN`.
3. Envoie n'importe quel message à ton nouveau bot (ex. "bonjour") depuis ton
   propre compte Telegram, pour qu'il connaisse ta conversation.
4. Récupère ton identifiant de conversation (`chat_id`) :
   ```bash
   curl -s "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates"
   ```
   Cherche `"chat":{"id":...}` dans la réponse — ce nombre va dans
   `TELEGRAM_CHAT_ID`.
5. Génère un `TELEGRAM_WEBHOOK_SECRET` avec `openssl rand -hex 32`.

### 2. Brancher le webhook (boutons Annuler/Déplacer)

Une fois le `.env` rempli et l'app déployée, indique à Telegram où envoyer
les taps sur les boutons :

```bash
curl -s -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<APP_HOST>/api/telegram/webhook", "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"}'
```

### 3. Déclencher les rappels

Même principe que les prélèvements : 3 tâches cron appellent l'app à heures
fixes (le `CRON_SECRET` existant protège aussi ces appels). Sur le VPS :

```bash
crontab -e
```

Ajoute :

```
45 20 * * * curl -s -X POST -H "x-cron-secret: <CRON_SECRET>" "https://<APP_HOST>/api/cron/telegram?mode=veille"
45 7 * * * curl -s -X POST -H "x-cron-secret: <CRON_SECRET>" "https://<APP_HOST>/api/cron/telegram?mode=matin"
*/15 * * * * curl -s -X POST -H "x-cron-secret: <CRON_SECRET>" "https://<APP_HOST>/api/cron/telegram?mode=rappel2h"
```

## Sécurité & RGPD

- Les mots de passe sont hachés (bcrypt), les sessions sont des cookies signés
  et **httpOnly** (inaccessibles en JavaScript).
- Les codes d'accès patients sont à usage unique par patient et révocables à
  tout moment depuis sa fiche.
- Les données de santé restent sur ton serveur — aucun tiers n'y a accès.
- Pense à activer les sauvegardes automatiques et à protéger l'accès SSH à ton
  VPS (clé SSH plutôt que mot de passe).
- Les modèles de devis/contrats/factures reprennent les mentions légales
  usuelles (auto-entrepreneur, TVA art. 293B, RGPD) mais **ne remplacent pas un
  avis juridique** — fais-les valider par un comptable/juriste avant usage réel.

## Site vitrine

Le dossier [`vitrine/`](./vitrine) contient un site public séparé (marketing, SEO,
formules, articles, recettes) connecté à EAPAS Suite via n8n. Voir
[`vitrine/README.md`](./vitrine/README.md) pour le déployer et finir de le connecter
(NocoDB, Telegram, n8n).

## Pistes d'évolution non incluses dans cette v1

- Toutes les pistes « Assistant IA » envisagées initialement sont désormais
  implémentées (préparation de fiche de séance, suggestion d'objectifs SMART
  et planning de séances associé, réponse aux tickets SAV, observations de
  bilan — voir « Assistant IA » ci-dessus).
- Questionnaire Ricci & Gagnon (mentionné dans certaines de tes ressources) en
  complément du calculateur IPAQ déjà implémenté.
